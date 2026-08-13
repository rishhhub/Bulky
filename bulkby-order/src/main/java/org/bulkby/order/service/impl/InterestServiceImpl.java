package org.bulkby.order.service.impl;

import org.bulkby.auth.repository.UserRepository;
import org.bulkby.order.service.ResilientProductService;
import org.bulkby.order.service.ResilientLogisticsService;
import org.bulkby.logistics.dto.LogisticsCostRequest;
import org.bulkby.logistics.dto.LogisticsCostResponse;
import org.bulkby.notification.service.NotificationService;
import org.bulkby.order.dto.InterestDTO;
import org.bulkby.order.dto.InterestRequest;
import org.bulkby.order.dto.UpdateInterestRequest;
import org.bulkby.order.dto.UpdateInterestResponse;
import org.bulkby.order.event.DomainEventPublisher;
import org.bulkby.order.event.InterestCreatedEvent;
import org.bulkby.order.event.InterestUpdatedEvent;
import org.bulkby.order.exception.InterestNotFoundException;
import org.bulkby.order.statemachine.InterestStateMachine;
import org.bulkby.order.exception.InvalidInterestStatusException;
import org.bulkby.order.exception.ValidationException;
import org.bulkby.order.model.Interest;
import org.bulkby.order.model.OrderGroup;
import org.bulkby.order.repository.InterestRepository;
import org.bulkby.order.repository.OrderGroupRepository;
import org.bulkby.order.repository.OrderRepository;
import org.bulkby.order.service.InterestService;
import org.bulkby.order.service.LocationGroupingService;
import org.bulkby.order.service.OrderGroupService;
import org.bulkby.order.service.PaymentQueryService;
import org.bulkby.order.service.PaymentService;
import org.bulkby.order.service.TransactionHistoryService;
import org.bulkby.order.model.InterestTransaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class InterestServiceImpl implements InterestService {
    
    private static final Logger logger = LoggerFactory.getLogger(InterestServiceImpl.class);
    
    @Autowired
    private InterestRepository interestRepository;
    
    @Autowired
    private ResilientProductService resilientProductService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ResilientLogisticsService resilientLogisticsService;
    
    @Autowired
    @Lazy
    private PaymentService paymentService;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private OrderGroupService orderGroupService;
    
    @Autowired
    @Lazy
    private OrderGroupRepository orderGroupRepository;
    
    @Autowired
    @Lazy
    private PaymentQueryService paymentQueryService;
    
    @Autowired
    private DomainEventPublisher eventPublisher;
    
    @Autowired
    private InterestStateMachine stateMachine;
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private TransactionHistoryService transactionHistoryService;
    
    @Autowired
    private org.bulkby.common.service.PincodeService pincodeService;
    
    @Autowired
    private org.bulkby.logistics.service.WarehouseService warehouseService;
    
    @Autowired
    private LocationGroupingService locationGroupingService;
    
    private InterestDTO convertToDTO(Interest interest) {
        InterestDTO dto = new InterestDTO();
        dto.setId(interest.getId());
        dto.setUserId(interest.getUserId());
        dto.setProductId(interest.getProductId());
        
        // Get product name from catalog service
        try {
            org.bulkby.catalog.dto.ProductDTO product = resilientProductService.getProductById(interest.getProductId());
            dto.setProductName(product.getName());
        } catch (Exception e) {
            logger.warn("Failed to fetch product {} for interest {}: {}", interest.getProductId(), interest.getId(), e.getMessage());
            dto.setProductName("Product not found");
        }
        
        dto.setQuantity(interest.getQuantity());
        dto.setDepositPaid(interest.getDepositPaid());
        dto.setPeriodDays(interest.getPeriodDays());
        dto.setStartDate(interest.getStartDate());
        dto.setEndDate(interest.getEndDate());
        dto.setLogisticsPreference(interest.getLogisticsPreference().name());
        dto.setDeliveryAddress(interest.getDeliveryAddress());
        dto.setWarehouseId(interest.getWarehouseId());
        
        // Get warehouse name if needed
        if (interest.getWarehouseId() != null) {
            // Would need warehouse service interface
        }
        
        dto.setDeliveryCost(interest.getDeliveryCost());
        dto.setStatus(interest.getStatus().name());
        dto.setExtensionReminderSentAt(interest.getExtensionReminderSentAt());
        dto.setRefundProcessedAt(interest.getRefundProcessedAt());
        
        // Get Order info if Interest has become an Order (1:1 relationship)
        orderRepository.findByInterestId(interest.getId()).ifPresent(order -> {
            dto.setOrderId(order.getId());
            dto.setOrderNumber(order.getOrderNumber());
        });
        
        // Calculate threshold progress (for PENDING interests)
        // Only count interests in the same location group (same city for DELIVERY, same warehouse for PICKUP)
        if (interest.getStatus() == Interest.InterestStatus.PENDING) {
            try {
                org.bulkby.catalog.dto.ProductDTO product = resilientProductService.getProductById(interest.getProductId());
                
                // Get grouping key for this interest
                String currentGroupingKey = locationGroupingService.generateGroupingKey(interest);
                
                // Get all pending interests for this product
                List<Interest> allPendingInterests = interestRepository.findByProductId(interest.getProductId()).stream()
                        .filter(i -> i.getStatus() == Interest.InterestStatus.PENDING)
                        .collect(Collectors.toList());
                
                // Filter to only interests in the same location group
                List<Interest> locationGroupInterests = allPendingInterests.stream()
                        .filter(i -> {
                            String groupingKey = locationGroupingService.generateGroupingKey(i);
                            return groupingKey != null && groupingKey.equals(currentGroupingKey);
                        })
                        .collect(Collectors.toList());
                
                Integer totalQuantity = locationGroupInterests.stream()
                        .mapToInt(Interest::getQuantity)
                        .sum();
                
                dto.setTotalQuantity(totalQuantity);
                dto.setRequiredQuantity(product.getMinOrderQuantity());
                
                if (product.getMinOrderQuantity() > 0) {
                    double progress = Math.min(100.0, (totalQuantity.doubleValue() / product.getMinOrderQuantity()) * 100.0);
                    dto.setThresholdProgress(progress);
                } else {
                    dto.setThresholdProgress(100.0);
                }
            } catch (Exception e) {
                // If product not found or error, set defaults
                logger.warn("Error calculating threshold progress for interest {}: {}", interest.getId(), e.getMessage());
                dto.setTotalQuantity(interest.getQuantity());
                dto.setRequiredQuantity(0);
                dto.setThresholdProgress(0.0);
            }
        }
        
        // Check if this user's interest has remaining payment completed
        try {
            boolean hasRemainingPayment = paymentQueryService.hasRemainingPaymentCompleted(interest.getId());
            dto.setHasRemainingPaymentCompleted(hasRemainingPayment);
        } catch (Exception e) {
            logger.warn("Error checking remaining payment status for interest {}: {}", interest.getId(), e.getMessage());
            dto.setHasRemainingPaymentCompleted(false);
        }
        
        // Calculate collection progress (for THRESHOLD_MET, COLLECTING, or COMPLETE interests)
        if (interest.getStatus() == Interest.InterestStatus.THRESHOLD_MET || 
            interest.getStatus() == Interest.InterestStatus.COLLECTING ||
            interest.getStatus() == Interest.InterestStatus.COMPLETE) {
            try {
                // Find order group containing this interest
                List<OrderGroup> orderGroups = orderGroupRepository.findByProductIdWithInterests(interest.getProductId());
                OrderGroup orderGroup = null;
                for (OrderGroup og : orderGroups) {
                    if (og.getInterests().stream().anyMatch(i -> i.getId().equals(interest.getId()))) {
                        orderGroup = og;
                        break;
                    }
                }
                
                if (orderGroup != null && !orderGroup.getInterests().isEmpty()) {
                    int totalInterests = orderGroup.getInterests().size();
                    int paidInterests = 0;
                    
                    for (Interest i : orderGroup.getInterests()) {
                        // Check if interest has paid remaining balance
                        if (paymentQueryService.hasRemainingPaymentCompleted(i.getId())) {
                            paidInterests++;
                        }
                    }
                    
                    dto.setTotalInterestsInGroup(totalInterests);
                    dto.setPaidInterestsCount(paidInterests);
                    
                    if (totalInterests > 0) {
                        double collectionProgress = (paidInterests * 100.0) / totalInterests;
                        dto.setCollectionProgress(collectionProgress);
                    } else {
                        dto.setCollectionProgress(0.0);
                    }
                }
            } catch (Exception e) {
                // If error, set defaults
                logger.warn("Error calculating collection progress for interest {}: {}", interest.getId(), e.getMessage(), e);
            }
        }
        
        return dto;
    }
    
    private String getCurrentUserContact() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : null;
    }
    
    @Override
    @Transactional
    public InterestDTO createInterest(InterestRequest request) {
        String contact = getCurrentUserContact();
        if (contact == null) {
            throw new RuntimeException("User not authenticated");
        }
        
        org.bulkby.auth.model.User user = userRepository.findByEmailOrPhone(contact)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        org.bulkby.catalog.dto.ProductDTO product = resilientProductService.getProductById(request.getProductId());
        
        // Validate product exists and is active
        if (product == null) {
            throw new ValidationException("Product not found");
        }
        if (product.getActive() != null && !product.getActive()) {
            throw new ValidationException("Product is not available");
        }
        
        if (request.getQuantity() == null || request.getQuantity() < 1) {
            throw new ValidationException("Quantity must be at least 1");
        }
        
        // Validate quantity doesn't exceed reasonable limit (prevent DoS)
        if (request.getQuantity() > 100000) {
            throw new ValidationException("Quantity exceeds maximum allowed limit");
        }
        
        // Validate direct buy quantity requirement
        if (request.getDirectBuy() != null && request.getDirectBuy()) {
            if (product.getMinOrderQuantity() != null && request.getQuantity() < product.getMinOrderQuantity()) {
                throw new ValidationException("Direct buy requires at least " + product.getMinOrderQuantity() + " units (seller's minimum order quantity)");
            }
        }
        
        if (request.getPeriodDays() == null || request.getPeriodDays() < 1) {
            throw new ValidationException("Period days must be at least 1");
        }
        
        // Validate period days is one of allowed values
        if (request.getPeriodDays() != 7 && request.getPeriodDays() != 14 && request.getPeriodDays() != 30) {
            throw new ValidationException("Period days must be 7, 14, or 30");
        }
        
        Interest interest = new Interest();
        interest.setUserId(user.getId());
        interest.setProductId(request.getProductId());
        interest.setQuantity(request.getQuantity());
        interest.setPeriodDays(request.getPeriodDays());
        
        // Calculate dates
        LocalDateTime startDate = LocalDateTime.now();
        LocalDateTime endDate = startDate.plusDays(request.getPeriodDays());
        interest.setStartDate(startDate);
        interest.setEndDate(endDate);
        
        // Set logistics preference
        Interest.LogisticsPreference logisticsPreference;
        try {
            logisticsPreference = Interest.LogisticsPreference.valueOf(request.getLogisticsPreference().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid logistics preference: " + request.getLogisticsPreference());
        }
        interest.setLogisticsPreference(logisticsPreference);
        
        BigDecimal deliveryCost = BigDecimal.ZERO;
        if (logisticsPreference == Interest.LogisticsPreference.DELIVERY) {
            if (request.getDeliveryAddress() == null || request.getDeliveryAddress().trim().isEmpty()) {
                throw new ValidationException("Delivery address is required for DELIVERY option");
            }
            if (request.getPincode() == null || request.getPincode().trim().isEmpty()) {
                throw new ValidationException("Pincode is required for DELIVERY option");
            }
            
            // Validate and lookup pincode
            if (!pincodeService.isValidPincodeFormat(request.getPincode())) {
                throw new ValidationException("Pincode must be exactly 6 digits");
            }
            
            org.bulkby.common.dto.PincodeInfo pincodeInfo = pincodeService.lookupByPincode(request.getPincode());
            if (pincodeInfo == null) {
                throw new ValidationException("Pincode not found: " + request.getPincode());
            }
            
            if (!pincodeInfo.getServiceable()) {
                throw new ValidationException("We don't deliver to pincode " + request.getPincode() + ". Please select a different location.");
            }
            
            // Set pincode and location info
            interest.setPincode(request.getPincode());
            interest.setCityId(pincodeInfo.getCityId());
            interest.setStateId(pincodeInfo.getStateId());
            interest.setDeliveryAddress(request.getDeliveryAddress());
            
            // Calculate delivery cost using logistics service
            LogisticsCostRequest logisticsRequest = new LogisticsCostRequest();
            logisticsRequest.setProductId(request.getProductId());
            logisticsRequest.setQuantity(request.getQuantity());
            LogisticsCostResponse logisticsResponse = resilientLogisticsService.calculateDeliveryCost(logisticsRequest);
            deliveryCost = logisticsResponse.getDeliveryCost();
        } else if (logisticsPreference == Interest.LogisticsPreference.PICKUP) {
            if (request.getWarehouseId() == null) {
                throw new ValidationException("Warehouse ID is required for PICKUP option");
            }
            
            // Fetch warehouse to get location info
            try {
                org.bulkby.logistics.dto.WarehouseDTO warehouse = warehouseService.getWarehouseById(request.getWarehouseId());
                if (warehouse == null || !warehouse.getActive()) {
                    throw new ValidationException("Warehouse not found or inactive");
                }
                
                // Set warehouse ID
                interest.setWarehouseId(request.getWarehouseId());
                
                // Set cityId and stateId from warehouse address for location-based grouping
                if (warehouse.getCityId() != null) {
                    interest.setCityId(warehouse.getCityId());
                } else {
                    logger.warn("Warehouse {} does not have cityId set. Interest {} may not be grouped correctly.", 
                        request.getWarehouseId(), interest.getId());
                }
                
                if (warehouse.getStateId() != null) {
                    interest.setStateId(warehouse.getStateId());
                }
            } catch (Exception e) {
                throw new ValidationException("Error fetching warehouse: " + e.getMessage());
            }
        }
        interest.setDeliveryCost(deliveryCost);
        
        // Calculate deposit (10% of product cost)
        BigDecimal totalProductCost = product.getPrice().multiply(BigDecimal.valueOf(request.getQuantity()));
        BigDecimal deposit = totalProductCost.multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP);
        interest.setDepositPaid(deposit);
        
        // Set status based on user's choice (directBuy flag)
        if (request.getDirectBuy() != null && request.getDirectBuy()) {
            if (request.getQuantity() < product.getMinOrderQuantity()) {
                throw new RuntimeException("Direct buy requires quantity to be at least " + product.getMinOrderQuantity() + " units");
            }
            interest.setStatus(Interest.InterestStatus.DIRECT_ORDER_READY);
            notificationService.notifyDirectOrderReady(user.getId(), interest.getId(), product.getName());
        } else {
            interest.setStatus(Interest.InterestStatus.PENDING);
        }
        
        interest = interestRepository.save(interest);
        
        // Record transaction: Interest created
        String calculation = String.format("Deposit = quantity × unitPrice × 0.10 = %d × %s × 0.10 = %s",
            interest.getQuantity(), product.getPrice(), interest.getDepositPaid());
        transactionHistoryService.recordTransaction(
            interest.getId(),
            null, // OrderGroup not yet created
            InterestTransaction.TransactionType.CREATED,
            null,
            String.format("quantity=%d, deposit=%s, status=%s", 
                interest.getQuantity(), interest.getDepositPaid(), interest.getStatus()),
            interest.getDepositPaid(),
            calculation,
            null, // No payment yet
            user.getId(),
            null, // User-initiated
            String.format("Interest created for product %s, quantity %d", product.getName(), interest.getQuantity())
        );
        
        // Publish domain event
        eventPublisher.publish(new InterestCreatedEvent(
            interest.getId(),
            interest.getUserId(),
            interest.getProductId(),
            interest.getQuantity(),
            interest.getDepositPaid(),
            interest.getStatus().name()
        ));
        
        // Check if threshold is met for this product (if not direct buy)
        if (interest.getStatus() == Interest.InterestStatus.PENDING) {
            try {
                orderGroupService.checkThresholdForProduct(product.getId());
            } catch (Exception e) {
                logger.error("Error checking threshold for product {} after interest creation: {}", 
                    product.getId(), e.getMessage(), e);
            }
        }
        
        logger.info("Interest created successfully: id={}, userId={}, productId={}, quantity={}, status={}", 
            interest.getId(), interest.getUserId(), interest.getProductId(), interest.getQuantity(), interest.getStatus());
        
        return convertToDTO(interest);
    }
    
    @Override
    public List<InterestDTO> getUserInterests() {
        String contact = getCurrentUserContact();
        if (contact == null) {
            throw new RuntimeException("User not authenticated");
        }
        
        org.bulkby.auth.model.User user = userRepository.findByEmailOrPhone(contact)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return interestRepository.findByUserId(user.getId())
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public InterestDTO getInterestById(Long id) {
        Interest interest = interestRepository.findById(id)
                .orElseThrow(() -> new InterestNotFoundException(id));
        
        // Check if user owns this interest
        String contact = getCurrentUserContact();
        if (contact != null) {
            org.bulkby.auth.model.User user = userRepository.findByEmailOrPhone(contact).orElse(null);
            if (user != null && !interest.getUserId().equals(user.getId())) {
                throw new RuntimeException("Access denied");
            }
        }
        
        return convertToDTO(interest);
    }
    
    @Override
    @Transactional
    public InterestDTO extendInterest(Long id, Integer newPeriodDays) {
        String contact = getCurrentUserContact();
        if (contact == null) {
            throw new RuntimeException("User not authenticated");
        }
        
        org.bulkby.auth.model.User user = userRepository.findByEmailOrPhone(contact)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Interest interest = interestRepository.findById(id)
                .orElseThrow(() -> new InterestNotFoundException(id));
        
        if (!interest.getUserId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }
        
        if (newPeriodDays == null || newPeriodDays < 1) {
            throw new ValidationException("Period days must be at least 1");
        }
        
        // Use state machine to validate and perform transition
        stateMachine.transition(interest, Interest.InterestStatus.PENDING);
        
        LocalDateTime now = LocalDateTime.now();
        Integer oldPeriodDays = interest.getPeriodDays();
        LocalDateTime oldEndDate = interest.getEndDate();
        
        interest.setStartDate(now);
        interest.setEndDate(now.plusDays(newPeriodDays));
        interest.setPeriodDays(newPeriodDays);
        interest.setExtensionReminderSentAt(null);
        
        interest = interestRepository.save(interest);
        
        // Record transaction: Interest extended
        String oldValue = String.format("periodDays=%d, endDate=%s", oldPeriodDays, oldEndDate);
        String newValue = String.format("periodDays=%d, endDate=%s", newPeriodDays, interest.getEndDate());
        transactionHistoryService.recordTransaction(
            interest.getId(),
            null, // OrderGroup may not exist yet
            InterestTransaction.TransactionType.EXTENDED,
            oldValue,
            newValue,
            null, // No amount change
            String.format("Extended from %d days to %d days", oldPeriodDays, newPeriodDays),
            null,
            user.getId(),
            null,
            String.format("Interest period extended from %d to %d days", oldPeriodDays, newPeriodDays)
        );
        
        return convertToDTO(interest);
    }
    
    @Override
    @Transactional
    public InterestDTO withdrawInterest(Long id) {
        String contact = getCurrentUserContact();
        if (contact == null) {
            throw new RuntimeException("User not authenticated");
        }
        
        org.bulkby.auth.model.User user = userRepository.findByEmailOrPhone(contact)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Interest interest = interestRepository.findById(id)
                .orElseThrow(() -> new InterestNotFoundException(id));
        
        if (!interest.getUserId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }
        
        // Check if refund already processed
        if (interest.getRefundProcessedAt() != null) {
            logger.warn("Refund already processed for interest {}", id);
            throw new RuntimeException("Refund already processed for this interest");
        }
        
        // Use state machine to validate and perform transition
        stateMachine.transition(interest, Interest.InterestStatus.WITHDRAWN);
        
        // Process refund in separate transaction to ensure atomicity
        BigDecimal refundAmount = interest.getDepositPaid() != null ? interest.getDepositPaid() : BigDecimal.ZERO;
        try {
            paymentService.processRefund(id);
            interest.setRefundProcessedAt(LocalDateTime.now());
            interest = interestRepository.save(interest);
            
            // Record transaction: Interest withdrawn with refund
            String calculation = String.format("Refund = depositPaid = %s", refundAmount);
            transactionHistoryService.recordTransaction(
                interest.getId(),
                null, // OrderGroup may not exist
                InterestTransaction.TransactionType.WITHDRAWN,
                String.format("status=%s, depositPaid=%s", Interest.InterestStatus.PENDING, refundAmount),
                String.format("status=%s, refundProcessedAt=%s", Interest.InterestStatus.WITHDRAWN, interest.getRefundProcessedAt()),
                refundAmount,
                calculation,
                null, // Payment service handles the refund payment
                user.getId(),
                null,
                String.format("Interest withdrawn, refund of %s processed", refundAmount)
            );
            
            logger.info("Interest withdrawn successfully: id={}, refundProcessedAt={}", id, interest.getRefundProcessedAt());
        } catch (Exception e) {
            logger.error("Error processing refund for interest {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Failed to process refund: " + e.getMessage(), e);
        }
        
        return convertToDTO(interest);
    }
    
    @Override
    public InterestDTO getInterestByIdForPayment(Long id) {
        return getInterestById(id);
    }
    
    @Override
    @Transactional
    public UpdateInterestResponse updateInterest(Long id, UpdateInterestRequest request) {
        String contact = getCurrentUserContact();
        if (contact == null) {
            throw new RuntimeException("User not authenticated");
        }
        
        org.bulkby.auth.model.User user = userRepository.findByEmailOrPhone(contact)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Interest interest = interestRepository.findById(id)
                .orElseThrow(() -> new InterestNotFoundException(id));
        
        if (!interest.getUserId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }
        
        // Only allow updates for certain statuses
        if (interest.getStatus() != Interest.InterestStatus.PENDING && 
            interest.getStatus() != Interest.InterestStatus.EXPIRING &&
            interest.getStatus() != Interest.InterestStatus.EXPIRED) {
            throw new InvalidInterestStatusException(interest.getStatus(), "update");
        }
        
        // Validate that interest is not in an order group
        final Long interestId = interest.getId();
        List<OrderGroup> validationGroups = orderGroupRepository.findByProductIdWithInterests(interest.getProductId());
        for (OrderGroup og : validationGroups) {
            if (og.getInterests().stream().anyMatch(i -> i.getId().equals(interestId))) {
                throw new InvalidInterestStatusException(interest.getStatus(), "update (interest is in an order group)");
            }
        }
        
        // Store old values for deposit calculation and transaction recording
        Integer oldQuantity = interest.getQuantity();
        BigDecimal oldDepositPaid = interest.getDepositPaid() != null ? interest.getDepositPaid() : BigDecimal.ZERO;
        Interest.InterestStatus oldStatus = interest.getStatus();
        String oldDeliveryAddress = interest.getDeliveryAddress();
        Long oldWarehouseId = interest.getWarehouseId();
        BigDecimal oldDeliveryCost = interest.getDeliveryCost() != null ? interest.getDeliveryCost() : BigDecimal.ZERO;
        
        BigDecimal additionalDepositRequired = BigDecimal.ZERO;
        BigDecimal refundAmount = BigDecimal.ZERO;
        boolean requiresPayment = false;
        boolean requiresRefund = false;
        
        // Get OrderGroup if exists (for transaction recording)
        Long orderGroupId = null;
        List<OrderGroup> orderGroupCheck = orderGroupRepository.findByProductIdWithInterests(interest.getProductId());
        for (OrderGroup og : orderGroupCheck) {
            if (og.getInterests().stream().anyMatch(i -> i.getId().equals(interest.getId()))) {
                orderGroupId = og.getId();
                break;
            }
        }
        
        // Update quantity if provided
        if (request.getQuantity() != null && !request.getQuantity().equals(oldQuantity)) {
            // Validate quantity
            if (request.getQuantity() < 1) {
                throw new ValidationException("Quantity must be at least 1");
            }
            // Get product to calculate new deposit
            org.bulkby.catalog.dto.ProductDTO product = resilientProductService.getProductById(interest.getProductId());
            
            // Calculate old and new deposit amounts (10% of product cost)
            BigDecimal newTotalCost = product.getPrice().multiply(BigDecimal.valueOf(request.getQuantity()));
            BigDecimal newDeposit = newTotalCost.multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP);
            
            // Calculate difference between new deposit and what was actually paid
            BigDecimal depositDifference = newDeposit.subtract(oldDepositPaid);
            
            if (depositDifference.compareTo(BigDecimal.ZERO) > 0) {
                // Quantity increased - additional deposit required
                additionalDepositRequired = depositDifference;
                requiresPayment = true;
            } else if (depositDifference.compareTo(BigDecimal.ZERO) < 0) {
                // Quantity decreased - refund required
                refundAmount = depositDifference.abs();
                requiresRefund = true;
                
                // Process refund in separate transaction to ensure atomicity
                try {
                    paymentService.processPartialRefund(id, refundAmount);
                    logger.info("Partial refund processed for interest {}: amount={}", id, refundAmount);
                } catch (Exception e) {
                    logger.error("Error processing partial refund for interest {}: {}", id, e.getMessage(), e);
                    throw new RuntimeException("Failed to process refund: " + e.getMessage(), e);
                }
            }
            
            interest.setQuantity(request.getQuantity());
            // Update deposit_paid to new deposit amount
            interest.setDepositPaid(newDeposit);
            
            // Record transaction: Quantity changed
            String calculation;
            if (requiresPayment) {
                calculation = String.format("New Deposit = %d × %s × 0.10 = %s, Additional Required = %s - %s = %s",
                    request.getQuantity(), product.getPrice(), newDeposit, newDeposit, oldDepositPaid, additionalDepositRequired);
            } else if (requiresRefund) {
                calculation = String.format("Old Deposit = %d × %s × 0.10 = %s, New Deposit = %d × %s × 0.10 = %s, Refund = %s - %s = %s",
                    oldQuantity, product.getPrice(), oldDepositPaid, request.getQuantity(), product.getPrice(), newDeposit, oldDepositPaid, newDeposit, refundAmount);
            } else {
                calculation = String.format("Quantity unchanged: %d", oldQuantity);
            }
            
            transactionHistoryService.recordTransaction(
                interest.getId(),
                orderGroupId,
                InterestTransaction.TransactionType.QUANTITY_CHANGED,
                String.format("quantity=%d, depositPaid=%s", oldQuantity, oldDepositPaid),
                String.format("quantity=%d, depositPaid=%s", request.getQuantity(), newDeposit),
                requiresRefund ? refundAmount.negate() : (requiresPayment ? additionalDepositRequired : null),
                calculation,
                null,
                user.getId(),
                null,
                String.format("Quantity changed from %d to %d units", oldQuantity, request.getQuantity())
            );
        }
        
        // Update period days if provided
        if (request.getPeriodDays() != null) {
            if (request.getPeriodDays() < 1) {
                throw new ValidationException("Period days must be at least 1");
            }
            interest.setPeriodDays(request.getPeriodDays());
            // Recalculate end date - ensure endDate is after startDate
            LocalDateTime newEndDate = interest.getStartDate().plusDays(request.getPeriodDays());
            if (newEndDate.isBefore(interest.getStartDate())) {
                throw new ValidationException("End date must be after start date");
            }
            interest.setEndDate(newEndDate);
        }
        
        // Update logistics preference if provided
        if (request.getLogisticsPreference() != null) {
            interest.setLogisticsPreference(Interest.LogisticsPreference.valueOf(request.getLogisticsPreference()));
            
            // Update delivery address or warehouse based on preference
            if (request.getLogisticsPreference().equals("DELIVERY")) {
                if (request.getDeliveryAddress() != null) {
                    interest.setDeliveryAddress(request.getDeliveryAddress());
                }
                interest.setWarehouseId(null);
                
                // Recalculate delivery cost
                try {
                    LogisticsCostRequest logisticsRequest = new LogisticsCostRequest();
                    logisticsRequest.setProductId(interest.getProductId());
                    logisticsRequest.setQuantity(interest.getQuantity());
                    logisticsRequest.setDeliveryAddress(request.getDeliveryAddress() != null ? 
                        request.getDeliveryAddress() : interest.getDeliveryAddress());
                    
                    LogisticsCostResponse logisticsResponse = resilientLogisticsService.calculateDeliveryCost(logisticsRequest);
                    interest.setDeliveryCost(logisticsResponse.getDeliveryCost());
                } catch (Exception e) {
                    // If logistics calculation fails, keep existing cost or set to zero
                    logger.warn("Failed to recalculate delivery cost for interest {}: {}", id, e.getMessage(), e);
                }
            } else if (request.getLogisticsPreference().equals("PICKUP")) {
                if (request.getWarehouseId() != null) {
                    interest.setWarehouseId(request.getWarehouseId());
                }
                interest.setDeliveryAddress(null);
                interest.setDeliveryCost(BigDecimal.ZERO);
            }
        } else {
            // If logistics preference not changed but address/warehouse updated
            if (request.getDeliveryAddress() != null && 
                interest.getLogisticsPreference() == Interest.LogisticsPreference.DELIVERY) {
                interest.setDeliveryAddress(request.getDeliveryAddress());
                
                // Recalculate delivery cost
                try {
                    LogisticsCostRequest logisticsRequest = new LogisticsCostRequest();
                    logisticsRequest.setProductId(interest.getProductId());
                    logisticsRequest.setQuantity(interest.getQuantity());
                    logisticsRequest.setDeliveryAddress(request.getDeliveryAddress());
                    
                    LogisticsCostResponse logisticsResponse = resilientLogisticsService.calculateDeliveryCost(logisticsRequest);
                    interest.setDeliveryCost(logisticsResponse.getDeliveryCost());
                } catch (Exception e) {
                    logger.warn("Failed to recalculate delivery cost for interest {}: {}", id, e.getMessage(), e);
                }
            }
            
            if (request.getWarehouseId() != null && 
                interest.getLogisticsPreference() == Interest.LogisticsPreference.PICKUP) {
                interest.setWarehouseId(request.getWarehouseId());
            }
        }
        
        Interest savedInterest = interestRepository.save(interest);
        
        // Record transaction: Status changed (if status changed)
        if (savedInterest.getStatus() != oldStatus) {
            transactionHistoryService.recordTransaction(
                savedInterest.getId(),
                orderGroupId,
                InterestTransaction.TransactionType.STATUS_CHANGED,
                oldStatus.name(),
                savedInterest.getStatus().name(),
                null,
                String.format("Status transition: %s → %s", oldStatus, savedInterest.getStatus()),
                null,
                user.getId(),
                null,
                String.format("Status changed from %s to %s", oldStatus, savedInterest.getStatus())
            );
        }
        
        // Record transaction: Logistics changed (if changed)
        if (request.getLogisticsPreference() != null) {
            boolean logisticsChanged = false;
            String logisticsOldValue = null;
            String logisticsNewValue = null;
            
            if (request.getLogisticsPreference().equals("DELIVERY") && 
                (oldDeliveryAddress == null || !oldDeliveryAddress.equals(savedInterest.getDeliveryAddress()))) {
                logisticsChanged = true;
                logisticsOldValue = String.format("DELIVERY, address=%s, cost=%s", oldDeliveryAddress, oldDeliveryCost);
                logisticsNewValue = String.format("DELIVERY, address=%s, cost=%s", savedInterest.getDeliveryAddress(), savedInterest.getDeliveryCost());
            } else if (request.getLogisticsPreference().equals("PICKUP") && 
                       (oldWarehouseId == null || !oldWarehouseId.equals(savedInterest.getWarehouseId()))) {
                logisticsChanged = true;
                logisticsOldValue = String.format("PICKUP, warehouseId=%s", oldWarehouseId);
                logisticsNewValue = String.format("PICKUP, warehouseId=%s", savedInterest.getWarehouseId());
            }
            
            if (logisticsChanged) {
                transactionHistoryService.recordTransaction(
                    savedInterest.getId(),
                    orderGroupId,
                    InterestTransaction.TransactionType.LOGISTICS_CHANGED,
                    logisticsOldValue,
                    logisticsNewValue,
                    savedInterest.getDeliveryCost() != null && !savedInterest.getDeliveryCost().equals(oldDeliveryCost) 
                        ? savedInterest.getDeliveryCost().subtract(oldDeliveryCost) : null,
                    String.format("Logistics preference: %s, Delivery cost: %s", 
                        savedInterest.getLogisticsPreference(), savedInterest.getDeliveryCost()),
                    null,
                    user.getId(),
                    null,
                    "Logistics preference or details changed"
                );
            }
        }
        
        // Publish domain event
        eventPublisher.publish(new InterestUpdatedEvent(
            savedInterest.getId(),
            savedInterest.getProductId(),
            oldQuantity,
            savedInterest.getQuantity(),
            savedInterest.getStatus().name()
        ));
        
        // Check if threshold is met for this product after update (if status is still PENDING)
        if (savedInterest.getStatus() == Interest.InterestStatus.PENDING) {
            try {
                orderGroupService.checkThresholdForProduct(savedInterest.getProductId());
            } catch (Exception e) {
                // Log but don't fail the interest update
                logger.error("Error checking threshold for product {} after interest update: {}", 
                    savedInterest.getProductId(), e.getMessage(), e);
            }
        }
        
        logger.info("Interest updated successfully: id={}, quantity={}, status={}", 
            id, savedInterest.getQuantity(), savedInterest.getStatus());
        
        // Build response
        UpdateInterestResponse response = new UpdateInterestResponse();
        response.setInterest(convertToDTO(savedInterest));
        response.setAdditionalDepositRequired(additionalDepositRequired);
        response.setRefundAmount(refundAmount);
        response.setRequiresPayment(requiresPayment);
        response.setRequiresRefund(requiresRefund);
        
        if (requiresPayment) {
            response.setMessage("Quantity increased. Additional deposit of " + formatCurrency(additionalDepositRequired) + " is required.");
        } else if (requiresRefund) {
            response.setMessage("Quantity decreased. Refund of " + formatCurrency(refundAmount) + " has been processed.");
        } else {
            response.setMessage("Interest updated successfully.");
        }
        
        return response;
    }
    
    private String formatCurrency(BigDecimal amount) {
        return "₹" + amount.setScale(2, RoundingMode.HALF_UP).toString();
    }
}
