package org.bulkby.order.service;

import java.util.List;

/**
 * Service interface for querying payment status.
 * Implementation uses ApplicationContext to access PaymentRepository at runtime,
 * breaking the compile-time circular dependency.
 */
public interface PaymentQueryService {
    boolean hasRemainingPaymentCompleted(Long interestId);
    List<PaymentInfo> getPaymentsByInterestId(Long interestId);
    
    class PaymentInfo {
        private Long id;
        private String paymentType;
        private java.math.BigDecimal amount;
        private String status;
        private String transactionId;
        private java.time.LocalDateTime createdAt;
        
        public PaymentInfo(Long id, String paymentType, java.math.BigDecimal amount, 
                          String status, String transactionId, java.time.LocalDateTime createdAt) {
            this.id = id;
            this.paymentType = paymentType;
            this.amount = amount;
            this.status = status;
            this.transactionId = transactionId;
            this.createdAt = createdAt;
        }
        
        // Getters
        public Long getId() { return id; }
        public String getPaymentType() { return paymentType; }
        public java.math.BigDecimal getAmount() { return amount; }
        public String getStatus() { return status; }
        public String getTransactionId() { return transactionId; }
        public java.time.LocalDateTime getCreatedAt() { return createdAt; }
    }
}
