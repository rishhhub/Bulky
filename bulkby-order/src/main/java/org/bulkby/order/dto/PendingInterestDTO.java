package org.bulkby.order.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PendingInterestDTO {
    private Long interestId;
    private Long productId;
    private String productName;
    private String userEmail;
    private Integer quantity;
    private LocalDateTime endDate;
    private Boolean isExpired;
    private Integer daysRemaining;
}
