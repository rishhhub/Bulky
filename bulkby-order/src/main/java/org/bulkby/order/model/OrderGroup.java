package org.bulkby.order.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "order_groups")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderGroup {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "product_id", nullable = false)
    private Long productId; // Reference to product in catalog module
    
    @Column(name = "city_id")
    private Long cityId; // City for this order group (for location-based grouping)
    
    @Column(name = "grouping_key")
    private String groupingKey; // Composite key: {productId}_CITY_{cityId} (for both PICKUP and DELIVERY)
    
    @Column(name = "city_name")
    private String cityName; // Denormalized city name for quick display
    
    @Column(name = "total_quantity", nullable = false)
    private Integer totalQuantity;
    
    @Column(name = "required_quantity", nullable = false)
    private Integer requiredQuantity;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderGroupStatus status = OrderGroupStatus.PENDING;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
    
    @Version
    private Long version; // Optimistic locking
    
    @Column(name = "accepting_new_orders", nullable = false)
    private Boolean acceptingNewOrders = true; // Admin can stop accepting new orders
    
    @ManyToMany
    @JoinTable(
        name = "order_group_interests",
        joinColumns = @JoinColumn(name = "order_group_id"),
        inverseJoinColumns = @JoinColumn(name = "interest_id")
    )
    private Set<Interest> interests = new HashSet<>();
    
    public enum OrderGroupStatus {
        PENDING, COLLECTING, COMPLETE, CANCELLED
    }
}
