package org.bulkby.order.service;

import org.bulkby.order.dto.OrderDTO;

import java.util.List;

/**
 * Service for managing Orders.
 * 
 * Key Design:
 * - Order is 1:1 with Interest (created when SellerOrder is placed)
 * - All payment transactions remain linked to Interest
 * - OrderDTO includes Interest and Payment info via joins
 */
public interface OrderService {
    
    /**
     * Get order by ID with full details (includes Interest and Payment info)
     */
    OrderDTO getOrderById(Long orderId);
    
    /**
     * Get order by order number (user-facing identifier)
     */
    OrderDTO getOrderByOrderNumber(String orderNumber);
    
    /**
     * Get all orders for a user (via Interest join)
     * All transactions remain traceable through Interest → Payments
     */
    List<OrderDTO> getUserOrders(Long userId);
    
    /**
     * Get all orders for an OrderGroup
     */
    List<OrderDTO> getOrdersByOrderGroup(Long orderGroupId);
    
    /**
     * Get all orders for a SellerOrder
     */
    List<OrderDTO> getOrdersBySellerOrder(Long sellerOrderId);
    
    /**
     * Get order by Interest ID (1:1 relationship)
     * Returns empty if Interest hasn't become an Order yet
     */
    OrderDTO getOrderByInterestId(Long interestId);
    
    /**
     * Update order status (uses state machine for validation)
     */
    void updateOrderStatus(Long orderId, String newStatus);
}
