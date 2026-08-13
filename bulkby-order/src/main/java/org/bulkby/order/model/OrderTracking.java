package org.bulkby.order.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Enhanced OrderTracking model with detailed tracking information.
 * 
 * Maintains all three references for complete traceability:
 * - interestId (required) - maintains transaction traceability
 * - orderId (nullable) - provides order context when Order exists
 * - sellerOrderId (nullable) - provides bulk order context when SellerOrder exists
 */
@Entity
@Table(name = "order_tracking")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderTracking {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Required reference to Interest - maintains transaction traceability
     * All payments remain linked to Interest
     */
    @Column(name = "interest_id", nullable = false)
    private Long interestId;
    
    /**
     * Optional reference to Order - provides order context when Order exists
     */
    @Column(name = "order_id")
    private Long orderId;
    
    /**
     * Optional reference to SellerOrder - provides bulk order context
     */
    @Column(name = "seller_order_id")
    private Long sellerOrderId;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TrackingStatus status;
    
    @Column(name = "status_date", nullable = false)
    private LocalDateTime statusDate = LocalDateTime.now();
    
    @Column(name = "location")
    private String location;
    
    /**
     * Enhanced: Detailed current location (address)
     */
    @Column(name = "current_location", columnDefinition = "TEXT")
    private String currentLocation;
    
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    /**
     * Enhanced: Carrier information
     */
    @Column(name = "carrier_name")
    private String carrierName; // e.g., "FedEx", "UPS", "Local Delivery"
    
    @Column(name = "carrier_tracking_number")
    private String carrierTrackingNumber;
    
    @Column(name = "tracking_url")
    private String trackingUrl; // External carrier tracking link
    
    /**
     * Enhanced: Estimated dates
     */
    @Column(name = "estimated_delivery_date")
    private LocalDateTime estimatedDeliveryDate;
    
    @Column(name = "estimated_pickup_date")
    private LocalDateTime estimatedPickupDate;
    
    /**
     * Enhanced: Package details
     */
    @Column(name = "weight", precision = 10, scale = 2)
    private BigDecimal weight; // Package weight
    
    @Column(name = "dimensions")
    private String dimensions; // Package dimensions (e.g., "10x5x3 inches")
    
    /**
     * Enhanced: Delivery details
     */
    @Column(name = "signature_required")
    private Boolean signatureRequired;
    
    @Column(name = "delivery_instructions", columnDefinition = "TEXT")
    private String deliveryInstructions; // Special instructions
    
    @Column(name = "contact_phone")
    private String contactPhone; // For delivery coordination
    
    @Column(name = "delivery_attempts")
    private Integer deliveryAttempts = 0;
    
    /**
     * Enhanced: Next milestone tracking
     */
    @Column(name = "next_milestone")
    private String nextMilestone; // Next expected status
    
    /**
     * Enhanced: Update source tracking
     */
    @Column(name = "last_update_source")
    private String lastUpdateSource; // "ADMIN", "SYSTEM", "CARRIER_API"
    
    /**
     * Existing fields (maintained for backward compatibility)
     */
    @Column(name = "delivery_tracking_id")
    private String deliveryTrackingId; // For delivery orders
    
    @Column(name = "picked_up_at")
    private LocalDateTime pickedUpAt;
    
    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;
    
    /**
     * Enhanced tracking statuses for more granular updates
     */
    public enum TrackingStatus {
        // Existing statuses
        ORDER_PLACED,              // Order placed with seller
        ORDER_SHIPPED,             // Order shipped by seller
        ARRIVED_AT_WAREHOUSE,      // Order arrived at warehouse
        READY_FOR_PICKUP,          // Ready for pickup (for pickup orders)
        PICKED_UP,                 // User picked up (for pickup orders)
        OUT_FOR_DELIVERY,          // Out for delivery (for delivery orders)
        DELIVERED,                 // Delivered to user (for delivery orders)
        CANCELLED,                 // Order cancelled
        
        // New enhanced statuses
        ORDER_CONFIRMED,           // Seller confirmed the order
        PAYMENT_RECEIVED_BY_SELLER, // Payment confirmed by seller
        PROCESSING,                // Order being prepared
        PACKED,                    // Order packed and ready to ship
        IN_TRANSIT,                // More specific than ORDER_SHIPPED
        AT_DISTRIBUTION_CENTER,    // Intermediate location
        DELIVERY_ATTEMPTED,        // Delivery attempted but failed
        DELIVERY_RESCHEDULED,      // Delivery rescheduled
        PICKUP_REMINDER_SENT       // Reminder sent for pickup
    }
}
