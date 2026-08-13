package org.bulkby.payment.service.impl;

import org.bulkby.payment.service.PaymentGateway;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Component
public class MockPaymentGateway implements PaymentGateway {
    
    @Override
    public String processPayment(BigDecimal amount, String description) {
        // Mock payment processing - always succeeds
        // In production, this would integrate with actual payment gateway
        try {
            Thread.sleep(100); // Simulate API call delay
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        return "MOCK_TXN_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
    }
    
    @Override
    public String processRefund(String transactionId, BigDecimal amount) {
        // Mock refund processing
        try {
            Thread.sleep(100); // Simulate API call delay
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        return "MOCK_REFUND_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
    }
}
