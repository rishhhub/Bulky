package org.bulkby.order.service.impl;

import org.bulkby.logistics.dto.WarehouseDTO;
import org.bulkby.logistics.service.WarehouseService;
import org.bulkby.order.model.Interest;
import org.bulkby.order.service.LocationGroupingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class LocationGroupingServiceImpl implements LocationGroupingService {

    private static final Logger logger = LoggerFactory.getLogger(LocationGroupingServiceImpl.class);

    @Autowired
    private WarehouseService warehouseService;

    @Override
    public String generateGroupingKey(Interest interest) {
        // Both PICKUP and DELIVERY are grouped by city
        Long cityId = getCityIdForInterest(interest);
        if (cityId != null) {
            return interest.getProductId() + "_CITY_" + cityId;
        } else {
            if (interest.getLogisticsPreference() == Interest.LogisticsPreference.PICKUP) {
                logger.warn("Interest {} has PICKUP preference but cityId cannot be determined (warehouseId: {})", 
                    interest.getId(), interest.getWarehouseId());
            } else {
                logger.warn("Interest {} has DELIVERY preference but no cityId", interest.getId());
            }
            return null;
        }
    }

    @Override
    public Map<String, List<Interest>> groupInterestsByLocation(List<Interest> interests) {
        Map<String, List<Interest>> groups = new HashMap<>();
        
        for (Interest interest : interests) {
            String groupingKey = generateGroupingKey(interest);
            if (groupingKey != null) {
                groups.computeIfAbsent(groupingKey, k -> new ArrayList<>()).add(interest);
            } else {
                logger.warn("Cannot generate grouping key for interest {}, skipping", interest.getId());
            }
        }
        
        return groups;
    }

    @Override
    public Long getCityIdForInterest(Interest interest) {
        // First, check if interest already has cityId set (should be set during creation)
        if (interest.getCityId() != null) {
            return interest.getCityId();
        }
        
        // For DELIVERY: cityId should be set from pincode during creation
        if (interest.getLogisticsPreference() == Interest.LogisticsPreference.DELIVERY) {
            logger.warn("Interest {} has DELIVERY preference but cityId is not set", interest.getId());
            return null;
        }
        
        // For PICKUP: Fetch warehouse and get warehouse's cityId
        if (interest.getWarehouseId() != null) {
            try {
                WarehouseDTO warehouse = warehouseService.getWarehouseById(interest.getWarehouseId());
                if (warehouse != null && warehouse.getCityId() != null) {
                    return warehouse.getCityId();
                } else {
                    logger.warn("Warehouse {} does not have cityId set", interest.getWarehouseId());
                }
            } catch (Exception e) {
                logger.error("Error fetching warehouse {} for interest {}: {}", 
                        interest.getWarehouseId(), interest.getId(), e.getMessage());
            }
        }
        return null;
    }
}
