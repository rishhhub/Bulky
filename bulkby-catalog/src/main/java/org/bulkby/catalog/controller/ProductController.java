package org.bulkby.catalog.controller;

import org.bulkby.catalog.dto.ProductDTO;
import org.bulkby.catalog.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/products")
public class ProductController {
    
    @Autowired
    private ProductService productService;
    
    @GetMapping
    public ResponseEntity<List<ProductDTO>> getAllProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortOrder,
            @RequestParam(required = false) Long cityId) {
        
        List<ProductDTO> products;
        
        // If any filter/search/sort parameters are provided, use search method
        if (search != null || categoryId != null || minPrice != null || maxPrice != null || 
            sortBy != null || sortOrder != null) {
            products = productService.searchProducts(
                    search, categoryId, minPrice, maxPrice, sortBy, sortOrder);
        } else {
            // Otherwise return all products
            products = productService.getAllProducts();
        }
        
        // Note: Product enrichment with direct order info is handled in bulkby-order module
        // The cityId parameter is accepted here but enrichment happens at a higher level
        
        return ResponseEntity.ok(products);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ProductDTO> getProductById(
            @PathVariable("id") Long id,
            @RequestParam(required = false) Long cityId) {
        ProductDTO product = productService.getProductById(id);
        
        // Note: Product enrichment with direct order info is handled in bulkby-order module
        // The cityId parameter is accepted here but enrichment happens at a higher level
        
        return ResponseEntity.ok(product);
    }
}
