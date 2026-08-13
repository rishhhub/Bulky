package org.bulkby.order.service.impl;

import org.bulkby.auth.service.UserService;
import org.bulkby.catalog.dto.ProductDTO;
import org.bulkby.order.service.ResilientProductService;
import org.bulkby.order.service.ResilientPaymentQueryService;
import org.bulkby.notification.service.NotificationService;
import org.bulkby.order.dto.*;
import org.bulkby.order.event.DomainEventPublisher;
import org.bulkby.order.event.ThresholdMetEvent;
import org.bulkby.order.exception.OrderGroupCreationException;
import org.bulkby.order.statemachine.InterestStateMachine;
import org.bulkby.order.statemachine.OrderGroupStateMachine;
import org.bulkby.order.exception.PaymentVerificationException;
import org.bulkby.order.model.Interest;
import org.bulkby.order.model.OrderGroup;
import org.bulkby.logistics.service.WarehouseService;
import org.bulkby.order.repository.InterestRepository;
import org.bulkby.order.repository.OrderGroupRepository;
import org.bulkby.order.repository.OrderRepository;
import org.bulkby.order.repository.SellerOrderRepository;
import org.bulkby.order.repository.OrderTrackingRepository;
import org.bulkby.order.model.Order;
import org.bulkby.order.model.OrderTracking;
import org.bulkby.order.service.OrderGroupService;
import org.bulkby.order.service.FinancialCalculationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class OrderGroupServiceImpl implements OrderGroupService {
    
    private static final Logger logger = LoggerFactory.getLogger(OrderGroupServiceImpl.class);
    
    @Autowired
    private OrderGroupRepository orderGroupRepository;
    
    @Autowired
    private ResilientProductService resilientProductService;
    
    @Autowired
    private InterestRepository interestRepository;
    
    @Autowired
    private ResilientPaymentQueryService resilientPaymentQueryService;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private OrderTrackingRepository orderTrackingRepository;
    
    @Autowired
    private SellerOrderRepository sellerOrderRepository;
    
    @Autowired
    private WarehouseService warehouseService;
    
    @Autowired
    private DomainEventPublisher eventPublisher;
    
    @Autowired
    private InterestStateMachine interestStateMachine;
    
    @Autowired
    private OrderGroupStateMachine orderGroupStateMachine;
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private FinancialCalculationService financialCalculationService;
    
    @Autowired
    private org.bulkby.order.service.LocationGroupingService locationGroupingService;
    
    @Autowired
    private org.bulkby.common.service.PincodeService pincodeService;
    
    @Autowired(required = false)
    private org.bulkby.order.service.WishlistService wishlistService;
    
    private OrderGroupDTO convertToDTO(OrderGroup orderGroup) {
        OrderGroupDTO dto = new OrderGroupDTO();
        dto.setId(orderGroup.getId());
        dto.setProductId(orderGroup.getProductId());
        
        // Get product name
        try {
            ProductDTO product = resilientProductService.getProductById(orderGroup.getProductId());
            dto.setProductName(product.getName());
        } catch (Exception e) {
            logger.warn("Failed to fetch product {} for order group {}: {}", orderGroup.getProductId(), orderGroup.getId(), e.getMessage());
            dto.setProductName("Product not found");
        }
        
        dto.setTotalQuantity(orderGroup.getTotalQuantity());
        dto.setRequiredQuantity(orderGroup.getRequiredQuantity());
        dto.setStatus(orderGroup.getStatus().name());
        dto.setCreatedAt(orderGroup.getCreatedAt());
        dto.setCompletedAt(orderGroup.getCompletedAt());
        return dto;
    }
    
    @Override
    @Transactional(timeout = 30)
    public void checkThresholdForProduct(Long productId) {
        try {
            ProductDTO product = resilientProductService.getProductById(productId);
            
            // Use pessimistic locking to prevent race conditions
            List<Interest> allPendingInterests = interestRepository.findByProductIdAndStatusLocked(
                productId, Interest.InterestStatus.PENDING);
            
            if (allPendingInterests.isEmpty()) {
                logger.debug("No pending interests found for product {}", productId);
                return;
            }
            
            // Check if these interests are already in an order group (with lock)
            List<OrderGroup> existingGroups = orderGroupRepository.findByProductIdWithInterestsLocked(productId);
            boolean interestsAlreadyInGroup = false;
            for (Interest interest : allPendingInterests) {
                for (OrderGroup og : existingGroups) {
                    if (og.getInterests().stream().anyMatch(i -> i.getId().equals(interest.getId()))) {
                        interestsAlreadyInGroup = true;
                        break;
                    }
                }
                if (interestsAlreadyInGroup) break;
            }
            
            if (interestsAlreadyInGroup) {
                logger.debug("Interests for product {} are already in an order group", productId);
                return; // Interests are already in a group
            }
            
            // Group interests by location (city for DELIVERY, warehouse for PICKUP)
            Map<String, List<Interest>> locationGroups = locationGroupingService.groupInterestsByLocation(allPendingInterests);
            
            if (locationGroups.isEmpty()) {
                logger.debug("No valid location groups found for product {}", productId);
                return;
            }
            
            LocalDateTime now = LocalDateTime.now();
            
            // Process each location group separately
            for (Map.Entry<String, List<Interest>> locationEntry : locationGroups.entrySet()) {
                String groupingKey = locationEntry.getKey();
                List<Interest> locationInterests = locationEntry.getValue();
                
                // Skip if interests are already in a group
                boolean alreadyInGroup = false;
                for (Interest interest : locationInterests) {
                    for (OrderGroup og : existingGroups) {
                        if (og.getInterests().stream().anyMatch(i -> i.getId().equals(interest.getId()))) {
                            alreadyInGroup = true;
                            break;
                        }
                    }
                    if (alreadyInGroup) break;
                }
                
                if (alreadyInGroup) {
                    logger.debug("Location group {} for product {} already has interests in an order group", 
                        groupingKey, productId);
                    continue;
                }
                
                // Calculate total quantity for this location group
                Integer totalQuantity = locationInterests.stream()
                        .mapToInt(Interest::getQuantity)
                        .sum();
                
                // Check if threshold is met for this location group
                if (totalQuantity >= product.getMinOrderQuantity() && !locationInterests.isEmpty()) {
                    // Determine cityId and cityName for this group
                    // Both PICKUP and DELIVERY interests should have cityId set (from warehouse or pincode)
                    Long cityId = null;
                    String cityName = null;
                    
                    // Get cityId from first interest (all interests in group should have same cityId)
                    Interest firstInterest = locationInterests.get(0);
                    cityId = firstInterest.getCityId();
                    
                    // If cityId is not set, try to get it from location grouping service
                    if (cityId == null) {
                        cityId = locationGroupingService.getCityIdForInterest(firstInterest);
                    }
                    
                    // Fetch city name if cityId is available
                    if (cityId != null) {
                        try {
                            Object cityObj = pincodeService.getCityById(cityId);
                            if (cityObj != null && cityObj instanceof org.bulkby.order.model.City) {
                                org.bulkby.order.model.City city = (org.bulkby.order.model.City) cityObj;
                                cityName = city.getName();
                            }
                        } catch (Exception e) {
                            logger.warn("Error fetching city name for cityId {}: {}", cityId, e.getMessage());
                        }
                    } else {
                        logger.warn("Cannot determine cityId for interest {} (preference: {}, warehouseId: {})", 
                            firstInterest.getId(), firstInterest.getLogisticsPreference(), firstInterest.getWarehouseId());
                    }
                    
                    // Create order group for this location
                    OrderGroup orderGroup = new OrderGroup();
                    orderGroup.setProductId(productId);
                    orderGroup.setCityId(cityId);
                    orderGroup.setGroupingKey(groupingKey);
                    orderGroup.setCityName(cityName);
                    orderGroup.setTotalQuantity(totalQuantity);
                    orderGroup.setRequiredQuantity(product.getMinOrderQuantity());
                    // Initial status is PENDING, transition to COLLECTING
                    orderGroupStateMachine.transition(orderGroup, OrderGroup.OrderGroupStatus.COLLECTING);
                    orderGroup = orderGroupRepository.save(orderGroup);
                    
                    // Add interests to group and update status using state machine
                    List<Long> userIds = new ArrayList<>();
                    List<Long> interestIds = new ArrayList<>();
                    for (Interest interest : locationInterests) {
                        interestStateMachine.transition(interest, Interest.InterestStatus.THRESHOLD_MET);
                        interestRepository.save(interest);
                        orderGroup.getInterests().add(interest);
                        userIds.add(interest.getUserId());
                        interestIds.add(interest.getId());
                    }
                    orderGroupRepository.save(orderGroup);
                    orderGroupRepository.flush();
                    
                    logger.info("Order group created for product {} location {}: orderGroupId={}, totalQuantity={}, interestCount={}", 
                        productId, groupingKey, orderGroup.getId(), totalQuantity, locationInterests.size());
                    
                    // Publish domain event
                    eventPublisher.publish(new ThresholdMetEvent(
                        orderGroup.getId(),
                        productId,
                        totalQuantity,
                        product.getMinOrderQuantity(),
                        interestIds,
                        userIds
                    ));
                    
                    // Notify all users
                    notificationService.notifyThresholdMet(userIds, interestIds, product.getName());
                    
                    // Notify wishlist users about direct order opportunity
                    notifyWishlistUsersForDirectOrder(orderGroup, product, cityId, cityName);
                } else {
                    logger.debug("Threshold not met for product {} location {}: totalQuantity={}, requiredQuantity={}", 
                        productId, groupingKey, totalQuantity, product.getMinOrderQuantity());
                }
            }
        } catch (Exception e) {
            logger.error("Error checking threshold for product {}: {}", productId, e.getMessage(), e);
            throw new OrderGroupCreationException("Failed to check threshold for product: " + productId, e);
        }
    }
    
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW, timeout = 30)
    public void checkAndCreateOrderGroups() {
        logger.debug("Starting checkAndCreateOrderGroups scheduled job");
        LocalDateTime now = LocalDateTime.now();
        List<ProductDTO> products = resilientProductService.getAllProducts();
        
        logger.info("Processing {} products for expired interests", products.size());
        
        // Process in chunks to avoid long-running transactions
        int chunkSize = 10;
        int processed = 0;
        for (int i = 0; i < products.size(); i += chunkSize) {
            int end = Math.min(i + chunkSize, products.size());
            List<ProductDTO> chunk = products.subList(i, end);
            
            for (ProductDTO product : chunk) {
                try {
                    processExpiredInterestsForProduct(product, now);
                    processed++;
                } catch (Exception e) {
                    logger.error("Error processing expired interests for product {}: {}", 
                        product.getId(), e.getMessage(), e);
                    // Continue with next product
                }
            }
            
            logger.debug("Processed chunk: {}/{} products", end, products.size());
        }
        
        logger.info("Completed checkAndCreateOrderGroups: processed {}/{} products", processed, products.size());
    }
    
    @Transactional(propagation = Propagation.REQUIRES_NEW, timeout = 30)
    private void processExpiredInterestsForProduct(ProductDTO product, LocalDateTime now) {
        // Get all expired PENDING interests for this product
        List<Interest> expiredInterests = interestRepository.findExpiredInterestsByProduct(
                product.getId(),
                now,
                Interest.InterestStatus.PENDING
        );
        
        if (expiredInterests.isEmpty()) {
            return;
        }
        
        logger.debug("Found {} expired interests for product {}", expiredInterests.size(), product.getId());
        
        // Check if these interests are already in an order group (with lock)
        List<OrderGroup> existingGroups = orderGroupRepository.findByProductIdWithInterestsLocked(product.getId());
        boolean interestsAlreadyInGroup = false;
        for (Interest interest : expiredInterests) {
            for (OrderGroup og : existingGroups) {
                if (og.getInterests().stream().anyMatch(i -> i.getId().equals(interest.getId()))) {
                    interestsAlreadyInGroup = true;
                    break;
                }
            }
            if (interestsAlreadyInGroup) break;
        }
        
        if (interestsAlreadyInGroup) {
            logger.debug("Expired interests for product {} are already in an order group", product.getId());
            return; // Skip if interests are already in a group
        }
        
        // Calculate total quantity from expired interests
        Integer totalQuantity = expiredInterests.stream()
                .mapToInt(Interest::getQuantity)
                .sum();
        
        // Check if threshold is met with expired interests
        if (totalQuantity >= product.getMinOrderQuantity() && !expiredInterests.isEmpty()) {
            // Create order group
            OrderGroup orderGroup = new OrderGroup();
            orderGroup.setProductId(product.getId());
            orderGroup.setTotalQuantity(totalQuantity);
            orderGroup.setRequiredQuantity(product.getMinOrderQuantity());
            orderGroup.setStatus(OrderGroup.OrderGroupStatus.COLLECTING);
            orderGroup = orderGroupRepository.save(orderGroup);
            
            // Add interests to group
            List<Long> userIds = new ArrayList<>();
            List<Long> interestIds = new ArrayList<>();
            for (Interest interest : expiredInterests) {
                interestStateMachine.transition(interest, Interest.InterestStatus.THRESHOLD_MET);
                interestRepository.save(interest);
                orderGroup.getInterests().add(interest);
                userIds.add(interest.getUserId());
                interestIds.add(interest.getId());
            }
            orderGroupRepository.save(orderGroup);
            orderGroupRepository.flush();
            
            logger.info("Order group created from expired interests for product {}: orderGroupId={}, interestCount={}", 
                product.getId(), orderGroup.getId(), expiredInterests.size());
            
            // Notify all users
            notificationService.notifyThresholdMet(userIds, interestIds, product.getName());
        }
    }
    
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW, timeout = 30)
    public void checkAndCreateOrderGroupsForActiveInterests() {
        logger.debug("Starting checkAndCreateOrderGroupsForActiveInterests scheduled job");
        // Also check active (non-expired) interests to see if threshold is met
        LocalDateTime now = LocalDateTime.now();
        List<ProductDTO> products = resilientProductService.getAllProducts();
        
        logger.info("Processing {} products for active interests", products.size());
        
        // Process in chunks to avoid long-running transactions
        int chunkSize = 10;
        int processed = 0;
        for (int i = 0; i < products.size(); i += chunkSize) {
            int end = Math.min(i + chunkSize, products.size());
            List<ProductDTO> chunk = products.subList(i, end);
            
            for (ProductDTO product : chunk) {
                try {
                    processActiveInterestsForProduct(product, now);
                    processed++;
                } catch (Exception e) {
                    logger.error("Error processing active interests for product {}: {}", 
                        product.getId(), e.getMessage(), e);
                    // Continue with next product
                }
            }
            
            logger.debug("Processed chunk: {}/{} products", end, products.size());
        }
        
        logger.info("Completed checkAndCreateOrderGroupsForActiveInterests: processed {}/{} products", processed, products.size());
    }
    
    @Transactional(propagation = Propagation.REQUIRES_NEW, timeout = 30)
    private void processActiveInterestsForProduct(ProductDTO product, LocalDateTime now) {
        // Get all PENDING interests for this product (including non-expired ones) with lock
        List<Interest> allPendingInterests = interestRepository.findByProductIdAndStatusLocked(
            product.getId(), Interest.InterestStatus.PENDING);
        
        if (allPendingInterests.isEmpty()) {
            return;
        }
        
        logger.debug("Found {} pending interests for product {}", allPendingInterests.size(), product.getId());
        
        // Check if these interests are already in an order group (with lock)
        List<OrderGroup> existingGroups = orderGroupRepository.findByProductIdWithInterestsLocked(product.getId());
        boolean interestsAlreadyInGroup = false;
        for (Interest interest : allPendingInterests) {
            for (OrderGroup og : existingGroups) {
                if (og.getInterests().stream().anyMatch(i -> i.getId().equals(interest.getId()))) {
                    interestsAlreadyInGroup = true;
                    break;
                }
            }
            if (interestsAlreadyInGroup) break;
        }
        
        if (interestsAlreadyInGroup) {
            logger.debug("Pending interests for product {} are already in an order group", product.getId());
            return; // Skip if interests are already in a group
        }
        
        // Calculate total quantity from all pending interests
        Integer totalQuantity = allPendingInterests.stream()
                .mapToInt(Interest::getQuantity)
                .sum();
        
        // Check if threshold is met
        if (totalQuantity >= product.getMinOrderQuantity() && !allPendingInterests.isEmpty()) {
            // Create order group with all pending interests
            OrderGroup orderGroup = new OrderGroup();
            orderGroup.setProductId(product.getId());
            orderGroup.setTotalQuantity(totalQuantity);
            orderGroup.setRequiredQuantity(product.getMinOrderQuantity());
            orderGroup.setStatus(OrderGroup.OrderGroupStatus.COLLECTING);
            orderGroup = orderGroupRepository.save(orderGroup);
            
            // Add interests to group
            List<Long> userIds = new ArrayList<>();
            List<Long> interestIds = new ArrayList<>();
            for (Interest interest : allPendingInterests) {
                interestStateMachine.transition(interest, Interest.InterestStatus.THRESHOLD_MET);
                interestRepository.save(interest);
                orderGroup.getInterests().add(interest);
                userIds.add(interest.getUserId());
                interestIds.add(interest.getId());
            }
            orderGroup = orderGroupRepository.save(orderGroup);
            orderGroupRepository.flush();
            
            logger.info("Order group created from active interests for product {}: orderGroupId={}, interestCount={}", 
                product.getId(), orderGroup.getId(), allPendingInterests.size());
            
            // Notify all users
            notificationService.notifyThresholdMet(userIds, interestIds, product.getName());
        }
    }
    
    @Override
    @Transactional(timeout = 60)
    public void checkOrderGroupCompletion() {
        logger.debug("Checking order group completion");
        
        try {
            // First, ensure order groups exist for THRESHOLD_MET or COLLECTING interests (create if missing)
            ensureOrderGroupsForThresholdMetInterests();
            
            // Check existing order groups in COLLECTING status
            List<OrderGroup> collectingGroups = orderGroupRepository.findByStatus(OrderGroup.OrderGroupStatus.COLLECTING);
            
            logger.debug("Found {} order groups in COLLECTING status", collectingGroups.size());
            
            for (OrderGroup orderGroup : collectingGroups) {
                try {
                    // Use pessimistic locking to prevent race conditions
                    OrderGroup lockedGroup = orderGroupRepository.findByIdWithInterestsLocked(orderGroup.getId())
                        .orElseThrow(() -> new RuntimeException("Order group not found: " + orderGroup.getId()));
                    
                    boolean allPaid = true;
                    List<Long> unpaidInterestIds = new ArrayList<>();
                    
                    for (Interest interest : lockedGroup.getInterests()) {
                        // Verify payment with proper error handling (using resilient service)
                        boolean hasRemainingPayment = resilientPaymentQueryService.hasRemainingPaymentCompleted(interest.getId());
                        
                        if (!hasRemainingPayment) {
                            allPaid = false;
                            unpaidInterestIds.add(interest.getId());
                        }
                    }
                    
                    if (allPaid && !lockedGroup.getInterests().isEmpty()) {
                        // Double-check: Verify all payments are actually completed before marking as complete
                        logger.info("All payments verified for order group {}: interestCount={}", 
                            lockedGroup.getId(), lockedGroup.getInterests().size());
                        
                        // Use state machine to transition order group
                        orderGroupStateMachine.transition(lockedGroup, OrderGroup.OrderGroupStatus.COMPLETE);
                        lockedGroup.setCompletedAt(LocalDateTime.now());
                        
                        // Update all interests to COMPLETE using state machine
                        for (Interest interest : lockedGroup.getInterests()) {
                            interestStateMachine.transition(interest, Interest.InterestStatus.COMPLETE);
                            interestRepository.save(interest);
                        }
                        
                        orderGroupRepository.save(lockedGroup);
                        orderGroupRepository.flush();
                        
                        logger.info("Order group {} marked as COMPLETE", lockedGroup.getId());
                        
                        // Notify admin - get all user IDs from interests
                        List<Long> userIds = lockedGroup.getInterests().stream()
                                .map(Interest::getUserId)
                                .collect(Collectors.toList());
                        ProductDTO product = resilientProductService.getProductById(lockedGroup.getProductId());
                        notificationService.notifyAllPaymentsComplete(lockedGroup.getId(), product.getName(), userIds);
                    } else if (!unpaidInterestIds.isEmpty()) {
                        logger.debug("Order group {} still has unpaid interests: {}", 
                            lockedGroup.getId(), unpaidInterestIds);
                    }
                } catch (PaymentVerificationException e) {
                    logger.error("Payment verification failed for order group {}: {}", 
                        orderGroup.getId(), e.getMessage(), e);
                    // Continue with other order groups
                } catch (Exception e) {
                    logger.error("Error processing order group {}: {}", orderGroup.getId(), e.getMessage(), e);
                    // Continue with other order groups
                }
            }
            
            // Also check for THRESHOLD_MET or COLLECTING interests that have all paid but no order group yet
            checkAndCreateOrderGroupsForPaidInterests();
        } catch (Exception e) {
            logger.error("Error in checkOrderGroupCompletion: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    @Transactional
    private void ensureOrderGroupsForThresholdMetInterests() {
        List<ProductDTO> products = resilientProductService.getAllProducts();
        
        for (ProductDTO product : products) {
            // Get all THRESHOLD_MET or COLLECTING interests for this product
            List<Interest> thresholdMetInterests = interestRepository.findByProductId(product.getId()).stream()
                    .filter(i -> i.getStatus() == Interest.InterestStatus.THRESHOLD_MET || 
                               i.getStatus() == Interest.InterestStatus.COLLECTING)
                    .collect(Collectors.toList());
            
            if (thresholdMetInterests.isEmpty()) {
                continue;
            }
            
            // Check if there's already an order group for these interests
            List<OrderGroup> existingGroups = orderGroupRepository.findByProductIdWithInterests(product.getId());
            boolean hasGroupForTheseInterests = false;
            for (Interest interest : thresholdMetInterests) {
                for (OrderGroup og : existingGroups) {
                    if (og.getInterests().stream().anyMatch(i -> i.getId().equals(interest.getId()))) {
                        hasGroupForTheseInterests = true;
                        break;
                    }
                }
                if (hasGroupForTheseInterests) break;
            }
            
            if (!hasGroupForTheseInterests) {
                // Create order group for these interests
                Integer totalQuantity = thresholdMetInterests.stream()
                        .mapToInt(Interest::getQuantity)
                        .sum();
                
                OrderGroup orderGroup = new OrderGroup();
                orderGroup.setProductId(product.getId());
                orderGroup.setTotalQuantity(totalQuantity);
                orderGroup.setRequiredQuantity(product.getMinOrderQuantity());
                orderGroupStateMachine.transition(orderGroup, OrderGroup.OrderGroupStatus.COLLECTING);
                orderGroup = orderGroupRepository.save(orderGroup);
                
                // Add interests to group
                for (Interest interest : thresholdMetInterests) {
                    orderGroup.getInterests().add(interest);
                }
                orderGroup = orderGroupRepository.save(orderGroup);
                orderGroupRepository.flush();
            }
        }
    }
    
    @Transactional
    private void checkAndCreateOrderGroupsForPaidInterests() {
        List<ProductDTO> products = resilientProductService.getAllProducts();
        
        for (ProductDTO product : products) {
            // Get all THRESHOLD_MET or COLLECTING interests for this product
            List<Interest> thresholdMetInterests = interestRepository.findByProductId(product.getId()).stream()
                    .filter(i -> i.getStatus() == Interest.InterestStatus.THRESHOLD_MET ||
                               i.getStatus() == Interest.InterestStatus.COLLECTING)
                    .collect(Collectors.toList());
            
            if (thresholdMetInterests.isEmpty()) {
                continue;
            }
            
            // Check if these interests are already in an order group
            List<OrderGroup> existingGroups = orderGroupRepository.findByProductIdWithInterests(product.getId());
            boolean interestsAlreadyInGroup = false;
            for (Interest interest : thresholdMetInterests) {
                for (OrderGroup og : existingGroups) {
                    if (og.getInterests().stream().anyMatch(i -> i.getId().equals(interest.getId()))) {
                        interestsAlreadyInGroup = true;
                        break;
                    }
                }
                if (interestsAlreadyInGroup) break;
            }
            
            if (interestsAlreadyInGroup) {
                continue; // Skip if interests are already in a group
            }
            
            // Check if all interests have paid their remaining balance
            boolean allPaid = true;
            for (Interest interest : thresholdMetInterests) {
                boolean hasRemainingPayment = resilientPaymentQueryService.hasRemainingPaymentCompleted(interest.getId());
                
                if (!hasRemainingPayment) {
                    allPaid = false;
                    break;
                }
            }
            
            if (allPaid && !thresholdMetInterests.isEmpty()) {
                // All paid - create order group and mark as complete
                Integer totalQuantity = thresholdMetInterests.stream()
                        .mapToInt(Interest::getQuantity)
                        .sum();
                
                OrderGroup orderGroup = new OrderGroup();
                orderGroup.setProductId(product.getId());
                orderGroup.setTotalQuantity(totalQuantity);
                orderGroup.setRequiredQuantity(product.getMinOrderQuantity());
                orderGroupStateMachine.transition(orderGroup, OrderGroup.OrderGroupStatus.COMPLETE);
                orderGroup.setCompletedAt(LocalDateTime.now());
                orderGroup = orderGroupRepository.save(orderGroup);
                
                // Add interests to group and mark as complete
                for (Interest interest : thresholdMetInterests) {
                    interestStateMachine.transition(interest, Interest.InterestStatus.COMPLETE);
                    interestRepository.save(interest);
                    orderGroup.getInterests().add(interest);
                }
                orderGroup = orderGroupRepository.save(orderGroup);
                orderGroupRepository.flush();
                
                // Notify admin
                List<Long> userIds = thresholdMetInterests.stream()
                        .map(Interest::getUserId)
                        .collect(Collectors.toList());
                notificationService.notifyAllPaymentsComplete(orderGroup.getId(), product.getName(), userIds);
            }
        }
    }
    
    @Override
    @Transactional
    public void triggerOrderGroupCompletionCheck() {
        checkOrderGroupCompletion();
    }
    
    @Override
    public List<OrderGroupDTO> getAllOrderGroups() {
        return orderGroupRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<PendingInterestDTO> getPendingInterestsSummary() {
        LocalDateTime now = LocalDateTime.now();
        List<Interest> allPendingInterests = interestRepository.findByStatus(Interest.InterestStatus.PENDING);
        
        return allPendingInterests.stream()
                .map(interest -> {
                    PendingInterestDTO dto = new PendingInterestDTO();
                    dto.setInterestId(interest.getId());
                    dto.setProductId(interest.getProductId());
                    
                    // Get product name
                    try {
                        ProductDTO product = resilientProductService.getProductById(interest.getProductId());
                        dto.setProductName(product.getName());
                    } catch (Exception e) {
                        dto.setProductName("Product not found");
                    }
                    
                    // Get user email
                    try {
                        org.bulkby.auth.model.User user = userService.findById(interest.getUserId()).orElse(null);
                        dto.setUserEmail(user != null ? user.getEmail() : "Unknown");
                    } catch (Exception e) {
                        dto.setUserEmail("Unknown");
                    }
                    
                    dto.setQuantity(interest.getQuantity());
                    dto.setEndDate(interest.getEndDate());
                    dto.setIsExpired(interest.getEndDate().isBefore(now) || interest.getEndDate().isEqual(now));
                    
                    if (!dto.getIsExpired()) {
                        long days = java.time.temporal.ChronoUnit.DAYS.between(now, interest.getEndDate());
                        dto.setDaysRemaining((int) days);
                    } else {
                        dto.setDaysRemaining(0);
                    }
                    
                    return dto;
                })
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public void markPickedUp(Long interestId) {
        Interest interest = interestRepository.findById(interestId)
                .orElseThrow(() -> new org.bulkby.order.exception.InterestNotFoundException(interestId));
        Order order = orderRepository.findByInterestId(interestId)
                .orElseThrow(() -> new IllegalArgumentException("No order found for interest " + interestId));
        LocalDateTime now = LocalDateTime.now();
        OrderTracking tracking = new OrderTracking();
        tracking.setInterestId(interestId);
        tracking.setOrderId(order.getId());
        tracking.setSellerOrderId(order.getSellerOrderId());
        tracking.setStatus(OrderTracking.TrackingStatus.PICKED_UP);
        tracking.setStatusDate(now);
        tracking.setPickedUpAt(now);
        orderTrackingRepository.save(tracking);
        order.setStatus(Order.OrderStatus.PICKED_UP);
        order.setPickedUpAt(now);
        orderRepository.save(order);
        interestStateMachine.transition(interest, Interest.InterestStatus.COMPLETE);
        interestRepository.save(interest);
        logger.info("Marked interest {} as picked up (order {})", interestId, order.getId());
    }
    
    @Override
    @Transactional
    public void markDelivered(Long interestId, String deliveryTrackingId) {
        Interest interest = interestRepository.findById(interestId)
                .orElseThrow(() -> new org.bulkby.order.exception.InterestNotFoundException(interestId));
        Order order = orderRepository.findByInterestId(interestId)
                .orElseThrow(() -> new IllegalArgumentException("No order found for interest " + interestId));
        LocalDateTime now = LocalDateTime.now();
        OrderTracking tracking = new OrderTracking();
        tracking.setInterestId(interestId);
        tracking.setOrderId(order.getId());
        tracking.setSellerOrderId(order.getSellerOrderId());
        tracking.setStatus(OrderTracking.TrackingStatus.DELIVERED);
        tracking.setStatusDate(now);
        tracking.setDeliveredAt(now);
        if (deliveryTrackingId != null && !deliveryTrackingId.isBlank()) {
            tracking.setCarrierTrackingNumber(deliveryTrackingId);
        }
        orderTrackingRepository.save(tracking);
        order.setStatus(Order.OrderStatus.DELIVERED);
        order.setDeliveredAt(now);
        orderRepository.save(order);
        interestStateMachine.transition(interest, Interest.InterestStatus.COMPLETE);
        interestRepository.save(interest);
        logger.info("Marked interest {} as delivered (order {})", interestId, order.getId());
    }
    
    @Override
    public OrderDetailDTO getOrderGroupDetails(Long id) {
        OrderGroup orderGroup = orderGroupRepository.findByIdWithInterests(id)
                .orElseThrow(() -> new RuntimeException("Order group not found"));
        
        return convertToOrderDetailDTO(orderGroup);
    }
    
    private OrderDetailDTO convertToOrderDetailDTO(OrderGroup orderGroup) {
        OrderDetailDTO dto = new OrderDetailDTO();
        dto.setOrderGroupId(orderGroup.getId());
        
        ProductDTO product = resilientProductService.getProductById(orderGroup.getProductId());
        dto.setProductName(product.getName());
        dto.setProductId(orderGroup.getProductId());
        dto.setTotalQuantity(orderGroup.getTotalQuantity());
        dto.setRequiredQuantity(orderGroup.getRequiredQuantity());
        dto.setStatus(orderGroup.getStatus().name());
        dto.setCreatedAt(orderGroup.getCreatedAt());
        dto.setCompletedAt(orderGroup.getCompletedAt());
        dto.setCityName(orderGroup.getCityName());
        dto.setCityId(orderGroup.getCityId());
        dto.setGroupingKey(orderGroup.getGroupingKey());
        
        // Set product and seller information for order placement
        OrderDetailDTO.ProductInfoDTO productInfo = new OrderDetailDTO.ProductInfoDTO();
        productInfo.setProductId(product.getId());
        productInfo.setProductName(product.getName());
        productInfo.setCostPerUnit(product.getCostPerUnit());
        productInfo.setDeliveryCostPerMinOrder(product.getDeliveryCostPerMinOrder());
        productInfo.setMinOrderQuantity(product.getMinOrderQuantity());
        
        // Amount to pay seller: totalQuantity × (costPerUnit + deliveryCostPerMinOrder / minOrderQuantity)
        if (product.getCostPerUnit() != null && orderGroup.getTotalQuantity() != null && orderGroup.getTotalQuantity() > 0) {
            BigDecimal costPerUnit = product.getCostPerUnit();
            int totalQty = orderGroup.getTotalQuantity();
            BigDecimal productCost = costPerUnit.multiply(BigDecimal.valueOf(totalQty));
            BigDecimal deliveryForOrder = BigDecimal.ZERO;
            if (product.getDeliveryCostPerMinOrder() != null && product.getMinOrderQuantity() != null && product.getMinOrderQuantity() > 0) {
                deliveryForOrder = product.getDeliveryCostPerMinOrder()
                    .divide(BigDecimal.valueOf(product.getMinOrderQuantity()), 4, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(totalQty));
            }
            productInfo.setAmountToPaySeller(productCost.add(deliveryForOrder).setScale(2, java.math.RoundingMode.HALF_UP));
        }
        
        // Get seller information if product has a seller
        if (product.getSellerId() != null) {
            try {
                org.bulkby.auth.model.User seller = userService.findById(product.getSellerId()).orElse(null);
                if (seller != null) {
                    OrderDetailDTO.SellerInfoDTO sellerInfo = new OrderDetailDTO.SellerInfoDTO();
                    sellerInfo.setSellerId(seller.getId());
                    sellerInfo.setSellerName(seller.getFullName());
                    sellerInfo.setSellerEmail(seller.getEmail());
                    sellerInfo.setSellerPhone(seller.getPhone());
                    productInfo.setSeller(sellerInfo);
                }
            } catch (Exception e) {
                logger.warn("Failed to fetch seller information for product {}: {}", product.getId(), e.getMessage());
            }
        }
        dto.setProductInfo(productInfo);
        
        // Get interests
        List<Interest> interests = new ArrayList<>(orderGroup.getInterests());
        if (interests.isEmpty()) {
            interests = interestRepository.findByOrderGroupId(orderGroup.getId());
        }
        
        // Check if current user is admin
        boolean isAdmin = isCurrentUserAdmin();
        
        // Convert interests to order items
        List<OrderDetailDTO.OrderItemDTO> orderItems = interests.stream()
                .map(interest -> convertInterestToOrderItem(interest, isAdmin))
                .collect(Collectors.toList());
        dto.setOrderItems(orderItems);
        
        // Calculate total amount collected
        BigDecimal totalAmount = orderItems.stream()
                .map(OrderDetailDTO.OrderItemDTO::getTotalPaid)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalAmountCollected(totalAmount);
        
        // Group by warehouse
        List<OrderDetailDTO.WarehouseGroupDTO> warehouseGroups = groupByWarehouse(orderItems);
        dto.setWarehouseGroups(warehouseGroups);
        
        // Group by city (for deliveries)
        List<OrderDetailDTO.CityGroupDTO> cityGroups = groupByCity(orderItems);
        dto.setCityGroups(cityGroups);
        
        // Calculate financial summary
        try {
            org.bulkby.order.dto.FinancialSummaryDTO financialSummary = 
                financialCalculationService.calculateOrderGroupFinancials(orderGroup.getId());
            dto.setFinancialSummary(financialSummary);
        } catch (Exception e) {
            logger.warn("Failed to calculate financial summary for OrderGroup {}: {}", 
                orderGroup.getId(), e.getMessage());
            // Continue without financial summary
        }
        
        return dto;
    }
    
    private boolean isCurrentUserAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(auth -> auth.equals("ROLE_ADMIN") || auth.equals("ADMIN"));
    }
    
    private OrderDetailDTO.OrderItemDTO convertInterestToOrderItem(Interest interest, boolean includeUserPII) {
        OrderDetailDTO.OrderItemDTO item = new OrderDetailDTO.OrderItemDTO();
        item.setInterestId(interest.getId());
        
        // Get Order info if Interest has become an Order (1:1 relationship)
        // All transactions remain traceable through Interest → Payments
        orderRepository.findByInterestId(interest.getId()).ifPresent(order -> {
            item.setOrderId(order.getId());
            item.setOrderNumber(order.getOrderNumber());
            item.setOrderStatus(order.getStatus().name());
        });
        
        // Get user info - only include PII for admin users
        if (includeUserPII) {
            org.bulkby.auth.model.User user = userService.findById(interest.getUserId()).orElse(null);
            item.setUserEmail(user != null ? user.getEmail() : null);
            item.setUserName(user != null ? user.getFullName() : null);
        } else {
            // For non-admin users, don't expose other users' PII
            item.setUserEmail(null);
            item.setUserName(null);
        }
        
        item.setQuantity(interest.getQuantity());
        
        // Get product info
        ProductDTO product = resilientProductService.getProductById(interest.getProductId());
        item.setUnitPrice(product.getPrice());
        item.setTotalPrice(product.getPrice().multiply(BigDecimal.valueOf(interest.getQuantity())));
        item.setDepositPaid(interest.getDepositPaid());
        item.setLogisticsPreference(interest.getLogisticsPreference().name());
        item.setDeliveryAddress(interest.getDeliveryAddress());
        item.setStatus(interest.getStatus().name());
        item.setCreatedAt(interest.getStartDate());
        
        // Get warehouse info if pickup
        if (interest.getWarehouseId() != null) {
            try {
                org.bulkby.logistics.dto.WarehouseDTO warehouse = warehouseService.getWarehouseById(interest.getWarehouseId());
                OrderDetailDTO.WarehouseInfoDTO warehouseInfo = new OrderDetailDTO.WarehouseInfoDTO();
                warehouseInfo.setId(warehouse.getId());
                warehouseInfo.setName(warehouse.getName());
                // Construct address from available fields
                StringBuilder addr = new StringBuilder();
                if (warehouse.getStreet() != null) addr.append(warehouse.getStreet());
                if (warehouse.getCity() != null) {
                    if (addr.length() > 0) addr.append(", ");
                    addr.append(warehouse.getCity());
                }
                if (warehouse.getState() != null) {
                    if (addr.length() > 0) addr.append(", ");
                    addr.append(warehouse.getState());
                }
                if (warehouse.getPincode() != null) {
                    if (addr.length() > 0) addr.append(" ");
                    addr.append(warehouse.getPincode());
                }
                warehouseInfo.setAddress(addr.toString());
                warehouseInfo.setCity(warehouse.getCity());
                warehouseInfo.setState(warehouse.getState());
                warehouseInfo.setZipCode(warehouse.getPincode());
                warehouseInfo.setPhone(warehouse.getPhone());
                warehouseInfo.setHoursOfOperation(warehouse.getHoursOfOperation());
                item.setWarehouse(warehouseInfo);
            } catch (Exception e) {
                // Warehouse not found - set basic info
                OrderDetailDTO.WarehouseInfoDTO warehouseInfo = new OrderDetailDTO.WarehouseInfoDTO();
                warehouseInfo.setId(interest.getWarehouseId());
                warehouseInfo.setName("Warehouse");
                item.setWarehouse(warehouseInfo);
            }
        }
        
        // Get all payments for this interest
        List<OrderDetailDTO.PaymentInfoDTO> payments = resilientPaymentQueryService.getPaymentsByInterestId(interest.getId()).stream()
                .map(p -> {
                    OrderDetailDTO.PaymentInfoDTO paymentInfo = new OrderDetailDTO.PaymentInfoDTO();
                    paymentInfo.setPaymentId(p.getId());
                    paymentInfo.setPaymentType(p.getPaymentType());
                    paymentInfo.setAmount(p.getAmount());
                    paymentInfo.setStatus(p.getStatus());
                    paymentInfo.setTransactionId(p.getTransactionId());
                    paymentInfo.setCreatedAt(p.getCreatedAt());
                    return paymentInfo;
                })
                .collect(Collectors.toList());
        item.setPayments(payments);
        
        // Calculate paid amounts
        BigDecimal remainingPaid = payments.stream()
                .filter(p -> "REMAINING".equals(p.getPaymentType()) && "COMPLETED".equals(p.getStatus()))
                .map(OrderDetailDTO.PaymentInfoDTO::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        item.setRemainingPaid(remainingPaid);
        
        BigDecimal logisticsPaid = payments.stream()
                .filter(p -> "LOGISTICS".equals(p.getPaymentType()) && "COMPLETED".equals(p.getStatus()))
                .map(OrderDetailDTO.PaymentInfoDTO::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        item.setLogisticsPaid(logisticsPaid);
        
        BigDecimal totalPaid = (interest.getDepositPaid() != null ? interest.getDepositPaid() : BigDecimal.ZERO)
                .add(remainingPaid)
                .add(logisticsPaid);
        item.setTotalPaid(totalPaid);
        
        // Check tracking data to determine if picked up or delivered
        List<OrderTracking> trackingRecords = orderTrackingRepository.findByInterestId(interest.getId());
        boolean pickedUp = trackingRecords.stream()
                .anyMatch(t -> t.getStatus() == OrderTracking.TrackingStatus.PICKED_UP);
        boolean delivered = trackingRecords.stream()
                .anyMatch(t -> t.getStatus() == OrderTracking.TrackingStatus.DELIVERED);
        
        item.setPickedUp(pickedUp);
        item.setDelivered(delivered);
        
        // Set pickup/delivery timestamps if available
        if (pickedUp) {
            trackingRecords.stream()
                    .filter(t -> t.getStatus() == OrderTracking.TrackingStatus.PICKED_UP)
                    .findFirst()
                    .ifPresent(t -> item.setPickedUpAt(t.getPickedUpAt()));
        }
        if (delivered) {
            trackingRecords.stream()
                    .filter(t -> t.getStatus() == OrderTracking.TrackingStatus.DELIVERED)
                    .findFirst()
                    .ifPresent(t -> item.setDeliveredAt(t.getDeliveredAt()));
        }
        
        return item;
    }
    
    private List<OrderDetailDTO.WarehouseGroupDTO> groupByWarehouse(
            List<OrderDetailDTO.OrderItemDTO> orderItems) {
        Map<String, List<OrderDetailDTO.OrderItemDTO>> grouped = orderItems.stream()
                .filter(item -> "PICKUP".equals(item.getLogisticsPreference()) && item.getWarehouse() != null)
                .collect(Collectors.groupingBy(item -> item.getWarehouse().getId().toString()));
        
        return grouped.entrySet().stream()
                .map(entry -> {
                    List<OrderDetailDTO.OrderItemDTO> warehouseOrders = entry.getValue();
                    OrderDetailDTO.WarehouseGroupDTO group = new OrderDetailDTO.WarehouseGroupDTO();
                    group.setWarehouse(warehouseOrders.get(0).getWarehouse());
                    group.setTotalQuantity(warehouseOrders.stream().mapToInt(OrderDetailDTO.OrderItemDTO::getQuantity).sum());
                    group.setTotalOrders(warehouseOrders.size());
                    group.setOrders(warehouseOrders);
                    group.setPickedUpCount((int) warehouseOrders.stream().filter(OrderDetailDTO.OrderItemDTO::getPickedUp).count());
                    group.setPendingPickupCount(warehouseOrders.size() - group.getPickedUpCount());
                    return group;
                })
                .collect(Collectors.toList());
    }
    
    private List<OrderDetailDTO.CityGroupDTO> groupByCity(
            List<OrderDetailDTO.OrderItemDTO> orderItems) {
        Map<String, List<OrderDetailDTO.OrderItemDTO>> grouped = orderItems.stream()
                .filter(item -> "DELIVERY".equals(item.getLogisticsPreference()) && item.getDeliveryAddress() != null)
                .collect(Collectors.groupingBy(item -> {
                    // Extract city from delivery address (simple parsing)
                    String address = item.getDeliveryAddress();
                    String[] parts = address.split(",");
                    if (parts.length >= 2) {
                        return parts[parts.length - 2].trim() + ", " + (parts.length >= 3 ? parts[parts.length - 1].trim() : "");
                    }
                    return "Unknown";
                }));
        
        return grouped.entrySet().stream()
                .map(entry -> {
                    List<OrderDetailDTO.OrderItemDTO> cityOrders = entry.getValue();
                    OrderDetailDTO.CityGroupDTO group = new OrderDetailDTO.CityGroupDTO();
                    String[] cityState = entry.getKey().split(", ");
                    group.setCity(cityState.length > 0 ? cityState[0] : entry.getKey());
                    group.setState(cityState.length > 1 ? cityState[1] : "");
                    group.setTotalQuantity(cityOrders.stream().mapToInt(OrderDetailDTO.OrderItemDTO::getQuantity).sum());
                    group.setTotalOrders(cityOrders.size());
                    group.setOrders(cityOrders);
                    group.setDeliveredCount((int) cityOrders.stream().filter(OrderDetailDTO.OrderItemDTO::getDelivered).count());
                    group.setPendingDeliveryCount(cityOrders.size() - group.getDeliveredCount());
                    return group;
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Notify wishlist users about direct order opportunity when threshold is met
     */
    private void notifyWishlistUsersForDirectOrder(OrderGroup orderGroup, ProductDTO product, Long cityId, String cityName) {
        if (wishlistService == null) {
            logger.debug("WishlistService not available, skipping wishlist notifications");
            return;
        }
        
        try {
            // Check if seller order has been placed (if yes, skip notification)
            boolean sellerOrderPlaced = sellerOrderRepository.findByOrderGroupId(orderGroup.getId()).isPresent();
            if (sellerOrderPlaced) {
                logger.debug("Seller order already placed for order group {}, skipping wishlist notifications", orderGroup.getId());
                return;
            }
            
            // Get wishlist users who have product in wishlist and address in same city
            if (cityId == null) {
                logger.debug("CityId is null for order group {}, skipping wishlist notifications", orderGroup.getId());
                return;
            }
            
            List<Long> wishlistUserIds = wishlistService.getWishlistUsersByProductAndCity(
                product.getId(), cityId);
            
            if (wishlistUserIds == null || wishlistUserIds.isEmpty()) {
                logger.debug("No wishlist users found for product {} in city {}", product.getId(), cityId);
                return;
            }
            
            // Filter out users who already have interests in this order group
            Set<Long> existingInterestUserIds = orderGroup.getInterests().stream()
                    .map(Interest::getUserId)
                    .collect(Collectors.toSet());
            
            List<Long> usersToNotify = wishlistUserIds.stream()
                    .filter(userId -> !existingInterestUserIds.contains(userId))
                    .collect(Collectors.toList());
            
            if (usersToNotify.isEmpty()) {
                logger.debug("All wishlist users already have interests in order group {}", orderGroup.getId());
                return;
            }
            
            // Notify users
            String cityDisplayName = cityName != null ? cityName : "your city";
            for (Long userId : usersToNotify) {
                try {
                    notificationService.notifyWishlistUsersDirectOrderAvailable(
                        orderGroup.getId(), 
                        List.of(userId), 
                        product.getName(), 
                        cityDisplayName);
                    
                    // Mark wishlist as notified
                    try {
                        wishlistService.markAsNotified(userId, product.getId());
                    } catch (Exception e) {
                        logger.warn("Error marking wishlist as notified for user {} product {}: {}", 
                            userId, product.getId(), e.getMessage());
                    }
                } catch (Exception e) {
                    logger.warn("Error notifying wishlist user {} about direct order opportunity: {}", 
                        userId, e.getMessage());
                }
            }
            
            logger.info("Notified {} wishlist users about direct order opportunity for product {} in city {}", 
                usersToNotify.size(), product.getId(), cityDisplayName);
        } catch (Exception e) {
            logger.error("Error notifying wishlist users for direct order opportunity: {}", e.getMessage(), e);
            // Don't throw - this is a non-critical operation
        }
    }
    
    @Override
    @Transactional
    public void setAcceptingNewOrders(Long orderGroupId, Boolean accepting) {
        OrderGroup orderGroup = orderGroupRepository.findById(orderGroupId)
                .orElseThrow(() -> new RuntimeException("Order group not found: " + orderGroupId));
        orderGroup.setAcceptingNewOrders(accepting);
        orderGroupRepository.save(orderGroup);
        logger.info("Order group {} accepting new orders set to {}", orderGroupId, accepting);
    }
    
    @Override
    @Transactional
    public void setAcceptingNewOrdersForAll(Boolean accepting) {
        List<OrderGroup> allOrderGroups = orderGroupRepository.findAll();
        for (OrderGroup orderGroup : allOrderGroups) {
            orderGroup.setAcceptingNewOrders(accepting);
        }
        orderGroupRepository.saveAll(allOrderGroups);
        logger.info("All order groups accepting new orders set to {}", accepting);
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean isDirectOrderAvailable(Long productId, Long cityId) {
        // Find order groups for this product and city that are in COLLECTING status
        List<OrderGroup> orderGroups = orderGroupRepository.findByProductIdWithInterests(productId);
        
        for (OrderGroup orderGroup : orderGroups) {
            // Check if order group matches city
            if (orderGroup.getCityId() != null && orderGroup.getCityId().equals(cityId)) {
                // Check if order group is in COLLECTING status
                if (orderGroup.getStatus() == OrderGroup.OrderGroupStatus.COLLECTING) {
                    // Check if accepting new orders
                    if (orderGroup.getAcceptingNewOrders() != null && orderGroup.getAcceptingNewOrders()) {
                        // Check if seller order has been placed (if yes, direct orders not available)
                        boolean sellerOrderPlaced = sellerOrderRepository.findByOrderGroupId(orderGroup.getId()).isPresent();
                        if (!sellerOrderPlaced) {
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
    }
}
