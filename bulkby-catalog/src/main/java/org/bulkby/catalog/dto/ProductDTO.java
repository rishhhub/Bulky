package org.bulkby.catalog.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.bulkby.catalog.model.Product;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductDTO {
    private Long id;
    
    @NotBlank(message = "Product name is required")
    @Size(max = 200, message = "Product name must not exceed 200 characters")
    private String name;
    
    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;
    
    // Price is optional - for seller products it's calculated from costPerUnit, deliveryCostPerMinOrder, etc.
    // For admin products, price can be set directly
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal price;
    
    @NotNull(message = "Minimum order quantity is required")
    @Min(value = 1, message = "Minimum order quantity must be at least 1")
    private Integer minOrderQuantity;
    
    @Size(max = 500, message = "Source URL must not exceed 500 characters")
    @Pattern(regexp = "^(https?://.*|)$", message = "Source URL must be a valid HTTP/HTTPS URL")
    private String sourceUrl;
    
    @Size(max = 500, message = "Seller info must not exceed 500 characters")
    private String sellerInfo;
    
    @Size(max = 500, message = "Image URL must not exceed 500 characters")
    @Pattern(regexp = "^(https?://.*|/.*|)$", message = "Image URL must be a valid HTTP/HTTPS URL or relative path")
    private String imageUrl; // Keep for backward compatibility
    
    private List<@Size(max = 500, message = "Image URL must not exceed 500 characters") 
                @Pattern(regexp = "^(https?://.*|/.*|)$", message = "Image URL must be a valid HTTP/HTTPS URL or relative path") String> imageUrls; // Multiple images
    
    @NotNull(message = "Category ID is required")
    private Long categoryId;
    
    private String categoryName;
    private String categoryPath; // Full category path like "Electronics > Computers > Laptops"
    private java.util.List<String> categoryBreadcrumbs; // Breadcrumb array
    private Boolean active;
    
    @DecimalMin(value = "0.0", message = "Base delivery cost must be non-negative")
    private BigDecimal baseDeliveryCost;
    
    @DecimalMin(value = "0.0", message = "Weight per unit must be non-negative")
    private BigDecimal weightPerUnit;
    
    private LocalDateTime createdAt;
    private Double averageRating; // Calculated from reviews
    private Long reviewCount; // Number of reviews
    
    // Direct order availability fields (enriched by order service)
    private Boolean directOrderAvailable; // Whether direct order is available
    private Long directOrderOrderGroupId; // Order group ID if direct order available
    private Long directOrderCityId; // City ID for direct order (for validation)
    private String directOrderCityName; // City name for direct order
    private LocalDateTime directOrderExpiresAt; // When direct order opportunity expires (when seller order is placed)
    
    // Seller-related fields
    private Long sellerId;
    private String sellerName;
    private Product.CreatedBy createdBy;
    private Boolean requiresApproval;
    private Product.ApprovalStatus approvalStatus;
    private BigDecimal costPerUnit;
    private BigDecimal deliveryCostPerMinOrder;
    private BigDecimal platformFee;
    private BigDecimal listedPrice;
    private LocalDateTime approvedAt;
    private LocalDateTime rejectedAt;
    private String rejectionReason;
}
