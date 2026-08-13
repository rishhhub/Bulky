package org.bulkby.order.event;

import java.math.BigDecimal;

public class InterestCreatedEvent extends DomainEvent {
    private final Long interestId;
    private final Long userId;
    private final Long productId;
    private final Integer quantity;
    private final BigDecimal depositPaid;
    private final String status;
    
    public InterestCreatedEvent(Long interestId, Long userId, Long productId, 
                               Integer quantity, BigDecimal depositPaid, String status) {
        super("InterestCreated");
        this.interestId = interestId;
        this.userId = userId;
        this.productId = productId;
        this.quantity = quantity;
        this.depositPaid = depositPaid;
        this.status = status;
    }
    
    public Long getInterestId() { return interestId; }
    public Long getUserId() { return userId; }
    public Long getProductId() { return productId; }
    public Integer getQuantity() { return quantity; }
    public BigDecimal getDepositPaid() { return depositPaid; }
    public String getStatus() { return status; }
}
