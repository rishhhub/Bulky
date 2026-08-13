package org.bulkby.order.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WishlistDTO {
    private Long id;
    private Long userId;
    private Long productId;
    private String productName; // Fetched from catalog service
    private LocalDateTime createdAt;
    private LocalDateTime notifiedAt;
}
