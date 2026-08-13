package org.bulkby.order.event;

/**
 * Event published when an Order status changes.
 * 
 * Tracks the fulfillment lifecycle of an Order.
 */
public class OrderStatusChangedEvent extends DomainEvent {
    private final Long orderId;
    private final Long interestId;
    private final String oldStatus;
    private final String newStatus;
    
    public OrderStatusChangedEvent(Long orderId, Long interestId, String oldStatus, String newStatus) {
        super("OrderStatusChanged");
        this.orderId = orderId;
        this.interestId = interestId;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
    }
    
    public Long getOrderId() { return orderId; }
    public Long getInterestId() { return interestId; }
    public String getOldStatus() { return oldStatus; }
    public String getNewStatus() { return newStatus; }
}
