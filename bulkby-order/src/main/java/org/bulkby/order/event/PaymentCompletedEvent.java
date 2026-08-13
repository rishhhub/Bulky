package org.bulkby.order.event;

import java.math.BigDecimal;

public class PaymentCompletedEvent extends DomainEvent {
    private final Long interestId;
    private final Long userId;
    private final String paymentType;
    private final BigDecimal amount;
    private final String transactionId;
    
    public PaymentCompletedEvent(Long interestId, Long userId, String paymentType, 
                                BigDecimal amount, String transactionId) {
        super("PaymentCompleted");
        this.interestId = interestId;
        this.userId = userId;
        this.paymentType = paymentType;
        this.amount = amount;
        this.transactionId = transactionId;
    }
    
    public Long getInterestId() { return interestId; }
    public Long getUserId() { return userId; }
    public String getPaymentType() { return paymentType; }
    public BigDecimal getAmount() { return amount; }
    public String getTransactionId() { return transactionId; }
}
