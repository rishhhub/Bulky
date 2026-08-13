package org.bulkby.payment.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

/**
 * Adapter that implements the order module's PaymentService interface
 * by delegating to the payment module's PaymentService.
 */
@Service
@Primary
public class OrderPaymentServiceAdapter implements org.bulkby.order.service.PaymentService {
    
    @Autowired
    private org.bulkby.payment.service.PaymentService paymentService;
    
    @Override
    public void processRefund(Long interestId) {
        // Delegate to payment module's service, ignoring return value
        paymentService.processRefund(interestId);
    }
    
    @Override
    public void processPartialRefund(Long interestId, java.math.BigDecimal refundAmount) {
        paymentService.processPartialRefund(interestId, refundAmount);
    }
    
    @Override
    public void processAdditionalDepositPayment(Long interestId, java.math.BigDecimal additionalAmount) {
        paymentService.processAdditionalDepositPayment(interestId, additionalAmount);
    }
}
