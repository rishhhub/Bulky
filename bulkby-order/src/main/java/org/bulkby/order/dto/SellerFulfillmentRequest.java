package org.bulkby.order.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Request for seller to update fulfillment status: confirm order or mark as shipped.
 * Allowed transitions: PLACED → CONFIRMED, PLACED/CONFIRMED → SHIPPED.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SellerFulfillmentRequest {
    /** New status: CONFIRMED or SHIPPED */
    private String status;
    /** Required when status is SHIPPED */
    private String trackingId;
    private LocalDateTime shippedAt;
    private LocalDateTime estimatedArrival;
    private String notes;
}
