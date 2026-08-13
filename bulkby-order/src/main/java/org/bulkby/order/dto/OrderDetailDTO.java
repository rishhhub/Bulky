package org.bulkby.order.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderDetailDTO {
    private Long orderGroupId;
    private String productName;
    private Long productId;
    private Integer totalQuantity;
    private Integer requiredQuantity;
    private String status;
    private String cityName; // City for this order group (location-based grouping)
    private Long cityId; // City ID for this order group (for filtering warehouses)
    private String groupingKey; // Grouping key: {productId}_CITY_{cityId} (for both PICKUP and DELIVERY)
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private BigDecimal totalAmountCollected;
    private List<OrderItemDTO> orderItems;
    private List<WarehouseGroupDTO> warehouseGroups;
    private List<CityGroupDTO> cityGroups;
    
    // Financial summary (per OrderGroup)
    private FinancialSummaryDTO financialSummary;
    
    // Product and seller information for order placement
    private ProductInfoDTO productInfo;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductInfoDTO {
        private Long productId;
        private String productName;
        private BigDecimal costPerUnit; // Seller's cost per unit
        private BigDecimal deliveryCostPerMinOrder; // Seller's delivery cost for minimum order
        private Integer minOrderQuantity;
        /** Amount to pay seller for this order: totalQuantity × (costPerUnit + deliveryCostPerMinOrder / minOrderQuantity) */
        private BigDecimal amountToPaySeller;
        private SellerInfoDTO seller;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SellerInfoDTO {
        private Long sellerId;
        private String sellerName;
        private String sellerEmail;
        private String sellerPhone;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemDTO {
        private Long interestId;
        // Order information (when Interest becomes Order)
        private Long orderId; // Order ID when Order exists
        private String orderNumber; // User-facing order number (e.g., ORD-12345)
        private String orderStatus; // Order fulfillment status
        // Interest information (existing - maintained for backward compatibility)
        private String userEmail;
        private String userName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
        private BigDecimal depositPaid;
        private BigDecimal remainingPaid;
        private BigDecimal logisticsPaid;
        private BigDecimal totalPaid;
        private String logisticsPreference;
        private String deliveryAddress;
        private WarehouseInfoDTO warehouse;
        private String status; // Interest status
        private LocalDateTime createdAt;
        private List<PaymentInfoDTO> payments; // All transactions remain linked to Interest
        private Boolean pickedUp;
        private LocalDateTime pickedUpAt;
        private Boolean delivered;
        private LocalDateTime deliveredAt;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WarehouseInfoDTO {
        private Long id;
        private String name;
        private String address;
        private String city;
        private String state;
        private String zipCode;
        private String phone;
        private String hoursOfOperation;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentInfoDTO {
        private Long paymentId;
        private String paymentType;
        private BigDecimal amount;
        private String status;
        private String transactionId;
        private LocalDateTime createdAt;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WarehouseGroupDTO {
        private WarehouseInfoDTO warehouse;
        private Integer totalQuantity;
        private Integer totalOrders;
        private List<OrderItemDTO> orders;
        private Integer pickedUpCount;
        private Integer pendingPickupCount;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CityGroupDTO {
        private String city;
        private String state;
        private Integer totalQuantity;
        private Integer totalOrders;
        private List<OrderItemDTO> orders;
        private Integer deliveredCount;
        private Integer pendingDeliveryCount;
    }
}
