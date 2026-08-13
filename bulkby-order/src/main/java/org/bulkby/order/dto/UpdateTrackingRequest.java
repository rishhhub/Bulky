package org.bulkby.order.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTrackingRequest {
    private String trackingId;
    private String status; // SHIPPED, IN_TRANSIT, ARRIVED
    private LocalDateTime shippedAt;
    private LocalDateTime estimatedArrival;
    private LocalDateTime arrivedAt;
    private String notes;
}
