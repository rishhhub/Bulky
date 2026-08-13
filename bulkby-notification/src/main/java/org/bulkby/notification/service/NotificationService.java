package org.bulkby.notification.service;

import org.bulkby.notification.dto.NotificationDTO;

import java.util.List;

public interface NotificationService {
    void notifyPeriodExpired(Long userId, Long interestId, String productName);
    void notifyThresholdMet(List<Long> userIds, List<Long> interestIds, String productName);
    void notifyPaymentReminder(Long userId, Long interestId, String productName);
    void notifyOrderPlaced(Long userId, Long interestId, String productName);
    void notifyRefundProcessed(Long userId, Long interestId, String productName);
    void notifyDirectOrderReady(Long userId, Long interestId, String productName);
    void notifyDirectOrderPlaced(Long userId, Long interestId, String productName);
    void notifyAllPaymentsComplete(Long orderGroupId, String productName, List<Long> userIds);
    void notifyOrderPlacedWithSeller(Long orderGroupId, String productName, String sellerOrderNumber, String warehouseName, List<Long> userIds);
    void notifyOrderArrivedAtWarehouse(Long orderGroupId, String productName, String warehouseName, String warehouseAddress, List<Long> pickupUserIds, List<Long> deliveryUserIds);
    void notifyOrderPickedUp(Long userId, String productName, Long interestId);
    void notifyOrderDelivered(Long userId, String productName, Long interestId);
    void notifyWishlistUsersDirectOrderAvailable(Long orderGroupId, List<Long> userIds, String productName, String cityName);
    List<NotificationDTO> getUserNotifications(Long userId);
    Long getUnreadCount(Long userId);
    void markAsRead(Long notificationId, Long userId);
}
