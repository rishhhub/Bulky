package org.bulkby.order.event;

/**
 * Event published when an Interest becomes an Order.
 * 
 * This event marks the transition from pre-order (Interest) to actual order (Order).
 * All payment transactions remain traceable through Interest → Payments.
 */
public class OrderCreatedEvent extends DomainEvent {
    private final Long orderId;
    private final Long interestId;
    private final Long orderGroupId;
    private final Long sellerOrderId;
    private final String orderNumber;
    private final Long userId;
    private final Long productId;
    
    public OrderCreatedEvent(Long orderId, Long interestId, Long orderGroupId, 
                            Long sellerOrderId, String orderNumber, Long userId, Long productId) {
        super("OrderCreated");
        this.orderId = orderId;
        this.interestId = interestId;
        this.orderGroupId = orderGroupId;
        this.sellerOrderId = sellerOrderId;
        this.orderNumber = orderNumber;
        this.userId = userId;
        this.productId = productId;
    }
    
    public Long getOrderId() { return orderId; }
    public Long getInterestId() { return interestId; }
    public Long getOrderGroupId() { return orderGroupId; }
    public Long getSellerOrderId() { return sellerOrderId; }
    public String getOrderNumber() { return orderNumber; }
    public Long getUserId() { return userId; }
    public Long getProductId() { return productId; }
}
