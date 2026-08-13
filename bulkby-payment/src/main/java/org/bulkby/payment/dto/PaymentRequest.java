package org.bulkby.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequest {
    private Long interestId;
    private String paymentType; // "DEPOSIT", "REMAINING", "LOGISTICS"
}
