package org.bulkby.order.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InterestDTO {
    private Long id;
    private Long userId;
    private Long productId;
    private String productName;
    private Integer quantity;
    private BigDecimal depositPaid;
    private Integer periodDays;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String logisticsPreference;
    private String deliveryAddress;
    private Long warehouseId;
    private String warehouseName;
    private BigDecimal deliveryCost;
    private String status;
    private LocalDateTime extensionReminderSentAt;
    private LocalDateTime refundProcessedAt;
    
    // Threshold progress fields
    private Integer totalQuantity; // Total quantity from all interests for this product
    private Integer requiredQuantity; // Minimum order quantity required
    private Double thresholdProgress; // Percentage (0-100)
    
    // Collection progress fields (for COLLECTING status)
    private Integer totalInterestsInGroup; // Total number of interests in the order group
    private Integer paidInterestsCount; // Number of interests that have paid remaining balance
    private Double collectionProgress; // Percentage (0-100)
    
    // Order reference (optional - populated when Interest becomes an Order)
    private Long orderId; // Reference to Order when SellerOrder is placed
    private String orderNumber; // User-facing order number (e.g., ORD-12345)
    
    // Payment status fields
    private Boolean hasRemainingPaymentCompleted; // Whether this user's interest has remaining payment completed
}
