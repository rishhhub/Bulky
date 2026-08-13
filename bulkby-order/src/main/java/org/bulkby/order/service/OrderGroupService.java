package org.bulkby.order.service;

import org.bulkby.order.dto.OrderDetailDTO;
import org.bulkby.order.dto.OrderGroupDTO;
import org.bulkby.order.dto.PendingInterestDTO;

import java.util.List;

public interface OrderGroupService {
    void checkThresholdForProduct(Long productId);
    void checkAndCreateOrderGroups();
    void checkAndCreateOrderGroupsForActiveInterests();
    void checkOrderGroupCompletion();
    void triggerOrderGroupCompletionCheck();
    List<OrderGroupDTO> getAllOrderGroups();
    List<PendingInterestDTO> getPendingInterestsSummary();
    void markPickedUp(Long interestId);
    void markDelivered(Long interestId, String deliveryTrackingId);
    OrderDetailDTO getOrderGroupDetails(Long id);
    
    // Direct order management
    void setAcceptingNewOrders(Long orderGroupId, Boolean accepting);
    void setAcceptingNewOrdersForAll(Boolean accepting);
    boolean isDirectOrderAvailable(Long productId, Long cityId);
}
