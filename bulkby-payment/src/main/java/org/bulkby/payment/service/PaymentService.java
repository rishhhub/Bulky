package org.bulkby.payment.service;

import org.bulkby.payment.dto.PaymentDTO;

import java.math.BigDecimal;
import java.util.List;

public interface PaymentService {
    PaymentDTO processDepositPayment(Long interestId);
    PaymentDTO processRemainingBalancePayment(Long interestId);
    PaymentDTO processFullPaymentForDirectOrder(Long interestId);
    PaymentDTO processRefund(Long interestId);
    PaymentDTO processPartialRefund(Long interestId, BigDecimal refundAmount);
    PaymentDTO processAdditionalDepositPayment(Long interestId, BigDecimal additionalAmount);
    List<PaymentDTO> getUserPayments();
}
