package org.bulkby.order.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "seller_orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SellerOrder {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "order_group_id", nullable = false)
    private Long orderGroupId; // Reference to order group
    
    @Column(name = "seller_order_number")
    private String sellerOrderNumber;
    
    @Column(name = "tracking_id")
    private String trackingId;
    
    @Column(name = "seller_transaction_id")
    private String sellerTransactionId;
    
    @Column(name = "order_amount", precision = 10, scale = 2)
    private BigDecimal orderAmount;
    
    @Column(name = "delivery_warehouse_id")
    private Long deliveryWarehouseId; // Reference to warehouse in logistics module
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SellerOrderStatus status = SellerOrderStatus.PLACED;
    
    @Column(name = "placed_at", nullable = false, updatable = false)
    private LocalDateTime placedAt = LocalDateTime.now();
    
    @Column(name = "shipped_at")
    private LocalDateTime shippedAt;
    
    @Column(name = "estimated_arrival")
    private LocalDateTime estimatedArrival;
    
    @Column(name = "arrived_at")
    private LocalDateTime arrivedAt;
    
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    public enum SellerOrderStatus {
        PLACED,           // Order placed with seller
        CONFIRMED,        // Seller confirmed the order
        SHIPPED,          // Order shipped by seller
        IN_TRANSIT,       // Order in transit
        ARRIVED,          // Order arrived at warehouse
        DISTRIBUTING,     // Distributing to users (pickup/delivery)
        COMPLETED         // All users received their orders
    }
}
