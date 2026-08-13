package org.bulkby.catalog.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bulkby.auth.model.User;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
    
    @Column(nullable = false)
    private Integer minOrderQuantity;
    
    @Column(name = "source_url")
    private String sourceUrl;
    
    @Column(name = "seller_info")
    private String sellerInfo;
    
    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl; // Keep for backward compatibility, use imageUrls for multiple images
    
    @ElementCollection
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "image_url", columnDefinition = "TEXT")
    private List<String> imageUrls = new ArrayList<>();
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;
    
    @Column(nullable = false)
    private Boolean active = true;
    
    @Column(name = "base_delivery_cost", precision = 10, scale = 2)
    private BigDecimal baseDeliveryCost = BigDecimal.ZERO;
    
    @Column(name = "weight_per_unit", precision = 10, scale = 2)
    private BigDecimal weightPerUnit = BigDecimal.ONE;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    // Seller-related fields
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id")
    private User seller;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "created_by", nullable = false)
    private CreatedBy createdBy = CreatedBy.ADMIN;
    
    @Column(name = "requires_approval", nullable = false)
    private Boolean requiresApproval = true;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status")
    private ApprovalStatus approvalStatus;
    
    @Column(name = "cost_per_unit", precision = 10, scale = 2)
    private BigDecimal costPerUnit; // Seller's base cost per unit
    
    @Column(name = "delivery_cost_per_min_order", precision = 10, scale = 2)
    private BigDecimal deliveryCostPerMinOrder; // Delivery cost for minimum order
    
    @Column(name = "platform_fee", precision = 10, scale = 2)
    private BigDecimal platformFee; // Calculated platform fee
    
    @Column(name = "listed_price", precision = 10, scale = 2)
    private BigDecimal listedPrice; // Final price visible to users (calculated)
    
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
    
    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;
    
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;
    
    public enum CreatedBy {
        ADMIN, SELLER
    }
    
    public enum ApprovalStatus {
        PENDING, APPROVED, REJECTED
    }
}
