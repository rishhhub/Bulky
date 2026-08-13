package org.bulkby.catalog.service;

import org.bulkby.catalog.dto.ProductDTO;

import java.math.BigDecimal;
import java.util.List;

public interface SellerProductService {
    
    /**
     * Create a product for a seller with automatic price calculation
     */
    ProductDTO createProduct(Long sellerId, ProductDTO productDTO);
    
    /**
     * Calculate the listed price based on seller's cost and delivery cost
     * Formula: costPerUnit + (deliveryCostPerMinOrder / minOrderQuantity) + platformFee
     * where platformFee = min(10% of costPerUnit, 100)
     */
    BigDecimal calculateListedPrice(BigDecimal costPerUnit, BigDecimal deliveryCostPerMinOrder, Integer minOrderQuantity);
    
    /**
     * Get all products for a seller
     */
    List<ProductDTO> getSellerProducts(Long sellerId);
    
    /**
     * Update a seller's product
     */
    ProductDTO updateProduct(Long sellerId, Long productId, ProductDTO productDTO);
    
    /**
     * Delete a seller's product
     */
    void deleteProduct(Long sellerId, Long productId);
    
    /**
     * Approve a seller product (admin only)
     * Sets baseDeliveryCost based on weightPerUnit
     */
    ProductDTO approveProduct(Long productId, Long adminId);
    
    /**
     * Reject a seller product (admin only)
     */
    ProductDTO rejectProduct(Long productId, Long adminId, String rejectionReason);
    
    /**
     * Get all pending product approvals (admin only)
     */
    List<ProductDTO> getPendingProductApprovals();
}
