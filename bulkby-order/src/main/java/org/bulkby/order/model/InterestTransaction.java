package org.bulkby.order.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Transaction history entity to track all changes to Interests.
 * 
 * Provides complete audit trail for:
 * - Interest creation
 * - Quantity changes (with refunds/additional deposits)
 * - Status changes
 * - Payment transactions
 * - Refunds
 * - Extensions
 * 
 * All transactions are immutable once created (audit trail).
 */
@Entity
@Table(name = "interest_transactions", indexes = {
    @Index(name = "idx_interest_id", columnList = "interest_id"),
    @Index(name = "idx_order_group_id", columnList = "order_group_id"),
    @Index(name = "idx_transaction_type", columnList = "transaction_type"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InterestTransaction {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Reference to Interest this transaction belongs to
     */
    @Column(name = "interest_id", nullable = false)
    private Long interestId;
    
    /**
     * Reference to OrderGroup (for aggregation)
     */
    @Column(name = "order_group_id")
    private Long orderGroupId;
    
    /**
     * Type of transaction
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false)
    private TransactionType transactionType;
    
    /**
     * Old value (for changes - quantity, status, amount)
     */
    @Column(name = "old_value")
    private String oldValue; // JSON or string representation
    
    /**
     * New value (for changes - quantity, status, amount)
     */
    @Column(name = "new_value")
    private String newValue; // JSON or string representation
    
    /**
     * Amount involved in transaction (for payments, refunds, adjustments)
     */
    @Column(name = "amount", precision = 10, scale = 2)
    private BigDecimal amount;
    
    /**
     * Calculation formula showing how amount was calculated
     * Example: "quantity × unitPrice × 0.10 = 100.00"
     */
    @Column(name = "calculation", columnDefinition = "TEXT")
    private String calculation;
    
    /**
     * Reference to related Payment (if applicable)
     */
    @Column(name = "related_payment_id")
    private Long relatedPaymentId;
    
    /**
     * User who made the change (for user-initiated actions)
     */
    @Column(name = "user_id")
    private Long userId;
    
    /**
     * Admin who made the change (for admin-initiated actions)
     */
    @Column(name = "admin_id")
    private Long adminId;
    
    /**
     * Description/notes about the transaction
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    /**
     * Timestamp when transaction occurred
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    /**
     * Transaction types for audit trail
     */
    public enum TransactionType {
        CREATED,              // Interest created
        QUANTITY_CHANGED,     // Quantity updated (with refund/additional deposit)
        STATUS_CHANGED,       // Status transition
        PAYMENT_RECEIVED,     // Payment received (DEPOSIT, REMAINING, LOGISTICS)
        REFUND_ISSUED,        // Refund processed
        EXTENDED,             // Interest period extended
        WITHDRAWN,            // Interest withdrawn
        ADDRESS_CHANGED,      // Delivery address changed
        WAREHOUSE_CHANGED,    // Pickup warehouse changed
        LOGISTICS_CHANGED     // Logistics preference changed
    }
}
