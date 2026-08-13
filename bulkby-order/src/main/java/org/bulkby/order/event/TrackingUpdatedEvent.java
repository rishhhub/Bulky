package org.bulkby.order.event;

/**
 * Event published when OrderTracking is updated.
 * 
 * Provides detailed tracking information for order fulfillment.
 */
public class TrackingUpdatedEvent extends DomainEvent {
    private final Long trackingId;
    private final Long interestId;
    private final Long orderId;
    private final Long sellerOrderId;
    private final String status;
    private final String location;
    private final String notes;
    
    public TrackingUpdatedEvent(Long trackingId, Long interestId, Long orderId, 
                               Long sellerOrderId, String status, String location, String notes) {
        super("TrackingUpdated");
        this.trackingId = trackingId;
        this.interestId = interestId;
        this.orderId = orderId;
        this.sellerOrderId = sellerOrderId;
        this.status = status;
        this.location = location;
        this.notes = notes;
    }
    
    public Long getTrackingId() { return trackingId; }
    public Long getInterestId() { return interestId; }
    public Long getOrderId() { return orderId; }
    public Long getSellerOrderId() { return sellerOrderId; }
    public String getStatus() { return status; }
    public String getLocation() { return location; }
    public String getNotes() { return notes; }
}
