package org.bulkby.order.service.impl;

import org.bulkby.catalog.dto.ProductDTO;
import org.bulkby.logistics.service.WarehouseService;
import org.bulkby.notification.service.NotificationService;
import org.bulkby.order.dto.PlaceOrderRequest;
import org.bulkby.order.dto.SellerFulfillmentRequest;
import org.bulkby.order.dto.SellerOrderDTO;
import org.bulkby.order.dto.UpdateTrackingRequest;
import org.bulkby.order.event.DomainEventPublisher;
import org.bulkby.order.event.OrderCreatedEvent;
import org.bulkby.order.exception.ValidationException;
import org.bulkby.order.model.Interest;
import org.bulkby.order.model.Order;
import org.bulkby.order.model.OrderGroup;
import org.bulkby.order.model.OrderTracking;
import org.bulkby.order.model.SellerOrder;
import org.bulkby.order.repository.OrderGroupRepository;
import org.bulkby.order.repository.OrderRepository;
import org.bulkby.order.repository.OrderTrackingRepository;
import org.bulkby.order.repository.SellerOrderRepository;
import org.bulkby.order.service.ResilientProductService;
import org.bulkby.order.service.SellerOrderService;
import org.bulkby.order.statemachine.OrderStateMachine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import static org.bulkby.order.model.SellerOrder.SellerOrderStatus.*;

@Service
public class SellerOrderServiceImpl implements SellerOrderService {

    private static final Logger logger = LoggerFactory.getLogger(SellerOrderServiceImpl.class);

    @Autowired
    private SellerOrderRepository sellerOrderRepository;
    @Autowired
    private OrderGroupRepository orderGroupRepository;
    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private OrderTrackingRepository orderTrackingRepository;
    @Autowired
    private ResilientProductService resilientProductService;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private WarehouseService warehouseService;
    @Autowired
    private OrderStateMachine orderStateMachine;
    @Autowired
    private DomainEventPublisher eventPublisher;

    @Override
    @Transactional
    public SellerOrderDTO placeOrderWithSeller(Long orderGroupId, PlaceOrderRequest request) {
        OrderGroup orderGroup = orderGroupRepository.findById(orderGroupId)
                .orElseThrow(() -> new RuntimeException("Order group not found"));

        if (orderGroup.getStatus() != OrderGroup.OrderGroupStatus.COMPLETE) {
            throw new RuntimeException("Order group must be COMPLETE before placing order with seller");
        }

        if (sellerOrderRepository.findByOrderGroupId(orderGroupId).isPresent()) {
            throw new RuntimeException("Order already placed for this order group");
        }

        SellerOrder sellerOrder = new SellerOrder();
        sellerOrder.setOrderGroupId(orderGroupId);
        sellerOrder.setSellerOrderNumber(request.getSellerOrderNumber());
        sellerOrder.setSellerTransactionId(request.getSellerTransactionId());
        sellerOrder.setOrderAmount(request.getOrderAmount());
        sellerOrder.setStatus(SellerOrder.SellerOrderStatus.PLACED);
        sellerOrder.setNotes(request.getNotes());
        sellerOrder.setDeliveryWarehouseId(request.getDeliveryWarehouseId());

        sellerOrder = sellerOrderRepository.save(sellerOrder);

        OrderGroup orderGroupWithInterests = orderGroupRepository.findByIdWithInterests(orderGroupId).orElse(orderGroup);

        LocalDateTime now = LocalDateTime.now();
        for (Interest interest : orderGroupWithInterests.getInterests()) {
            String orderNumber = "ORD-" + System.currentTimeMillis() + "-" + interest.getId();

            Order order = new Order();
            order.setInterestId(interest.getId());
            order.setOrderGroupId(orderGroupId);
            order.setSellerOrderId(sellerOrder.getId());
            order.setOrderNumber(orderNumber);
            order.setStatus(Order.OrderStatus.PENDING);
            order.setCreatedAt(now);
            order = orderRepository.save(order);

            logger.info("Order created for Interest {}: orderId={}, orderNumber={}",
                    interest.getId(), order.getId(), orderNumber);

            eventPublisher.publish(new OrderCreatedEvent(
                    order.getId(),
                    interest.getId(),
                    orderGroupId,
                    sellerOrder.getId(),
                    orderNumber,
                    interest.getUserId(),
                    interest.getProductId()
            ));

            OrderTracking tracking = new OrderTracking();
            tracking.setInterestId(interest.getId());
            tracking.setOrderId(order.getId());
            tracking.setSellerOrderId(sellerOrder.getId());
            tracking.setStatus(OrderTracking.TrackingStatus.ORDER_PLACED);
            tracking.setStatusDate(now);
            tracking.setLocation("Order placed with seller");
            tracking.setNotes("Order #" + request.getSellerOrderNumber() + " placed, Order Number: " + orderNumber);
            orderTrackingRepository.save(tracking);
        }

        String warehouseName = "warehouse";
        if (request.getDeliveryWarehouseId() != null) {
            try {
                org.bulkby.logistics.dto.WarehouseDTO warehouse = warehouseService.getWarehouseById(request.getDeliveryWarehouseId());
                warehouseName = warehouse.getName();
            } catch (Exception e) {
                // Use default
            }
        }

        ProductDTO product = resilientProductService.getProductById(orderGroup.getProductId());
        List<Long> userIds = orderGroupWithInterests.getInterests().stream()
                .map(Interest::getUserId)
                .collect(Collectors.toList());

        notificationService.notifyOrderPlacedWithSeller(orderGroupId, product.getName(),
                request.getSellerOrderNumber(), warehouseName, userIds);

        return convertSellerOrderToDTO(sellerOrder);
    }

    @Override
    @Transactional
    public SellerOrderDTO updateSellerOrderFulfillment(Long sellerOrderId, Long sellerId, SellerFulfillmentRequest request) {
        SellerOrder sellerOrder = sellerOrderRepository.findById(sellerOrderId)
                .orElseThrow(() -> new RuntimeException("Seller order not found"));

        OrderGroup orderGroup = orderGroupRepository.findById(sellerOrder.getOrderGroupId())
                .orElseThrow(() -> new RuntimeException("Order group not found"));
        ProductDTO product = resilientProductService.getProductById(orderGroup.getProductId());
        if (product == null || !sellerId.equals(product.getSellerId())) {
            throw new ValidationException("Seller order not found or access denied");
        }

        if (request.getStatus() == null || request.getStatus().isBlank()) {
            throw new ValidationException("Status is required");
        }
        SellerOrder.SellerOrderStatus newStatus;
        try {
            newStatus = SellerOrder.SellerOrderStatus.valueOf(request.getStatus().trim());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid status: must be CONFIRMED or SHIPPED");
        }

        if (newStatus != SellerOrder.SellerOrderStatus.CONFIRMED && newStatus != SellerOrder.SellerOrderStatus.SHIPPED) {
            throw new ValidationException("Seller can only set status to CONFIRMED or SHIPPED");
        }

        SellerOrder.SellerOrderStatus current = sellerOrder.getStatus();
        if (newStatus == SellerOrder.SellerOrderStatus.CONFIRMED) {
            if (current != SellerOrder.SellerOrderStatus.PLACED) {
                throw new ValidationException("Only PLACED orders can be confirmed");
            }
            sellerOrder.setStatus(SellerOrder.SellerOrderStatus.CONFIRMED);
            if (request.getNotes() != null) {
                sellerOrder.setNotes(request.getNotes());
            }
            orderGroup = orderGroupRepository.findByIdWithInterests(sellerOrder.getOrderGroupId()).orElse(orderGroup);
            for (Interest interest : orderGroup.getInterests()) {
                orderRepository.findByInterestId(interest.getId()).ifPresent(order -> {
                    try {
                        orderStateMachine.transition(order, Order.OrderStatus.CONFIRMED);
                        orderRepository.save(order);
                    } catch (Exception e) {
                        logger.warn("Failed to update order {} to CONFIRMED: {}", order.getId(), e.getMessage());
                    }
                });
            }
        } else {
            if (current != SellerOrder.SellerOrderStatus.PLACED && current != SellerOrder.SellerOrderStatus.CONFIRMED) {
                throw new ValidationException("Only PLACED or CONFIRMED orders can be marked as shipped");
            }
            if (request.getTrackingId() == null || request.getTrackingId().isBlank()) {
                throw new ValidationException("Tracking ID is required when marking as shipped");
            }
            sellerOrder.setStatus(SellerOrder.SellerOrderStatus.SHIPPED);
            sellerOrder.setTrackingId(request.getTrackingId());
            LocalDateTime now = LocalDateTime.now();
            sellerOrder.setShippedAt(request.getShippedAt() != null ? request.getShippedAt() : now);
            if (request.getEstimatedArrival() != null) {
                sellerOrder.setEstimatedArrival(request.getEstimatedArrival());
            }
            if (request.getNotes() != null) {
                sellerOrder.setNotes(request.getNotes());
            }
            sellerOrderRepository.save(sellerOrder);
            sellerOrderRepository.flush();

            orderGroup = orderGroupRepository.findByIdWithInterests(sellerOrder.getOrderGroupId()).orElse(orderGroup);
            for (Interest interest : orderGroup.getInterests()) {
                Order order = orderRepository.findByInterestId(interest.getId()).orElse(null);
                OrderTracking tracking = new OrderTracking();
                tracking.setInterestId(interest.getId());
                if (order != null) {
                    tracking.setOrderId(order.getId());
                }
                tracking.setSellerOrderId(sellerOrder.getId());
                tracking.setStatus(OrderTracking.TrackingStatus.ORDER_SHIPPED);
                tracking.setStatusDate(LocalDateTime.now());
                tracking.setLocation("Shipped by seller");
                tracking.setCarrierTrackingNumber(sellerOrder.getTrackingId());
                tracking.setNotes("Tracking ID: " + sellerOrder.getTrackingId());
                tracking.setLastUpdateSource("SELLER");
                orderTrackingRepository.save(tracking);
                if (order != null) {
                    try {
                        orderStateMachine.transition(order, Order.OrderStatus.SHIPPED);
                        orderRepository.save(order);
                    } catch (Exception e) {
                        logger.warn("Failed to update order {} to SHIPPED: {}", order.getId(), e.getMessage());
                    }
                }
            }
            orderTrackingRepository.flush();
        }

        sellerOrder = sellerOrderRepository.save(sellerOrder);
        return convertSellerOrderToDTO(sellerOrder);
    }

    @Override
    @Transactional
    public SellerOrderDTO updateSellerOrderTracking(Long sellerOrderId, UpdateTrackingRequest request) {
        SellerOrder sellerOrder = sellerOrderRepository.findById(sellerOrderId)
                .orElseThrow(() -> new RuntimeException("Seller order not found"));

        if (request.getTrackingId() != null) {
            sellerOrder.setTrackingId(request.getTrackingId());
        }

        if (request.getStatus() != null) {
            SellerOrder.SellerOrderStatus newStatus = SellerOrder.SellerOrderStatus.valueOf(request.getStatus());
            sellerOrder.setStatus(newStatus);

            OrderGroup orderGroup = orderGroupRepository.findByIdWithInterests(sellerOrder.getOrderGroupId())
                    .orElseThrow(() -> new RuntimeException("Order group not found"));

            OrderTracking.TrackingStatus trackingStatus = null;
            String location = null;

            switch (newStatus) {
                case PLACED:
                case CONFIRMED:
                    break;
                case SHIPPED:
                    trackingStatus = OrderTracking.TrackingStatus.ORDER_SHIPPED;
                    location = "Shipped by seller";
                    if (request.getShippedAt() != null) {
                        sellerOrder.setShippedAt(request.getShippedAt());
                    } else {
                        sellerOrder.setShippedAt(LocalDateTime.now());
                    }
                    break;
                case IN_TRANSIT:
                    trackingStatus = OrderTracking.TrackingStatus.ORDER_SHIPPED;
                    location = "In transit";
                    break;
                case ARRIVED:
                    trackingStatus = OrderTracking.TrackingStatus.ARRIVED_AT_WAREHOUSE;
                    if (sellerOrder.getDeliveryWarehouseId() != null) {
                        try {
                            org.bulkby.logistics.dto.WarehouseDTO warehouse = warehouseService.getWarehouseById(sellerOrder.getDeliveryWarehouseId());
                            location = warehouse.getName();
                        } catch (Exception e) {
                            location = "Warehouse";
                        }
                    } else {
                        location = "Warehouse";
                    }
                    if (request.getArrivedAt() != null) {
                        sellerOrder.setArrivedAt(request.getArrivedAt());
                    } else {
                        sellerOrder.setArrivedAt(LocalDateTime.now());
                    }
                    ProductDTO product = resilientProductService.getProductById(orderGroup.getProductId());
                    List<Long> pickupUserIds = new ArrayList<>();
                    List<Long> deliveryUserIds = new ArrayList<>();
                    for (Interest interest : orderGroup.getInterests()) {
                        if (interest.getLogisticsPreference() == Interest.LogisticsPreference.PICKUP) {
                            pickupUserIds.add(interest.getUserId());
                        } else {
                            deliveryUserIds.add(interest.getUserId());
                        }
                    }
                    String warehouseName = location;
                    String warehouseAddress = "";
                    if (sellerOrder.getDeliveryWarehouseId() != null) {
                        try {
                            org.bulkby.logistics.dto.WarehouseDTO warehouse = warehouseService.getWarehouseById(sellerOrder.getDeliveryWarehouseId());
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
                            warehouseAddress = addr.toString();
                        } catch (Exception e) {
                            // Use defaults
                        }
                    }
                    notificationService.notifyOrderArrivedAtWarehouse(orderGroup.getId(), product.getName(),
                            warehouseName, warehouseAddress, pickupUserIds, deliveryUserIds);
                    break;
                case DISTRIBUTING:
                case COMPLETED:
                    break;
            }

            if (trackingStatus != null) {
                for (Interest interest : orderGroup.getInterests()) {
                    OrderTracking tracking = new OrderTracking();
                    tracking.setInterestId(interest.getId());
                    tracking.setStatus(trackingStatus);
                    tracking.setStatusDate(LocalDateTime.now());
                    tracking.setLocation(location);
                    if (request.getTrackingId() != null) {
                        tracking.setNotes("Tracking ID: " + request.getTrackingId() +
                                (request.getNotes() != null ? " - " + request.getNotes() : ""));
                    } else {
                        tracking.setNotes(request.getNotes());
                    }
                    orderTrackingRepository.save(tracking);
                }
            }
        }

        if (request.getEstimatedArrival() != null) {
            sellerOrder.setEstimatedArrival(request.getEstimatedArrival());
        }

        if (request.getNotes() != null && request.getStatus() == null) {
            sellerOrder.setNotes(request.getNotes());
        }

        sellerOrder = sellerOrderRepository.save(sellerOrder);
        return convertSellerOrderToDTO(sellerOrder);
    }

    @Override
    @Transactional
    public void markOrderArrived(Long sellerOrderId) {
        SellerOrder sellerOrder = sellerOrderRepository.findById(sellerOrderId)
                .orElseThrow(() -> new RuntimeException("Seller order not found"));

        sellerOrder.setStatus(SellerOrder.SellerOrderStatus.ARRIVED);
        sellerOrder.setArrivedAt(LocalDateTime.now());
        sellerOrderRepository.save(sellerOrder);

        OrderGroup orderGroup = orderGroupRepository.findByIdWithInterests(sellerOrder.getOrderGroupId())
                .orElseThrow(() -> new RuntimeException("Order group not found"));

        String warehouseName = "Warehouse";
        String warehouseAddress = "";
        if (sellerOrder.getDeliveryWarehouseId() != null) {
            try {
                org.bulkby.logistics.dto.WarehouseDTO warehouse = warehouseService.getWarehouseById(sellerOrder.getDeliveryWarehouseId());
                warehouseName = warehouse.getName();
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
                warehouseAddress = addr.toString();
            } catch (Exception e) {
                // Use defaults
            }
        }

        ProductDTO product = resilientProductService.getProductById(orderGroup.getProductId());
        List<Long> pickupUserIds = new ArrayList<>();
        List<Long> deliveryUserIds = new ArrayList<>();

        for (Interest interest : orderGroup.getInterests()) {
            OrderTracking tracking = new OrderTracking();
            tracking.setInterestId(interest.getId());
            tracking.setStatus(OrderTracking.TrackingStatus.ARRIVED_AT_WAREHOUSE);
            tracking.setStatusDate(LocalDateTime.now());
            tracking.setLocation(warehouseName);
            orderTrackingRepository.save(tracking);

            if (interest.getLogisticsPreference() == Interest.LogisticsPreference.PICKUP) {
                pickupUserIds.add(interest.getUserId());
                OrderTracking pickupTracking = new OrderTracking();
                pickupTracking.setInterestId(interest.getId());
                pickupTracking.setStatus(OrderTracking.TrackingStatus.READY_FOR_PICKUP);
                pickupTracking.setStatusDate(LocalDateTime.now());
                pickupTracking.setLocation(warehouseName);
                orderTrackingRepository.save(pickupTracking);
            } else {
                deliveryUserIds.add(interest.getUserId());
                OrderTracking deliveryTracking = new OrderTracking();
                deliveryTracking.setInterestId(interest.getId());
                deliveryTracking.setStatus(OrderTracking.TrackingStatus.OUT_FOR_DELIVERY);
                deliveryTracking.setStatusDate(LocalDateTime.now());
                deliveryTracking.setLocation("Out for delivery");
                orderTrackingRepository.save(deliveryTracking);
            }
        }

        notificationService.notifyOrderArrivedAtWarehouse(orderGroup.getId(), product.getName(),
                warehouseName, warehouseAddress, pickupUserIds, deliveryUserIds);
    }

    @Override
    public List<SellerOrderDTO> getSellerOrdersByOrderGroup(Long orderGroupId) {
        return sellerOrderRepository.findByOrderGroupId(orderGroupId)
                .map(this::convertSellerOrderToDTO)
                .map(List::of)
                .orElse(new ArrayList<>());
    }

    @Override
    public List<SellerOrderDTO> getAllSellerOrders() {
        return sellerOrderRepository.findAll().stream()
                .map(this::convertSellerOrderToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<SellerOrderDTO> getSellerOrdersByWarehouse(Long warehouseId) {
        return sellerOrderRepository.findByDeliveryWarehouseId(warehouseId).stream()
                .map(this::convertSellerOrderToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<SellerOrderDTO> getSellerOrdersBySellerId(Long sellerId) {
        List<SellerOrder> allSellerOrders = sellerOrderRepository.findAll();
        List<SellerOrderDTO> sellerOrders = new ArrayList<>();

        for (SellerOrder sellerOrder : allSellerOrders) {
            try {
                OrderGroup orderGroup = orderGroupRepository.findById(sellerOrder.getOrderGroupId())
                        .orElse(null);
                if (orderGroup == null) continue;

                ProductDTO product = resilientProductService.getProductById(orderGroup.getProductId());
                if (product != null && product.getSellerId() != null && product.getSellerId().equals(sellerId)) {
                    sellerOrders.add(convertSellerOrderToDTO(sellerOrder));
                }
            } catch (Exception e) {
                logger.warn("Error checking seller order {} for seller {}: {}",
                        sellerOrder.getId(), sellerId, e.getMessage());
            }
        }

        sellerOrders.sort((a, b) -> {
            if (a.getPlacedAt() == null && b.getPlacedAt() == null) return 0;
            if (a.getPlacedAt() == null) return 1;
            if (b.getPlacedAt() == null) return -1;
            return b.getPlacedAt().compareTo(a.getPlacedAt());
        });

        return sellerOrders;
    }

    private SellerOrderDTO convertSellerOrderToDTO(SellerOrder sellerOrder) {
        SellerOrderDTO dto = new SellerOrderDTO();
        dto.setId(sellerOrder.getId());
        dto.setOrderGroupId(sellerOrder.getOrderGroupId());
        dto.setSellerOrderNumber(sellerOrder.getSellerOrderNumber());
        dto.setTrackingId(sellerOrder.getTrackingId());
        dto.setSellerTransactionId(sellerOrder.getSellerTransactionId());
        dto.setOrderAmount(sellerOrder.getOrderAmount());
        dto.setStatus(sellerOrder.getStatus().name());
        dto.setPlacedAt(sellerOrder.getPlacedAt());
        dto.setShippedAt(sellerOrder.getShippedAt());
        dto.setEstimatedArrival(sellerOrder.getEstimatedArrival());
        dto.setArrivedAt(sellerOrder.getArrivedAt());
        dto.setNotes(sellerOrder.getNotes());

        if (sellerOrder.getDeliveryWarehouseId() != null) {
            try {
                org.bulkby.logistics.dto.WarehouseDTO warehouse = warehouseService.getWarehouseById(sellerOrder.getDeliveryWarehouseId());
                dto.setDeliveryWarehouseId(warehouse.getId());
                dto.setDeliveryWarehouseName(warehouse.getName());
                dto.setDeliveryWarehouse(warehouse);
            } catch (Exception e) {
                dto.setDeliveryWarehouseId(sellerOrder.getDeliveryWarehouseId());
                dto.setDeliveryWarehouseName("Warehouse");
            }
        }

        try {
            OrderGroup orderGroup = orderGroupRepository.findById(sellerOrder.getOrderGroupId()).orElse(null);
            if (orderGroup != null) {
                dto.setTotalQuantity(orderGroup.getTotalQuantity());
                ProductDTO product = resilientProductService.getProductById(orderGroup.getProductId());
                if (product != null) {
                    dto.setProductId(product.getId());
                    dto.setProductName(product.getName());
                }
            }
        } catch (Exception e) {
            logger.warn("Failed to fetch product information for seller order {}: {}",
                    sellerOrder.getId(), e.getMessage());
        }

        return dto;
    }
}
