package org.bulkby.payment.service;

import java.math.BigDecimal;

public interface PaymentGateway {
    String processPayment(BigDecimal amount, String description);
    String processRefund(String transactionId, BigDecimal amount);
}
