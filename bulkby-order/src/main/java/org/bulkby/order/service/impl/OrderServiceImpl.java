package org.bulkby.order.service.impl;

import org.bulkby.order.dto.OrderDTO;
import org.bulkby.order.exception.InterestNotFoundException;
import org.bulkby.order.model.Interest;
import org.bulkby.order.model.Order;
import org.bulkby.order.repository.InterestRepository;
import org.bulkby.order.repository.OrderRepository;
import org.bulkby.order.service.OrderService;
import org.bulkby.order.service.PaymentQueryService;
import org.bulkby.order.statemachine.OrderStateMachine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of OrderService.
 * 
 * Ensures all transactions remain traceable through Interest → Payments.
 * Order is a lightweight reference that provides clarity on when Interest became an Order.
 */
@Service
public class OrderServiceImpl implements OrderService {
    
    private static final Logger logger = LoggerFactory.getLogger(OrderServiceImpl.class);
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private InterestRepository interestRepository;
    
    @Autowired
    private PaymentQueryService paymentQueryService;
    
    @Autowired
    private OrderStateMachine orderStateMachine;
    
    @Override
    public OrderDTO getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
        return convertToDTO(order);
    }
    
    @Override
    public OrderDTO getOrderByOrderNumber(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new RuntimeException("Order not found with order number: " + orderNumber));
        return convertToDTO(order);
    }
    
    @Override
    public List<OrderDTO> getUserOrders(Long userId) {
        List<Order> orders = orderRepository.findByUserId(userId);
        return orders.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<OrderDTO> getOrdersByOrderGroup(Long orderGroupId) {
        List<Order> orders = orderRepository.findByOrderGroupId(orderGroupId);
        return orders.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<OrderDTO> getOrdersBySellerOrder(Long sellerOrderId) {
        List<Order> orders = orderRepository.findBySellerOrderId(sellerOrderId);
        return orders.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public OrderDTO getOrderByInterestId(Long interestId) {
        return orderRepository.findByInterestId(interestId)
                .map(this::convertToDTO)
                .orElse(null);
    }
    
    @Override
    @Transactional
    public void updateOrderStatus(Long orderId, String newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
        
        Order.OrderStatus status = Order.OrderStatus.valueOf(newStatus);
        orderStateMachine.transition(order, status);
        orderRepository.save(order);
        
        logger.info("Order {} status updated to {}", orderId, newStatus);
    }
    
    /**
     * Convert Order to DTO, including Interest and Payment info.
     * This ensures all transactions remain visible through Interest → Payments.
     */
    private OrderDTO convertToDTO(Order order) {
        OrderDTO dto = new OrderDTO();
        dto.setId(order.getId());
        dto.setOrderNumber(order.getOrderNumber());
        dto.setInterestId(order.getInterestId());
        dto.setOrderGroupId(order.getOrderGroupId());
        dto.setSellerOrderId(order.getSellerOrderId());
        dto.setStatus(order.getStatus().name());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setConfirmedAt(order.getConfirmedAt());
        dto.setShippedAt(order.getShippedAt());
        dto.setDeliveredAt(order.getDeliveredAt());
        dto.setPickedUpAt(order.getPickedUpAt());
        
        // Get Interest details (all payment/product info remains in Interest)
        Interest interest = interestRepository.findById(order.getInterestId())
                .orElseThrow(() -> new InterestNotFoundException(order.getInterestId()));
        
        dto.setUserId(interest.getUserId());
        dto.setProductId(interest.getProductId());
        dto.setQuantity(interest.getQuantity());
        dto.setDepositPaid(interest.getDepositPaid());
        dto.setDeliveryCost(interest.getDeliveryCost());
        dto.setLogisticsPreference(interest.getLogisticsPreference().name());
        dto.setDeliveryAddress(interest.getDeliveryAddress());
        dto.setWarehouseId(interest.getWarehouseId());
        dto.setInterestStatus(interest.getStatus().name());
        
        // Get payment history (all transactions remain linked to Interest)
        try {
            List<PaymentQueryService.PaymentInfo> payments = paymentQueryService.getPaymentsByInterestId(order.getInterestId());
            dto.setPayments(payments);
        } catch (Exception e) {
            logger.warn("Failed to fetch payments for interest {}: {}", order.getInterestId(), e.getMessage());
        }
        
        return dto;
    }
}
