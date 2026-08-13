package org.bulkby.order.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DirectOrderRequest {
    @NotNull(message = "Order group ID is required")
    private Long orderGroupId;
    
    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private Integer quantity;
    
    @NotNull(message = "Logistics preference is required")
    @Pattern(regexp = "^(DELIVERY|PICKUP)$", message = "Logistics preference must be either DELIVERY or PICKUP")
    private String logisticsPreference; // "DELIVERY" or "PICKUP"
    
    @Size(max = 500, message = "Delivery address must not exceed 500 characters")
    private String deliveryAddress; // Required if logisticsPreference is DELIVERY
    
    @Pattern(regexp = "^\\d{6}$", message = "Pincode must be exactly 6 digits")
    private String pincode; // 6-digit pincode for DELIVERY (required for location grouping)
    
    private Long warehouseId; // Required if logisticsPreference is PICKUP
    private Long addressId; // Optional: specific address ID to use for delivery
}
