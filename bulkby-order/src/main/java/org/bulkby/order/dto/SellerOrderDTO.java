package org.bulkby.order.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bulkby.logistics.dto.WarehouseDTO;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SellerOrderDTO {
    private Long id;
    private Long orderGroupId;
    private String sellerOrderNumber;
    private String trackingId;
    private String sellerTransactionId;
    private BigDecimal orderAmount;
    private Long deliveryWarehouseId;
    private String deliveryWarehouseName;
    private WarehouseDTO deliveryWarehouse; // Full warehouse object for frontend
    private String status;
    private LocalDateTime placedAt;
    private LocalDateTime shippedAt;
    private LocalDateTime estimatedArrival;
    private LocalDateTime arrivedAt;
    private String notes;
    
    // Product information for seller reference
    private Long productId;
    private String productName;
    private Integer totalQuantity;
}
