package org.bulkby.notification.service.impl;

import org.bulkby.notification.dto.NotificationDTO;
import org.bulkby.notification.model.Notification;
import org.bulkby.notification.repository.NotificationRepository;
import org.bulkby.notification.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationServiceImpl implements NotificationService {
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private org.bulkby.auth.repository.UserRepository userRepository;
    
    @Override
    @Transactional
    public void notifyPeriodExpired(Long userId, Long interestId, String productName) {
        String message = String.format(
                "Your interest period for product '%s' has expired. Please extend your period or withdraw to get a refund.",
                productName
        );
        createNotification(userId, message, Notification.NotificationType.PERIOD_EXPIRED, interestId, null);
        System.out.println("NOTIFICATION to user " + userId + ": " + message);
    }
    
    @Override
    @Transactional
    public void notifyThresholdMet(List<Long> userIds, List<Long> interestIds, String productName) {
        for (int i = 0; i < userIds.size(); i++) {
            Long userId = userIds.get(i);
            Long interestId = interestIds.get(i);
            String message = String.format(
                    "Great news! Enough users have shown interest in '%s'. Please pay the remaining balance (90%%) to proceed with the order.",
                    productName
            );
            createNotification(userId, message, Notification.NotificationType.THRESHOLD_MET, interestId, null);
            System.out.println("NOTIFICATION to user " + userId + ": " + message);
        }
    }
    
    @Override
    @Transactional
    public void notifyPaymentReminder(Long userId, Long interestId, String productName) {
        String message = String.format(
                "Reminder: Please pay the remaining balance for '%s' to complete your order.",
                productName
        );
        createNotification(userId, message, Notification.NotificationType.PAYMENT_REMINDER, interestId, null);
    }
    
    @Override
    @Transactional
    public void notifyOrderPlaced(Long userId, Long interestId, String productName) {
        String message = String.format(
                "Your order for '%s' has been placed successfully! You will receive updates on delivery/pickup.",
                productName
        );
        createNotification(userId, message, Notification.NotificationType.ORDER_PLACED, interestId, null);
    }
    
    @Override
    @Transactional
    public void notifyRefundProcessed(Long userId, Long interestId, String productName) {
        String message = String.format(
                "Your refund for interest #%d has been processed and will be credited to your account.",
                interestId
        );
        createNotification(userId, message, Notification.NotificationType.REFUND_PROCESSED, interestId, null);
    }
    
    @Override
    @Transactional
    public void notifyDirectOrderReady(Long userId, Long interestId, String productName) {
        String message = String.format(
                "Your order quantity meets the seller's minimum requirement! You can pay the full amount now and place the order directly for '%s'.",
                productName
        );
        createNotification(userId, message, Notification.NotificationType.DIRECT_ORDER_READY, interestId, null);
    }
    
    @Override
    @Transactional
    public void notifyDirectOrderPlaced(Long userId, Long interestId, String productName) {
        String message = String.format(
                "Your order for '%s' has been placed successfully! You will receive updates on delivery/pickup.",
                productName
        );
        createNotification(userId, message, Notification.NotificationType.ORDER_PLACED, interestId, null);
    }
    
    @Override
    @Transactional
    public void notifyAllPaymentsComplete(Long orderGroupId, String productName, List<Long> userIds) {
        // Notify admin users
        List<org.bulkby.auth.model.User> adminUsers = userRepository.findByRole(org.bulkby.auth.model.User.Role.ADMIN);
        String adminMessage = String.format(
                "Order Group #%d for product '%s' is ready. All users have paid. Please place the bulk order with the seller.",
                orderGroupId,
                productName
        );
        for (org.bulkby.auth.model.User admin : adminUsers) {
            createNotification(admin.getId(), adminMessage, Notification.NotificationType.ORDER_PLACED, 
                            null, orderGroupId);
        }
        
        // Notify all users in the order group
        String userMessage = String.format(
                "All payments received! Your order for '%s' is being placed with the seller. You will receive updates soon.",
                productName
        );
        for (Long userId : userIds) {
            createNotification(userId, userMessage, Notification.NotificationType.ORDER_PLACED, 
                            null, orderGroupId);
        }
    }
    
    private void createNotification(Long userId, String message, Notification.NotificationType type, 
                                   Long interestId, Long orderGroupId) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setMessage(message);
        notification.setType(type);
        notification.setRead(false);
        notification.setRelatedInterestId(interestId);
        notification.setRelatedOrderGroupId(orderGroupId);
        notificationRepository.save(notification);
    }
    
    @Override
    public List<NotificationDTO> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public Long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }
    
    @Override
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        if (!notification.getUserId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        
        notification.setRead(true);
        notificationRepository.save(notification);
    }
    
    @Override
    @Transactional
    public void notifyOrderPlacedWithSeller(Long orderGroupId, String productName, String sellerOrderNumber, String warehouseName, List<Long> userIds) {
        String message = String.format(
                "Your order for '%s' has been placed with the seller (Order #%s). It will be delivered to %s. You'll receive updates on tracking.",
                productName,
                sellerOrderNumber,
                warehouseName
        );
        for (Long userId : userIds) {
            createNotification(userId, message, Notification.NotificationType.ORDER_PLACED, null, orderGroupId);
        }
    }
    
    @Override
    @Transactional
    public void notifyOrderArrivedAtWarehouse(Long orderGroupId, String productName, String warehouseName, String warehouseAddress, List<Long> pickupUserIds, List<Long> deliveryUserIds) {
        // Notify pickup users
        for (Long userId : pickupUserIds) {
            String message = String.format(
                    "Your order for '%s' has arrived at %s (%s). Please come to pick it up during warehouse hours.",
                    productName,
                    warehouseName,
                    warehouseAddress
            );
            createNotification(userId, message, Notification.NotificationType.READY_FOR_PICKUP, null, orderGroupId);
        }
        
        // Notify delivery users
        for (Long userId : deliveryUserIds) {
            String message = String.format(
                    "Your order for '%s' has arrived at the warehouse and is out for delivery to your address. You'll receive it soon!",
                    productName
            );
            createNotification(userId, message, Notification.NotificationType.OUT_FOR_DELIVERY, null, orderGroupId);
        }
    }
    
    @Override
    @Transactional
    public void notifyOrderPickedUp(Long userId, String productName, Long interestId) {
        String message = String.format(
                "Thank you! Your order for '%s' has been picked up successfully.",
                productName
        );
        createNotification(userId, message, Notification.NotificationType.ORDER_PICKED_UP, interestId, null);
    }
    
    @Override
    @Transactional
    public void notifyOrderDelivered(Long userId, String productName, Long interestId) {
        String message = String.format(
                "Great news! Your order for '%s' has been delivered to your address.",
                productName
        );
        createNotification(userId, message, Notification.NotificationType.ORDER_DELIVERED, interestId, null);
    }
    
    @Override
    @Transactional
    public void notifyWishlistUsersDirectOrderAvailable(Long orderGroupId, List<Long> userIds, String productName, String cityName) {
        for (Long userId : userIds) {
            String message = String.format(
                    "Great news! A bulk order for '%s' has reached the minimum threshold in %s. You can place a direct order now! Limited time offer.",
                    productName, cityName
            );
            createNotification(userId, message, Notification.NotificationType.DIRECT_ORDER_AVAILABLE, null, orderGroupId);
            System.out.println("NOTIFICATION to user " + userId + ": " + message);
        }
    }
    
    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unreadNotifications = notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId);
        for (Notification notification : unreadNotifications) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
    }
    
    private NotificationDTO convertToDTO(Notification notification) {
        return new NotificationDTO(
                notification.getId(),
                notification.getMessage(),
                notification.getType().name(),
                notification.getRead(),
                notification.getRelatedInterestId(),
                notification.getRelatedOrderGroupId(),
                notification.getCreatedAt()
        );
    }
}
