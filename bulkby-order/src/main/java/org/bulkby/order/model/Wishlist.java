package org.bulkby.order.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "wishlists", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "product_id"})
}, indexes = {
    @Index(name = "idx_wishlist_user_id", columnList = "user_id"),
    @Index(name = "idx_wishlist_product_id", columnList = "product_id"),
    @Index(name = "idx_wishlist_notified_at", columnList = "notified_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Wishlist {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId; // Reference to user in auth module
    
    @Column(name = "product_id", nullable = false)
    private Long productId; // Reference to product in catalog module
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "notified_at")
    private LocalDateTime notifiedAt; // Track when user was notified about direct order opportunity
}
