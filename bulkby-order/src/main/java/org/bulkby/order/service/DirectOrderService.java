package org.bulkby.order.service;

import org.bulkby.order.dto.DirectOrderRequest;
import org.bulkby.order.dto.InterestDTO;

public interface DirectOrderService {
    /**
     * Place a direct order and add it to an existing order group
     * @param userId User ID
     * @param request Direct order request
     * @return InterestDTO for the created interest
     */
    InterestDTO placeDirectOrder(Long userId, DirectOrderRequest request);
}
