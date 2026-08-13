package org.bulkby.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDTO {
    private Long id;
    private Long interestId;
    private Long userId;
    private BigDecimal amount;
    private String paymentType;
    private String status;
    private String transactionId;
    private String refundTransactionId;
    private LocalDateTime createdAt;
}
