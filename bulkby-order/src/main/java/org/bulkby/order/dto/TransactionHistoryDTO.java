package org.bulkby.order.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for transaction history.
 * Provides complete audit trail with calculations.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionHistoryDTO {
    private Long id;
    private Long interestId;
    private Long orderGroupId;
    private String transactionType; // CREATED, QUANTITY_CHANGED, PAYMENT_RECEIVED, etc.
    private String oldValue; // Old quantity, status, or amount
    private String newValue; // New quantity, status, or amount
    private BigDecimal amount; // Amount involved (for payments, refunds)
    private String calculation; // Formula showing how amount was calculated
    private Long relatedPaymentId; // Reference to Payment if applicable
    private Long userId; // User who made the change
    private Long adminId; // Admin who made the change
    private String description; // Description/notes
    private LocalDateTime createdAt; // When transaction occurred
}
