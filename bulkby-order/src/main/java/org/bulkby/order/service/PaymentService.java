package org.bulkby.order.service;

import java.math.BigDecimal;

public interface PaymentService {
    void processRefund(Long interestId);
    void processPartialRefund(Long interestId, BigDecimal refundAmount);
    void processAdditionalDepositPayment(Long interestId, BigDecimal additionalAmount);
}
