package org.bulkby.order.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Enhanced OrderTrackingDTO with detailed tracking information.
 * 
 * Maintains backward compatibility with existing fields while adding new enhanced fields.
 * All three references (interestId, orderId, sellerOrderId) ensure complete traceability.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderTrackingDTO {
    // Core fields (existing - maintained for backward compatibility)
    private Long id;
    private Long interestId; // Required - maintains transaction traceability
    private String status;
    private LocalDateTime statusDate;
    private String location;
    private String notes;
    private String deliveryTrackingId;
    private LocalDateTime pickedUpAt;
    private LocalDateTime deliveredAt;
    
    // New references (for clarity and context)
    private Long orderId; // Order context when Order exists
    private Long sellerOrderId; // SellerOrder context when SellerOrder exists
    
    // Enhanced tracking fields
    private String currentLocation; // Detailed address
    private String carrierName; // e.g., "FedEx", "UPS", "Local Delivery"
    private String carrierTrackingNumber;
    private String trackingUrl; // External carrier tracking link
    private LocalDateTime estimatedDeliveryDate;
    private LocalDateTime estimatedPickupDate;
    private BigDecimal weight; // Package weight
    private String dimensions; // Package dimensions
    private Boolean signatureRequired;
    private String deliveryInstructions; // Special instructions
    private String contactPhone; // For delivery coordination
    private Integer deliveryAttempts;
    private String nextMilestone; // Next expected status
    private String lastUpdateSource; // "ADMIN", "SYSTEM", "CARRIER_API"
}
