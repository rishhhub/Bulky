package org.bulkby.order.service.impl;

import org.bulkby.auth.model.User;
import org.bulkby.auth.repository.UserAddressRepository;
import org.bulkby.auth.repository.UserRepository;
import org.bulkby.catalog.dto.ProductDTO;
import org.bulkby.common.dto.PincodeInfo;
import org.bulkby.common.service.PincodeService;
import org.bulkby.logistics.dto.LogisticsCostRequest;
import org.bulkby.logistics.dto.LogisticsCostResponse;
import org.bulkby.logistics.service.WarehouseService;
import org.bulkby.notification.service.NotificationService;
import org.bulkby.order.dto.DirectOrderRequest;
import org.bulkby.order.dto.InterestDTO;
import org.bulkby.order.exception.ValidationException;
import org.bulkby.order.model.Interest;
import org.bulkby.order.model.OrderGroup;
import org.bulkby.order.repository.InterestRepository;
import org.bulkby.order.repository.OrderGroupRepository;
import org.bulkby.order.service.DirectOrderService;
import org.bulkby.order.service.ResilientLogisticsService;
import org.bulkby.order.service.ResilientProductService;
import org.bulkby.order.statemachine.InterestStateMachine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Service
public class DirectOrderServiceImpl implements DirectOrderService {
    
    private static final Logger logger = LoggerFactory.getLogger(DirectOrderServiceImpl.class);
    
    @Autowired
    private OrderGroupRepository orderGroupRepository;
    
    @Autowired
    private InterestRepository interestRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired(required = false)
    private UserAddressRepository userAddressRepository;
    
    @Autowired
    private ResilientProductService resilientProductService;
    
    @Autowired
    private ResilientLogisticsService resilientLogisticsService;
    
    @Autowired
    private WarehouseService warehouseService;
    
    @Autowired(required = false)
    private PincodeService pincodeService;
    
    @Autowired
    private InterestStateMachine interestStateMachine;
    
    @Autowired
    private NotificationService notificationService;
    
    @Override
    @Transactional
    public InterestDTO placeDirectOrder(Long userId, DirectOrderRequest request) {
        // Get user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ValidationException("User not found"));
        
        // Get order group
        OrderGroup orderGroup = orderGroupRepository.findByIdWithInterests(request.getOrderGroupId())
                .orElseThrow(() -> new ValidationException("Order group not found"));
        
        // Validate order group is accepting new orders
        if (!orderGroup.getAcceptingNewOrders()) {
            throw new ValidationException("This order group is not accepting new orders");
        }
        
        // Validate order group status (should be COLLECTING)
        if (orderGroup.getStatus() != OrderGroup.OrderGroupStatus.COLLECTING) {
            throw new ValidationException("Direct orders can only be placed for order groups in COLLECTING status");
        }
        
        // Check if seller order has been placed (if yes, direct orders should not be allowed)
        // This check can be done by checking if there are any SellerOrders for this order group
        // For now, we'll assume if order group is COLLECTING, seller order hasn't been placed
        
        // Validate user doesn't already have an interest in this order group
        boolean hasExistingInterest = orderGroup.getInterests().stream()
                .anyMatch(interest -> interest.getUserId().equals(userId));
        if (hasExistingInterest) {
            throw new ValidationException("You already have an interest in this order group");
        }
        
        // Get product
        ProductDTO product = resilientProductService.getProductById(orderGroup.getProductId());
        
        // Validate quantity
        if (request.getQuantity() == null || request.getQuantity() < 1) {
            throw new ValidationException("Quantity must be at least 1");
        }
        
        // Validate quantity doesn't exceed reasonable limit (prevent DoS)
        if (request.getQuantity() > 100000) {
            throw new ValidationException("Quantity exceeds maximum allowed limit");
        }
        
        // Validate product is still available
        if (product.getActive() != null && !product.getActive()) {
            throw new ValidationException("Product is not available");
        }
        
        // Validate logistics preference
        Interest.LogisticsPreference logisticsPreference;
        try {
            logisticsPreference = Interest.LogisticsPreference.valueOf(request.getLogisticsPreference().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid logistics preference: " + request.getLogisticsPreference());
        }
        
        // Validate user has address in same city as order group
        if (orderGroup.getCityId() != null) {
            boolean hasAddressInCity = false;
            
            if (logisticsPreference == Interest.LogisticsPreference.DELIVERY) {
                // If addressId is provided, validate it belongs to the user
                if (request.getAddressId() != null) {
                    org.bulkby.auth.model.UserAddress userAddress = userAddressRepository.findById(request.getAddressId())
                            .orElseThrow(() -> new ValidationException("Address not found"));
                    if (!userAddress.getUser().getId().equals(userId)) {
                        throw new ValidationException("Address does not belong to you");
                    }
                    // Use pincode from address if not provided
                    if (request.getPincode() == null || request.getPincode().trim().isEmpty()) {
                        request.setPincode(userAddress.getPostalCode());
                    }
                }
                
                // For delivery, validate pincode matches order group city
                if (request.getPincode() == null || request.getPincode().trim().isEmpty()) {
                    throw new ValidationException("Pincode is required for DELIVERY");
                }
                
                // Validate pincode format
                if (!pincodeService.isValidPincodeFormat(request.getPincode())) {
                    throw new ValidationException("Pincode must be exactly 6 digits");
                }
                
                if (pincodeService != null) {
                    PincodeInfo pincodeInfo = pincodeService.lookupByPincode(request.getPincode());
                    if (pincodeInfo == null) {
                        throw new ValidationException("Pincode not found: " + request.getPincode());
                    }
                    
                    if (!pincodeInfo.getCityId().equals(orderGroup.getCityId())) {
                        throw new ValidationException("Your delivery address must be in the same city as the order group (" + 
                            orderGroup.getCityName() + ")");
                    }
                    
                    if (!pincodeInfo.getServiceable()) {
                        throw new ValidationException("Pincode is not serviceable: " + request.getPincode());
                    }
                    
                    hasAddressInCity = true;
                }
            } else {
                // For pickup, validate warehouse is in same city
                if (request.getWarehouseId() == null) {
                    throw new ValidationException("Warehouse ID is required for PICKUP");
                }
                
                // Validate warehouse exists and is in the same city as order group
                try {
                    org.bulkby.logistics.dto.WarehouseDTO warehouse = warehouseService.getWarehouseById(request.getWarehouseId());
                    if (warehouse.getCityId() == null || !warehouse.getCityId().equals(orderGroup.getCityId())) {
                        throw new ValidationException("Selected warehouse must be in the same city as the order group (" + 
                            orderGroup.getCityName() + ")");
                    }
                    if (warehouse.getActive() != null && !warehouse.getActive()) {
                        throw new ValidationException("Selected warehouse is not active");
                    }
                    hasAddressInCity = true;
                } catch (Exception e) {
                    throw new ValidationException("Warehouse not found or invalid: " + e.getMessage());
                }
            }
            
            if (!hasAddressInCity) {
                throw new ValidationException("You must have an address in " + orderGroup.getCityName() + 
                    " to place a direct order for this order group");
            }
        }
        
        // Create interest
        Interest interest = new Interest();
        interest.setUserId(userId);
        interest.setProductId(orderGroup.getProductId());
        interest.setQuantity(request.getQuantity());
        interest.setPeriodDays(0); // Direct orders don't need period
        interest.setStartDate(LocalDateTime.now());
        interest.setEndDate(LocalDateTime.now()); // No expiration for direct orders
        interest.setLogisticsPreference(logisticsPreference);
        
        BigDecimal deliveryCost = BigDecimal.ZERO;
        if (logisticsPreference == Interest.LogisticsPreference.DELIVERY) {
            if (request.getDeliveryAddress() == null || request.getDeliveryAddress().trim().isEmpty()) {
                throw new ValidationException("Delivery address is required for DELIVERY");
            }
            
            interest.setDeliveryAddress(request.getDeliveryAddress());
            interest.setPincode(request.getPincode());
            
            if (pincodeService != null) {
                PincodeInfo pincodeInfo = pincodeService.lookupByPincode(request.getPincode());
                if (pincodeInfo != null) {
                    interest.setCityId(pincodeInfo.getCityId());
                    interest.setStateId(pincodeInfo.getStateId());
                }
            }
            
            // Calculate delivery cost
            LogisticsCostRequest logisticsRequest = new LogisticsCostRequest();
            logisticsRequest.setProductId(orderGroup.getProductId());
            logisticsRequest.setQuantity(request.getQuantity());
            LogisticsCostResponse logisticsResponse = resilientLogisticsService.calculateDeliveryCost(logisticsRequest);
            deliveryCost = logisticsResponse.getDeliveryCost();
        } else {
            if (request.getWarehouseId() == null) {
                throw new ValidationException("Warehouse ID is required for PICKUP");
            }
            
            org.bulkby.logistics.dto.WarehouseDTO warehouse = warehouseService.getWarehouseById(request.getWarehouseId());
            if (warehouse == null || !warehouse.getActive()) {
                throw new ValidationException("Warehouse not found or inactive");
            }
            
            interest.setWarehouseId(request.getWarehouseId());
            
            if (warehouse.getCityId() != null) {
                interest.setCityId(warehouse.getCityId());
            }
            if (warehouse.getStateId() != null) {
                interest.setStateId(warehouse.getStateId());
            }
        }
        interest.setDeliveryCost(deliveryCost);
        
        // For direct orders, collect full amount (100%) instead of just deposit
        BigDecimal totalProductCost = product.getPrice().multiply(BigDecimal.valueOf(request.getQuantity()));
        BigDecimal fullAmount = totalProductCost.setScale(2, RoundingMode.HALF_UP);
        interest.setDepositPaid(fullAmount); // Store full amount in depositPaid field for direct orders
        
        // For direct orders, set initial status to THRESHOLD_MET, then transition to COLLECTING
        // (since order group is already COLLECTING and threshold is met)
        interest.setStatus(Interest.InterestStatus.THRESHOLD_MET);
        interest = interestRepository.save(interest); // Save first to have an ID
        interestStateMachine.transition(interest, Interest.InterestStatus.COLLECTING);
        
        // Save interest
        interest = interestRepository.save(interest);
        
        // Add interest to order group
        orderGroup.getInterests().add(interest);
        
        // Update order group total quantity
        int newTotalQuantity = orderGroup.getTotalQuantity() + request.getQuantity();
        orderGroup.setTotalQuantity(newTotalQuantity);
        
        // Save order group
        orderGroupRepository.save(orderGroup);
        orderGroupRepository.flush();
        
        logger.info("Direct order placed: interestId={}, orderGroupId={}, userId={}, quantity={}", 
            interest.getId(), orderGroup.getId(), userId, request.getQuantity());
        
        // Notify user
        notificationService.notifyOrderPlaced(userId, interest.getId(), product.getName());
        
        // Convert to DTO (simplified - would need full conversion method)
        InterestDTO dto = new InterestDTO();
        dto.setId(interest.getId());
        dto.setUserId(interest.getUserId());
        dto.setProductId(interest.getProductId());
        dto.setQuantity(interest.getQuantity());
        dto.setStatus(interest.getStatus().name());
        dto.setProductName(product.getName());
        
        return dto;
    }
}
