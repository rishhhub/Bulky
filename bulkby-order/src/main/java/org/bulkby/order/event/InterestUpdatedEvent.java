package org.bulkby.order.event;

public class InterestUpdatedEvent extends DomainEvent {
    private final Long interestId;
    private final Long productId;
    private final Integer oldQuantity;
    private final Integer newQuantity;
    private final String status;
    
    public InterestUpdatedEvent(Long interestId, Long productId, 
                               Integer oldQuantity, Integer newQuantity, String status) {
        super("InterestUpdated");
        this.interestId = interestId;
        this.productId = productId;
        this.oldQuantity = oldQuantity;
        this.newQuantity = newQuantity;
        this.status = status;
    }
    
    public Long getInterestId() { return interestId; }
    public Long getProductId() { return productId; }
    public Integer getOldQuantity() { return oldQuantity; }
    public Integer getNewQuantity() { return newQuantity; }
    public String getStatus() { return status; }
}
