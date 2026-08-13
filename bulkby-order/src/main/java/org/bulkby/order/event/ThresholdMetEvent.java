package org.bulkby.order.event;

import java.util.List;

public class ThresholdMetEvent extends DomainEvent {
    private final Long orderGroupId;
    private final Long productId;
    private final Integer totalQuantity;
    private final Integer requiredQuantity;
    private final List<Long> interestIds;
    private final List<Long> userIds;
    
    public ThresholdMetEvent(Long orderGroupId, Long productId, Integer totalQuantity, 
                            Integer requiredQuantity, List<Long> interestIds, List<Long> userIds) {
        super("ThresholdMet");
        this.orderGroupId = orderGroupId;
        this.productId = productId;
        this.totalQuantity = totalQuantity;
        this.requiredQuantity = requiredQuantity;
        this.interestIds = interestIds;
        this.userIds = userIds;
    }
    
    public Long getOrderGroupId() { return orderGroupId; }
    public Long getProductId() { return productId; }
    public Integer getTotalQuantity() { return totalQuantity; }
    public Integer getRequiredQuantity() { return requiredQuantity; }
    public List<Long> getInterestIds() { return interestIds; }
    public List<Long> getUserIds() { return userIds; }
}
