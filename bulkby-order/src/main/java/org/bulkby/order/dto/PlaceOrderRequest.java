package org.bulkby.order.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlaceOrderRequest {
    private String sellerOrderNumber;
    private String sellerTransactionId;
    private BigDecimal orderAmount;
    private Long deliveryWarehouseId;
    private String notes;
}
