package org.bulkby.order.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderGroupDTO {
    private Long id;
    private Long productId;
    private String productName;
    private Integer totalQuantity;
    private Integer requiredQuantity;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
}
