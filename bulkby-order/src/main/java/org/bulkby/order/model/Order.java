package org.bulkby.order.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Order entity represents when an Interest becomes an actual order.
 * 
 * Key Design Principles:
 * - 1:1 relationship with Interest (unique constraint on interestId)
 * - NO data duplication - all payment/product data remains in Interest
 * - Order tracks fulfillment lifecycle separately from Interest pre-order lifecycle
 * - All transactions remain traceable through Interest → Payments
 * 
 * Lifecycle:
 * - Interest: Pre-order with payments (PENDING → THRESHOLD_MET → COMPLETE)
 * - Order: Actual order fulfillment (PENDING → CONFIRMED → DELIVERED)
 * 
 * Created when SellerOrder is placed by admin.
 */
@Entity
@Table(name = "orders", uniqueConstraints = {
    @UniqueConstraint(columnNames = "interest_id"),
    @UniqueConstraint(columnNames = "order_number")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Order {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 1:1 relationship with Interest - ensures no ambiguity
     * All payment transactions remain linked to Interest
     */
    @Column(name = "interest_id", nullable = false, unique = true)
    private Long interestId;
    
    /**
     * Many orders belong to one OrderGroup
     */
    @Column(name = "order_group_id", nullable = false)
    private Long orderGroupId;
    
    /**
     * Many orders are part of one SellerOrder
     */
    @Column(name = "seller_order_id", nullable = false)
    private Long sellerOrderId;
    
    /**
     * User-facing order number (e.g., ORD-12345)
     * Generated when Order is created
     */
    @Column(name = "order_number", unique = true)
    private String orderNumber;
    
    /**
     * Order fulfillment lifecycle status
     * Separate from Interest.status which tracks pre-order lifecycle
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.PENDING;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;
    
    @Column(name = "shipped_at")
    private LocalDateTime shippedAt;
    
    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;
    
    @Column(name = "picked_up_at")
    private LocalDateTime pickedUpAt;
    
    @Version
    private Long version; // Optimistic locking
    
    /**
     * Order fulfillment lifecycle statuses
     * Tracks the journey from order creation to delivery/pickup
     */
    public enum OrderStatus {
        PENDING,           // Order created but not yet confirmed
        CONFIRMED,         // Seller confirmed the order
        PROCESSING,        // Order being prepared
        SHIPPED,           // Order shipped by seller
        IN_TRANSIT,        // Order in transit to warehouse
        ARRIVED,           // Order arrived at warehouse
        READY_FOR_PICKUP,  // Ready for user pickup
        OUT_FOR_DELIVERY,  // Out for delivery to user
        DELIVERED,         // Delivered to user
        PICKED_UP,         // User picked up from warehouse
        CANCELLED          // Order cancelled
    }
}
