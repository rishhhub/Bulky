package org.bulkby.order.dto;

import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateInterestRequest {
    @Positive(message = "Quantity must be positive")
    private Integer quantity;
    
    @Positive(message = "Period days must be positive")
    private Integer periodDays;
    
    private String logisticsPreference; // "DELIVERY" or "PICKUP"
    
    private String deliveryAddress; // Required if logisticsPreference is DELIVERY
    private Long warehouseId; // Required if logisticsPreference is PICKUP
}
