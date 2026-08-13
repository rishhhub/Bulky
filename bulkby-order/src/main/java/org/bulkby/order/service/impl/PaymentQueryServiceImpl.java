package org.bulkby.order.service.impl;

import org.bulkby.order.service.PaymentQueryService;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Implementation that uses ApplicationContext to access PaymentRepository at runtime.
 * This breaks the compile-time circular dependency between order and payment modules.
 */
@Service
public class PaymentQueryServiceImpl implements PaymentQueryService, ApplicationContextAware {
    
    private ApplicationContext applicationContext;
    
    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        this.applicationContext = applicationContext;
    }
    
    @Override
    public boolean hasRemainingPaymentCompleted(Long interestId) {
        try {
            Object paymentRepository = applicationContext.getBean("paymentRepository");
            if (paymentRepository == null) {
                return false;
            }
            
            // Use reflection to call findByInterestId
            java.lang.reflect.Method findByInterestId = paymentRepository.getClass()
                    .getMethod("findByInterestId", Long.class);
            @SuppressWarnings("unchecked")
            List<Object> payments = (List<Object>) findByInterestId.invoke(paymentRepository, interestId);
            
            if (payments == null || payments.isEmpty()) {
                return false;
            }
            
            // Check if any payment has type REMAINING and status COMPLETED
            boolean hasRemainingPayment = false;
            boolean hasCompletedDeposit = false;
            
            for (Object payment : payments) {
                try {
                    java.lang.reflect.Method getPaymentType = payment.getClass().getMethod("getPaymentType");
                    java.lang.reflect.Method getStatus = payment.getClass().getMethod("getStatus");
                    
                    Object paymentType = getPaymentType.invoke(payment);
                    Object status = getStatus.invoke(payment);
                    
                    if (paymentType != null && status != null) {
                        String paymentTypeStr = paymentType.toString();
                        String statusStr = status.toString();
                        
                        // Check if it's REMAINING and COMPLETED
                        if ("REMAINING".equals(paymentTypeStr) && "COMPLETED".equals(statusStr)) {
                            hasRemainingPayment = true;
                        }
                        
                        // Check if it's DEPOSIT and COMPLETED (for direct orders)
                        if ("DEPOSIT".equals(paymentTypeStr) && "COMPLETED".equals(statusStr)) {
                            hasCompletedDeposit = true;
                        }
                    }
                } catch (Exception e) {
                    // Continue to next payment
                }
            }
            
            // If there's a REMAINING payment, it's paid
            if (hasRemainingPayment) {
                return true;
            }
            
            // For direct orders: if deposit is paid and periodDays is 0, consider it as fully paid
            // (Direct orders pay full amount as deposit, so completed deposit = fully paid)
            if (hasCompletedDeposit) {
                try {
                    // Get InterestRepository to check if it's a direct order
                    Object interestRepository = applicationContext.getBean("interestRepository");
                    if (interestRepository != null) {
                        java.lang.reflect.Method findById = interestRepository.getClass()
                                .getMethod("findById", Object.class);
                        java.util.Optional<?> interestOpt = (java.util.Optional<?>) findById.invoke(interestRepository, interestId);
                        
                        if (interestOpt != null && interestOpt.isPresent()) {
                            Object interest = interestOpt.get();
                            
                            // Get periodDays - if 0, it's a direct order
                            java.lang.reflect.Method getPeriodDays = interest.getClass().getMethod("getPeriodDays");
                            Integer periodDays = (Integer) getPeriodDays.invoke(interest);
                            
                            // Get depositPaid
                            java.lang.reflect.Method getDepositPaid = interest.getClass().getMethod("getDepositPaid");
                            java.math.BigDecimal depositPaid = (java.math.BigDecimal) getDepositPaid.invoke(interest);
                            
                            // If periodDays is 0 (direct order) and depositPaid is set, it's fully paid
                            // Direct orders pay the full amount as deposit, so if deposit is paid, they're fully paid
                            if (periodDays != null && periodDays == 0 && depositPaid != null && 
                                depositPaid.compareTo(java.math.BigDecimal.ZERO) > 0) {
                                return true;
                            }
                        }
                    }
                } catch (Exception e) {
                    // If we can't verify, fall back to false
                    System.err.println("Error checking direct order payment status: " + e.getMessage());
                }
            }
            
            return false;
        } catch (Exception e) {
            System.err.println("Error checking payment status: " + e.getMessage());
            return false;
        }
    }
    
    @Override
    public List<PaymentInfo> getPaymentsByInterestId(Long interestId) {
        try {
            Object paymentRepository = applicationContext.getBean("paymentRepository");
            if (paymentRepository == null) {
                return new ArrayList<>();
            }
            
            java.lang.reflect.Method findByInterestId = paymentRepository.getClass()
                    .getMethod("findByInterestId", Long.class);
            @SuppressWarnings("unchecked")
            List<Object> payments = (List<Object>) findByInterestId.invoke(paymentRepository, interestId);
            
            if (payments == null) {
                return new ArrayList<>();
            }
            
            List<PaymentInfo> result = new ArrayList<>();
            for (Object payment : payments) {
                try {
                    Long id = (Long) payment.getClass().getMethod("getId").invoke(payment);
                    Object paymentType = payment.getClass().getMethod("getPaymentType").invoke(payment);
                    java.math.BigDecimal amount = (java.math.BigDecimal) payment.getClass().getMethod("getAmount").invoke(payment);
                    Object status = payment.getClass().getMethod("getStatus").invoke(payment);
                    String transactionId = (String) payment.getClass().getMethod("getTransactionId").invoke(payment);
                    java.time.LocalDateTime createdAt = (java.time.LocalDateTime) payment.getClass().getMethod("getCreatedAt").invoke(payment);
                    
                    result.add(new PaymentInfo(
                            id,
                            paymentType != null ? paymentType.toString() : null,
                            amount,
                            status != null ? status.toString() : null,
                            transactionId,
                            createdAt
                    ));
                } catch (Exception e) {
                    // Skip this payment
                }
            }
            
            return result;
        } catch (Exception e) {
            System.err.println("Error getting payments: " + e.getMessage());
            return new ArrayList<>();
        }
    }
}
