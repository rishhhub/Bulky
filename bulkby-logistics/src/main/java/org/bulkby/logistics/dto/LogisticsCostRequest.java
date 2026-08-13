package org.bulkby.logistics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LogisticsCostRequest {
    private Long productId;
    private Integer quantity;
    private String deliveryAddress; // Optional, for future distance-based calculation
}
