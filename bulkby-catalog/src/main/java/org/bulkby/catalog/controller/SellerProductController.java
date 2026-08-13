package org.bulkby.catalog.controller;

import org.bulkby.auth.service.ProfileService;
import org.bulkby.catalog.dto.ProductDTO;
import org.bulkby.catalog.service.SellerProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/seller/products")
public class SellerProductController {
    
    @Autowired
    private SellerProductService sellerProductService;
    
    @Autowired
    private ProfileService profileService;
    
    /**
     * Create a product for the current seller
     */
    @PostMapping
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ProductDTO> createProduct(@Valid @RequestBody ProductDTO productDTO) {
        Long sellerId = profileService.getCurrentUser().getId();
        ProductDTO created = sellerProductService.createProduct(sellerId, productDTO);
        return ResponseEntity.ok(created);
    }
    
    /**
     * Get all products for the current seller
     */
    @GetMapping
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<List<ProductDTO>> getSellerProducts() {
        Long sellerId = profileService.getCurrentUser().getId();
        List<ProductDTO> products = sellerProductService.getSellerProducts(sellerId);
        return ResponseEntity.ok(products);
    }
    
    /**
     * Update a product for the current seller
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ProductDTO> updateProduct(
            @PathVariable("id") Long productId,
            @Valid @RequestBody ProductDTO productDTO) {
        Long sellerId = profileService.getCurrentUser().getId();
        ProductDTO updated = sellerProductService.updateProduct(sellerId, productId, productDTO);
        return ResponseEntity.ok(updated);
    }
    
    /**
     * Delete a product for the current seller
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<Void> deleteProduct(@PathVariable("id") Long productId) {
        Long sellerId = profileService.getCurrentUser().getId();
        sellerProductService.deleteProduct(sellerId, productId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Calculate and preview the listed price before creating product
     */
    @PostMapping("/calculate-price")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<Map<String, Object>> calculatePrice(
            @RequestParam BigDecimal costPerUnit,
            @RequestParam BigDecimal deliveryCostPerMinOrder,
            @RequestParam Integer minOrderQuantity) {
        
        BigDecimal listedPrice = sellerProductService.calculateListedPrice(
            costPerUnit, deliveryCostPerMinOrder, minOrderQuantity);
        
        // Calculate breakdown
        BigDecimal deliveryCostPerUnit = deliveryCostPerMinOrder
            .divide(BigDecimal.valueOf(minOrderQuantity), 4, java.math.RoundingMode.HALF_UP);
        
        BigDecimal tenPercent = costPerUnit.multiply(new BigDecimal("0.10"));
        BigDecimal platformFee = tenPercent.min(new BigDecimal("100"));
        
        Map<String, Object> response = new HashMap<>();
        response.put("costPerUnit", costPerUnit);
        response.put("deliveryCostPerUnit", deliveryCostPerUnit.setScale(2, java.math.RoundingMode.HALF_UP));
        response.put("platformFee", platformFee);
        response.put("listedPrice", listedPrice);
        
        return ResponseEntity.ok(response);
    }
}
