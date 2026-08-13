package org.bulkby.order.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "interests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Interest {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId; // Reference to user in auth module
    
    @Column(name = "product_id", nullable = false)
    private Long productId; // Reference to product in catalog module
    
    @Column(nullable = false)
    private Integer quantity;
    
    @Column(name = "deposit_paid", precision = 10, scale = 2)
    private BigDecimal depositPaid;
    
    @Column(name = "period_days", nullable = false)
    private Integer periodDays;
    
    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;
    
    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "logistics_preference", nullable = false)
    private LogisticsPreference logisticsPreference;
    
    @Column(name = "delivery_address", columnDefinition = "TEXT")
    private String deliveryAddress;
    
    @Column(name = "pincode", length = 6)
    private String pincode; // 6-digit pincode for location grouping
    
    @Column(name = "city_id")
    private Long cityId; // Auto-fetched from pincode
    
    @Column(name = "state_id")
    private Long stateId; // Auto-fetched from pincode
    
    @Column(name = "warehouse_id")
    private Long warehouseId; // Reference to warehouse in logistics module
    
    @Column(name = "delivery_cost", precision = 10, scale = 2)
    private BigDecimal deliveryCost = BigDecimal.ZERO;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InterestStatus status = InterestStatus.PENDING;
    
    @Column(name = "extension_reminder_sent_at")
    private LocalDateTime extensionReminderSentAt;
    
    @Column(name = "refund_processed_at")
    private LocalDateTime refundProcessedAt;
    
    @Version
    private Long version; // Optimistic locking
    
    public enum LogisticsPreference {
        DELIVERY, PICKUP
    }
    
    public enum InterestStatus {
        PENDING,
        EXPIRING,
        PENDING_EXTENSION,
        THRESHOLD_MET,
        COLLECTING,
        COMPLETE,
        EXPIRED,
        WITHDRAWN,
        DIRECT_ORDER_READY,
        DIRECT_ORDER_PLACED
    }
}
