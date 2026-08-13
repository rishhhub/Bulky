package org.bulkby.payment.service.impl;

import org.bulkby.auth.repository.UserRepository;
import org.bulkby.catalog.service.ProductService;
import org.bulkby.order.service.InterestService;
import org.bulkby.order.dto.InterestDTO;
import org.bulkby.payment.dto.PaymentDTO;
import org.bulkby.payment.model.Payment;
import org.bulkby.payment.repository.PaymentRepository;
import org.bulkby.payment.service.PaymentGateway;
import org.bulkby.payment.service.PaymentService;
import org.bulkby.notification.service.NotificationService;
import org.bulkby.order.service.OrderGroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.annotation.Primary;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PaymentServiceImpl implements PaymentService {
    
    @Autowired
    private PaymentRepository paymentRepository;
    
    @Autowired
    @Lazy
    private InterestService interestService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ProductService productService;
    
    @Autowired
    private PaymentGateway paymentGateway;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private OrderGroupService orderGroupService;
    
    private PaymentDTO convertToDTO(Payment payment) {
        return new PaymentDTO(
                payment.getId(),
                payment.getInterestId(),
                payment.getUserId(),
                payment.getAmount(),
                payment.getPaymentType().name(),
                payment.getStatus().name(),
                payment.getTransactionId(),
                payment.getRefundTransactionId(),
                payment.getCreatedAt()
        );
    }
    
    private String getCurrentUserContact() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : null;
    }
    
    @Override
    @Transactional
    public PaymentDTO processDepositPayment(Long interestId) {
        String contact = getCurrentUserContact();
        if (contact == null) {
            throw new RuntimeException("User not authenticated");
        }
        
        org.bulkby.auth.model.User user = userRepository.findByEmailOrPhone(contact)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        InterestDTO interest = interestService.getInterestByIdForPayment(interestId);
        
        if (interest == null) {
            throw new RuntimeException("Interest not found with id: " + interestId);
        }
        
        if (!interest.getUserId().equals(user.getId())) {
            throw new RuntimeException("Access denied: You do not own this interest");
        }
        
        // Check if deposit already paid
        List<Payment> existingDeposits = paymentRepository.findByInterestId(interestId).stream()
                .filter(p -> p.getPaymentType() == Payment.PaymentType.DEPOSIT && 
                             p.getStatus() == Payment.PaymentStatus.COMPLETED)
                .collect(Collectors.toList());
        
        if (!existingDeposits.isEmpty()) {
            throw new RuntimeException("Deposit already paid for this interest");
        }
        
        BigDecimal depositAmount = interest.getDepositPaid();
        BigDecimal logisticsAmount = BigDecimal.ZERO;
        
        // Check if logistics should be paid upfront
        if ("DELIVERY".equals(interest.getLogisticsPreference()) && 
            interest.getDeliveryCost() != null && 
            interest.getDeliveryCost().compareTo(BigDecimal.ZERO) > 0) {
            logisticsAmount = interest.getDeliveryCost();
        }
        
        BigDecimal totalAmount = depositAmount.add(logisticsAmount);
        
        // Determine payment description - if periodDays is 0, it's a direct order (full payment)
        String paymentDescription;
        if (interest.getPeriodDays() != null && interest.getPeriodDays() == 0) {
            paymentDescription = "Full payment for direct order #" + interestId;
        } else {
            paymentDescription = "Deposit payment for interest #" + interestId;
        }
        
        // Process payment through gateway
        String transactionId = paymentGateway.processPayment(
                totalAmount,
                paymentDescription
        );
        
        // Create payment record for deposit
        Payment depositPayment = new Payment();
        depositPayment.setInterestId(interestId);
        depositPayment.setUserId(user.getId());
        depositPayment.setAmount(depositAmount);
        depositPayment.setPaymentType(Payment.PaymentType.DEPOSIT);
        depositPayment.setStatus(Payment.PaymentStatus.COMPLETED);
        depositPayment.setTransactionId(transactionId);
        depositPayment = paymentRepository.save(depositPayment);
        
        // Create payment record for logistics if applicable
        if (logisticsAmount.compareTo(BigDecimal.ZERO) > 0) {
            Payment logisticsPayment = new Payment();
            logisticsPayment.setInterestId(interestId);
            logisticsPayment.setUserId(user.getId());
            logisticsPayment.setAmount(logisticsAmount);
            logisticsPayment.setPaymentType(Payment.PaymentType.LOGISTICS);
            logisticsPayment.setStatus(Payment.PaymentStatus.COMPLETED);
            logisticsPayment.setTransactionId(transactionId);
            paymentRepository.save(logisticsPayment);
        }
        
        // For direct orders (periodDays = 0), the deposit payment is the full amount
        // So we should check if order group completion should be triggered
        if (interest.getPeriodDays() != null && interest.getPeriodDays() == 0) {
            try {
                orderGroupService.checkOrderGroupCompletion();
            } catch (Exception e) {
                // Log but don't fail the payment
                System.err.println("Error checking order group completion after direct order payment: " + e.getMessage());
            }
        }
        
        return convertToDTO(depositPayment);
    }
    
    @Override
    @Transactional
    public PaymentDTO processRemainingBalancePayment(Long interestId) {
        String contact = getCurrentUserContact();
        if (contact == null) {
            throw new RuntimeException("User not authenticated");
        }
        
        org.bulkby.auth.model.User user = userRepository.findByEmailOrPhone(contact)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        InterestDTO interest = interestService.getInterestByIdForPayment(interestId);
        
        if (interest == null) {
            throw new RuntimeException("Interest not found with id: " + interestId);
        }
        
        if (!interest.getUserId().equals(user.getId())) {
            throw new RuntimeException("Access denied: You do not own this interest");
        }
        
        if (!"THRESHOLD_MET".equals(interest.getStatus())) {
            throw new RuntimeException("Interest is not ready for remaining balance payment. Current status: " + 
                (interest.getStatus() != null ? interest.getStatus() : "null") + 
                ". Expected status: THRESHOLD_MET");
        }
        
        // Check if remaining balance already paid
        List<Payment> existingRemaining = paymentRepository.findByInterestId(interestId).stream()
                .filter(p -> p.getPaymentType() == Payment.PaymentType.REMAINING && 
                             p.getStatus() == Payment.PaymentStatus.COMPLETED)
                .collect(Collectors.toList());
        
        if (!existingRemaining.isEmpty()) {
            throw new RuntimeException("Remaining balance already paid");
        }
        
        // Get product to calculate remaining balance
        org.bulkby.catalog.dto.ProductDTO product = productService.getProductById(interest.getProductId());
        
        if (product == null) {
            throw new RuntimeException("Product not found for interest id: " + interestId);
        }
        
        if (product.getPrice() == null) {
            throw new RuntimeException("Product price is not set for product id: " + product.getId());
        }
        
        BigDecimal totalProductCost = product.getPrice().multiply(BigDecimal.valueOf(interest.getQuantity()));
        BigDecimal depositPaid = interest.getDepositPaid() != null ? interest.getDepositPaid() : BigDecimal.ZERO;
        BigDecimal remainingBalance = totalProductCost.subtract(depositPaid);
        
        BigDecimal logisticsAmount = BigDecimal.ZERO;
        if ("DELIVERY".equals(interest.getLogisticsPreference())) {
            List<Payment> existingLogistics = paymentRepository.findByInterestId(interestId).stream()
                    .filter(p -> p.getPaymentType() == Payment.PaymentType.LOGISTICS && 
                                 p.getStatus() == Payment.PaymentStatus.COMPLETED)
                    .collect(Collectors.toList());
            
            if (existingLogistics.isEmpty() && 
                interest.getDeliveryCost() != null && 
                interest.getDeliveryCost().compareTo(BigDecimal.ZERO) > 0) {
                logisticsAmount = interest.getDeliveryCost();
            }
        }
        
        BigDecimal totalAmount = remainingBalance.add(logisticsAmount);
        
        String transactionId = paymentGateway.processPayment(
                totalAmount,
                "Remaining balance payment for interest #" + interestId
        );
        
        Payment remainingPayment = new Payment();
        remainingPayment.setInterestId(interestId);
        remainingPayment.setUserId(user.getId());
        remainingPayment.setAmount(remainingBalance);
        remainingPayment.setPaymentType(Payment.PaymentType.REMAINING);
        remainingPayment.setStatus(Payment.PaymentStatus.COMPLETED);
        remainingPayment.setTransactionId(transactionId);
        remainingPayment = paymentRepository.save(remainingPayment);
        
        if (logisticsAmount.compareTo(BigDecimal.ZERO) > 0) {
            Payment logisticsPayment = new Payment();
            logisticsPayment.setInterestId(interestId);
            logisticsPayment.setUserId(user.getId());
            logisticsPayment.setAmount(logisticsAmount);
            logisticsPayment.setPaymentType(Payment.PaymentType.LOGISTICS);
            logisticsPayment.setStatus(Payment.PaymentStatus.COMPLETED);
            logisticsPayment.setTransactionId(transactionId);
            paymentRepository.save(logisticsPayment);
        }
        
        // Check if order group completion should be triggered
        try {
            orderGroupService.checkOrderGroupCompletion();
        } catch (Exception e) {
            System.err.println("Error checking order group completion: " + e.getMessage());
        }
        
        return convertToDTO(remainingPayment);
    }
    
    @Override
    @Transactional
    public PaymentDTO processFullPaymentForDirectOrder(Long interestId) {
        String contact = getCurrentUserContact();
        if (contact == null) {
            throw new RuntimeException("User not authenticated");
        }
        
        org.bulkby.auth.model.User user = userRepository.findByEmailOrPhone(contact)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        InterestDTO interest = interestService.getInterestByIdForPayment(interestId);
        
        if (interest == null) {
            throw new RuntimeException("Interest not found with id: " + interestId);
        }
        
        if (!interest.getUserId().equals(user.getId())) {
            throw new RuntimeException("Access denied: You do not own this interest");
        }
        
        if (!"DIRECT_ORDER_READY".equals(interest.getStatus())) {
            throw new RuntimeException("Interest is not ready for direct order payment. Current status: " + 
                (interest.getStatus() != null ? interest.getStatus() : "null") + 
                ". Expected status: DIRECT_ORDER_READY");
        }
        
        org.bulkby.catalog.dto.ProductDTO product = productService.getProductById(interest.getProductId());
        
        if (product == null) {
            throw new RuntimeException("Product not found for interest id: " + interestId);
        }
        
        if (product.getPrice() == null) {
            throw new RuntimeException("Product price is not set for product id: " + product.getId());
        }
        
        BigDecimal totalProductCost = product.getPrice().multiply(BigDecimal.valueOf(interest.getQuantity()));
        BigDecimal depositPaid = interest.getDepositPaid() != null ? interest.getDepositPaid() : BigDecimal.ZERO;
        BigDecimal remainingBalance = totalProductCost.subtract(depositPaid);
        
        BigDecimal logisticsAmount = BigDecimal.ZERO;
        if ("DELIVERY".equals(interest.getLogisticsPreference())) {
            List<Payment> existingLogistics = paymentRepository.findByInterestId(interestId).stream()
                    .filter(p -> p.getPaymentType() == Payment.PaymentType.LOGISTICS && 
                                 p.getStatus() == Payment.PaymentStatus.COMPLETED)
                    .collect(Collectors.toList());
            
            if (existingLogistics.isEmpty() && 
                interest.getDeliveryCost() != null && 
                interest.getDeliveryCost().compareTo(BigDecimal.ZERO) > 0) {
                logisticsAmount = interest.getDeliveryCost();
            }
        }
        
        BigDecimal totalAmount = remainingBalance.add(logisticsAmount);
        
        String transactionId = paymentGateway.processPayment(
                totalAmount,
                "Full payment for direct order - interest #" + interestId
        );
        
        Payment remainingPayment = new Payment();
        remainingPayment.setInterestId(interestId);
        remainingPayment.setUserId(user.getId());
        remainingPayment.setAmount(remainingBalance);
        remainingPayment.setPaymentType(Payment.PaymentType.REMAINING);
        remainingPayment.setStatus(Payment.PaymentStatus.COMPLETED);
        remainingPayment.setTransactionId(transactionId);
        remainingPayment = paymentRepository.save(remainingPayment);
        
        if (logisticsAmount.compareTo(BigDecimal.ZERO) > 0) {
            Payment logisticsPayment = new Payment();
            logisticsPayment.setInterestId(interestId);
            logisticsPayment.setUserId(user.getId());
            logisticsPayment.setAmount(logisticsAmount);
            logisticsPayment.setPaymentType(Payment.PaymentType.LOGISTICS);
            logisticsPayment.setStatus(Payment.PaymentStatus.COMPLETED);
            logisticsPayment.setTransactionId(transactionId);
            paymentRepository.save(logisticsPayment);
        }
        
        notificationService.notifyDirectOrderPlaced(user.getId(), interestId, product.getName());
        
        return convertToDTO(remainingPayment);
    }
    
    @Override
    @Transactional
    public PaymentDTO processRefund(Long interestId) {
        InterestDTO interest = interestService.getInterestByIdForPayment(interestId);
        
        List<Payment> paymentsToRefund = paymentRepository.findByInterestId(interestId).stream()
                .filter(p -> p.getStatus() == Payment.PaymentStatus.COMPLETED && 
                             p.getPaymentType() != Payment.PaymentType.REFUND)
                .collect(Collectors.toList());
        
        if (paymentsToRefund.isEmpty()) {
            throw new RuntimeException("No payments to refund");
        }
        
        for (Payment payment : paymentsToRefund) {
            if (payment.getRefundTransactionId() == null) {
                String refundTransactionId = paymentGateway.processRefund(
                        payment.getTransactionId(),
                        payment.getAmount()
                );
                
                payment.setRefundTransactionId(refundTransactionId);
                payment.setStatus(Payment.PaymentStatus.REFUNDED);
                paymentRepository.save(payment);
                
                Payment refundPayment = new Payment();
                refundPayment.setInterestId(interestId);
                refundPayment.setUserId(interest.getUserId());
                refundPayment.setAmount(payment.getAmount());
                refundPayment.setPaymentType(Payment.PaymentType.REFUND);
                refundPayment.setStatus(Payment.PaymentStatus.COMPLETED);
                refundPayment.setTransactionId(refundTransactionId);
                paymentRepository.save(refundPayment);
            }
        }
        
        Payment refundPayment = paymentRepository.findByInterestId(interestId).stream()
                .filter(p -> p.getPaymentType() == Payment.PaymentType.REFUND)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Refund payment not created"));
        
        return convertToDTO(refundPayment);
    }
    
    @Override
    @Transactional
    public PaymentDTO processPartialRefund(Long interestId, BigDecimal refundAmount) {
        String contact = getCurrentUserContact();
        if (contact == null) {
            throw new RuntimeException("User not authenticated");
        }
        
        org.bulkby.auth.model.User user = userRepository.findByEmailOrPhone(contact)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        InterestDTO interest = interestService.getInterestByIdForPayment(interestId);
        
        if (interest == null) {
            throw new RuntimeException("Interest not found with id: " + interestId);
        }
        
        if (!interest.getUserId().equals(user.getId())) {
            throw new RuntimeException("Access denied: You do not own this interest");
        }
        
        if (refundAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Refund amount must be greater than zero");
        }
        
        // Find completed deposit payments that haven't been refunded
        List<Payment> depositPayments = paymentRepository.findByInterestId(interestId).stream()
                .filter(p -> p.getPaymentType() == Payment.PaymentType.DEPOSIT && 
                             p.getStatus() == Payment.PaymentStatus.COMPLETED &&
                             p.getRefundTransactionId() == null)
                .collect(Collectors.toList());
        
        if (depositPayments.isEmpty()) {
            throw new RuntimeException("No deposit payments found to refund");
        }
        
        // Calculate total available for refund
        BigDecimal totalDepositPaid = depositPayments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        if (refundAmount.compareTo(totalDepositPaid) > 0) {
            throw new RuntimeException("Refund amount cannot exceed total deposit paid");
        }
        
        // Process refund proportionally from deposit payments
        BigDecimal remainingRefund = refundAmount;
        Payment refundPayment = null;
        
        for (Payment depositPayment : depositPayments) {
            if (remainingRefund.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }
            
            BigDecimal refundFromThis = remainingRefund.min(depositPayment.getAmount());
            
            // Process refund through gateway
            String refundTransactionId = paymentGateway.processRefund(
                    depositPayment.getTransactionId(),
                    refundFromThis
            );
            
            // If full amount is being refunded, mark the original payment as refunded
            if (refundFromThis.compareTo(depositPayment.getAmount()) == 0) {
                depositPayment.setRefundTransactionId(refundTransactionId);
                depositPayment.setStatus(Payment.PaymentStatus.REFUNDED);
                paymentRepository.save(depositPayment);
            }
            
            // Create refund payment record
            refundPayment = new Payment();
            refundPayment.setInterestId(interestId);
            refundPayment.setUserId(user.getId());
            refundPayment.setAmount(refundFromThis);
            refundPayment.setPaymentType(Payment.PaymentType.REFUND);
            refundPayment.setStatus(Payment.PaymentStatus.COMPLETED);
            refundPayment.setTransactionId(refundTransactionId);
            refundPayment = paymentRepository.save(refundPayment);
            
            remainingRefund = remainingRefund.subtract(refundFromThis);
        }
        
        if (refundPayment == null) {
            throw new RuntimeException("Failed to process refund");
        }
        
        return convertToDTO(refundPayment);
    }
    
    @Override
    @Transactional
    public PaymentDTO processAdditionalDepositPayment(Long interestId, BigDecimal additionalAmount) {
        String contact = getCurrentUserContact();
        if (contact == null) {
            throw new RuntimeException("User not authenticated");
        }
        
        org.bulkby.auth.model.User user = userRepository.findByEmailOrPhone(contact)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        InterestDTO interest = interestService.getInterestByIdForPayment(interestId);
        
        if (interest == null) {
            throw new RuntimeException("Interest not found with id: " + interestId);
        }
        
        if (!interest.getUserId().equals(user.getId())) {
            throw new RuntimeException("Access denied: You do not own this interest");
        }
        
        if (additionalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Additional amount must be greater than zero");
        }
        
        // Process payment through gateway
        String transactionId = paymentGateway.processPayment(
                additionalAmount,
                "Additional deposit payment for interest #" + interestId
        );
        
        // Create payment record for additional deposit
        Payment additionalPayment = new Payment();
        additionalPayment.setInterestId(interestId);
        additionalPayment.setUserId(user.getId());
        additionalPayment.setAmount(additionalAmount);
        additionalPayment.setPaymentType(Payment.PaymentType.DEPOSIT);
        additionalPayment.setStatus(Payment.PaymentStatus.COMPLETED);
        additionalPayment.setTransactionId(transactionId);
        additionalPayment = paymentRepository.save(additionalPayment);
        
        return convertToDTO(additionalPayment);
    }
    
    
    @Override
    public List<PaymentDTO> getUserPayments() {
        String contact = getCurrentUserContact();
        if (contact == null) {
            throw new RuntimeException("User not authenticated");
        }
        
        org.bulkby.auth.model.User user = userRepository.findByEmailOrPhone(contact)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return paymentRepository.findByUserId(user.getId())
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
}
