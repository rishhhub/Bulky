package org.bulkby.order.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateInterestResponse {
    private InterestDTO interest;
    private BigDecimal additionalDepositRequired; // If quantity increased
    private BigDecimal refundAmount; // If quantity decreased
    private boolean requiresPayment;
    private boolean requiresRefund;
    private String message;
}
