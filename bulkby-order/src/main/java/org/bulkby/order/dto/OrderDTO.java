package org.bulkby.order.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bulkby.order.service.PaymentQueryService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for Order that includes Interest and Payment info.
 * 
 * This ensures all transactions remain visible:
 * - Order info (fulfillment status, dates)
 * - Interest info (product, quantity, logistics)
 * - Payment history (all transactions linked to Interest)
 * 
 * No data duplication - all payment/product data comes from Interest via joins.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderDTO {
    
    // Order fields
    private Long id;
    private String orderNumber; // User-facing order number (e.g., ORD-12345)
    private Long interestId; // 1:1 with Interest
    private Long orderGroupId;
    private Long sellerOrderId;
    private String status; // Order fulfillment status
    
    // Order dates
    private LocalDateTime createdAt;
    private LocalDateTime confirmedAt;
    private LocalDateTime shippedAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime pickedUpAt;
    
    // Interest fields (from Interest via join - no duplication)
    private Long userId;
    private Long productId;
    private Integer quantity;
    private BigDecimal depositPaid;
    private BigDecimal deliveryCost;
    private String logisticsPreference; // DELIVERY or PICKUP
    private String deliveryAddress;
    private Long warehouseId;
    private String interestStatus; // Interest pre-order status
    
    // Payment history (from Interest → Payments - all transactions traceable)
    private List<PaymentQueryService.PaymentInfo> payments;
}
