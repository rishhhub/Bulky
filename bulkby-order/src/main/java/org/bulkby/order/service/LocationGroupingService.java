package org.bulkby.order.service;

import org.bulkby.order.model.Interest;

import java.util.List;
import java.util.Map;

public interface LocationGroupingService {
    /**
     * Generate grouping key for an interest
     * For both DELIVERY and PICKUP: {productId}_CITY_{cityId}
     * @param interest Interest entity
     * @return Grouping key string
     */
    String generateGroupingKey(Interest interest);
    
    /**
     * Group interests by location (city for both DELIVERY and PICKUP)
     * @param interests List of interests to group
     * @return Map of grouping key to list of interests
     */
    Map<String, List<Interest>> groupInterestsByLocation(List<Interest> interests);
    
    /**
     * Get city ID for an interest (from pincode for DELIVERY, from warehouse for PICKUP)
     * @param interest Interest entity
     * @return City ID, or null if cannot be determined
     */
    Long getCityIdForInterest(Interest interest);
}
