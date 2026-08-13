package org.bulkby.order.controller;

import org.bulkby.auth.repository.UserRepository;
import org.bulkby.catalog.dto.ProductDTO;
import org.bulkby.order.service.ProductEnrichmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductEnrichmentController {
    
    @Autowired
    private ProductEnrichmentService productEnrichmentService;
    
    @Autowired(required = false)
    private UserRepository userRepository;
    
    /**
     * Enrich a list of products with direct order availability
     * @param products List of products to enrich
     * @param cityId City ID to check direct order availability (optional)
     * @return Enriched products
     */
    @PostMapping("/enrich")
    public ResponseEntity<List<ProductDTO>> enrichProducts(
            @RequestBody List<ProductDTO> products,
            @RequestParam(required = false) Long cityId) {
        
        Long userId = getCurrentUserId();
        List<ProductDTO> enriched = productEnrichmentService.enrichWithDirectOrderInfo(products, userId, cityId);
        return ResponseEntity.ok(enriched);
    }
    
    /**
     * Enrich a single product with direct order availability
     * @param product Product to enrich
     * @param cityId City ID to check direct order availability (optional)
     * @return Enriched product
     */
    @PostMapping("/enrich-single")
    public ResponseEntity<ProductDTO> enrichProduct(
            @RequestBody ProductDTO product,
            @RequestParam(required = false) Long cityId) {
        
        Long userId = getCurrentUserId();
        ProductDTO enriched = productEnrichmentService.enrichWithDirectOrderInfo(product, userId, cityId);
        return ResponseEntity.ok(enriched);
    }
    
    private Long getCurrentUserId() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated() || 
                authentication.getName().equals("anonymousUser")) {
                return null;
            }
            String contact = authentication.getName();
            if (userRepository != null) {
                return userRepository.findByEmailOrPhone(contact)
                        .map(org.bulkby.auth.model.User::getId)
                        .orElse(null);
            }
        } catch (Exception e) {
            // Ignore - return null
        }
        return null;
    }
}
