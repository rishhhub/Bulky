package org.bulkby.notification.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId; // Reference to user in auth module
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;
    
    @Column(nullable = false)
    private Boolean read = false;
    
    @Column(name = "related_interest_id")
    private Long relatedInterestId;
    
    @Column(name = "related_order_group_id")
    private Long relatedOrderGroupId;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    public enum NotificationType {
        PERIOD_EXPIRED,
        THRESHOLD_MET,
        PAYMENT_REMINDER,
        ORDER_PLACED,
        REFUND_PROCESSED,
        DIRECT_ORDER_READY,
        DIRECT_ORDER_AVAILABLE,
        ORDER_SHIPPED,
        ORDER_ARRIVED,
        READY_FOR_PICKUP,
        OUT_FOR_DELIVERY,
        ORDER_PICKED_UP,
        ORDER_DELIVERED
    }
}
