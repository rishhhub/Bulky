package org.bulkby.order.repository;

import org.bulkby.order.model.Order;
import org.bulkby.order.model.Order.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    /**
     * Find order by interest ID (1:1 relationship)
     * Used to check if an Interest has become an Order
     */
    Optional<Order> findByInterestId(Long interestId);
    
    /**
     * Find all orders for an OrderGroup
     */
    List<Order> findByOrderGroupId(Long orderGroupId);
    
    /**
     * Find all orders for a SellerOrder
     */
    List<Order> findBySellerOrderId(Long sellerOrderId);
    
    /**
     * Find orders by status
     */
    List<Order> findByStatus(OrderStatus status);
    
    /**
     * Find order by order number (user-facing identifier)
     */
    Optional<Order> findByOrderNumber(String orderNumber);
    
    /**
     * Find orders for a user (via Interest join)
     * This query joins with Interest to get user's orders
     * All transactions remain traceable through Interest → Payments
     */
    @Query("SELECT o FROM Order o WHERE o.interestId IN " +
           "(SELECT i.id FROM Interest i WHERE i.userId = :userId)")
    List<Order> findByUserId(@Param("userId") Long userId);
    
    /**
     * Find orders with Interest details for full context
     * This ensures all payment/product info is accessible via Interest
     */
    @Query("SELECT o FROM Order o WHERE o.id = :orderId")
    Optional<Order> findByIdWithDetails(@Param("orderId") Long orderId);
}
