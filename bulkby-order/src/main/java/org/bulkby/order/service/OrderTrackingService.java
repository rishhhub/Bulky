package org.bulkby.order.service;

import org.bulkby.order.dto.OrderTrackingDTO;
import org.bulkby.order.model.OrderTracking;
import org.bulkby.order.repository.OrderTrackingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing OrderTracking.
 * 
 * Maintains backward compatibility with existing Interest-based queries
 * while adding new queries for Order and SellerOrder.
 */
@Service
public class OrderTrackingService {
    
    @Autowired
    private OrderTrackingRepository orderTrackingRepository;
    
    /**
     * Get tracking by Interest ID (existing method - maintained for backward compatibility)
     * All transactions remain traceable through Interest → Payments
     */
    public List<OrderTrackingDTO> getTrackingByInterestId(Long interestId) {
        return orderTrackingRepository.findByInterestIdOrderByStatusDateDesc(interestId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get tracking by Order ID (new method - adds clarity)
     */
    public List<OrderTrackingDTO> getTrackingByOrderId(Long orderId) {
        return orderTrackingRepository.findByOrderIdOrderByStatusDateDesc(orderId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get tracking by SellerOrder ID (new method - adds context)
     */
    public List<OrderTrackingDTO> getTrackingBySellerOrderId(Long sellerOrderId) {
        return orderTrackingRepository.findBySellerOrderIdOrderByStatusDateDesc(sellerOrderId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get current tracking status for an Interest (existing functionality)
     */
    public OrderTrackingDTO getCurrentTrackingStatus(Long interestId) {
        List<OrderTracking> trackingList = orderTrackingRepository.findByInterestIdOrderByStatusDateDesc(interestId);
        if (trackingList.isEmpty()) {
            return null;
        }
        return convertToDTO(trackingList.get(0)); // Most recent
    }
    
    /**
     * Convert OrderTracking to DTO with all enhanced fields
     */
    private OrderTrackingDTO convertToDTO(OrderTracking tracking) {
        OrderTrackingDTO dto = new OrderTrackingDTO();
        
        // Core fields (existing - backward compatible)
        dto.setId(tracking.getId());
        dto.setInterestId(tracking.getInterestId());
        dto.setStatus(tracking.getStatus().name());
        dto.setStatusDate(tracking.getStatusDate());
        dto.setLocation(tracking.getLocation());
        dto.setNotes(tracking.getNotes());
        dto.setDeliveryTrackingId(tracking.getDeliveryTrackingId());
        dto.setPickedUpAt(tracking.getPickedUpAt());
        dto.setDeliveredAt(tracking.getDeliveredAt());
        
        // New references
        dto.setOrderId(tracking.getOrderId());
        dto.setSellerOrderId(tracking.getSellerOrderId());
        
        // Enhanced fields
        dto.setCurrentLocation(tracking.getCurrentLocation());
        dto.setCarrierName(tracking.getCarrierName());
        dto.setCarrierTrackingNumber(tracking.getCarrierTrackingNumber());
        dto.setTrackingUrl(tracking.getTrackingUrl());
        dto.setEstimatedDeliveryDate(tracking.getEstimatedDeliveryDate());
        dto.setEstimatedPickupDate(tracking.getEstimatedPickupDate());
        dto.setWeight(tracking.getWeight());
        dto.setDimensions(tracking.getDimensions());
        dto.setSignatureRequired(tracking.getSignatureRequired());
        dto.setDeliveryInstructions(tracking.getDeliveryInstructions());
        dto.setContactPhone(tracking.getContactPhone());
        dto.setDeliveryAttempts(tracking.getDeliveryAttempts());
        dto.setNextMilestone(tracking.getNextMilestone());
        dto.setLastUpdateSource(tracking.getLastUpdateSource());
        
        return dto;
    }
}
