package org.bulkby.order.service;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.bulkby.catalog.dto.ProductDTO;
import org.bulkby.catalog.service.ProductService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ResilientProductService {
    
    private static final Logger logger = LoggerFactory.getLogger(ResilientProductService.class);
    
    @Autowired
    private ProductService productService;
    
    @CircuitBreaker(name = "productService", fallbackMethod = "getProductByIdFallback")
    @Retry(name = "productService")
    public ProductDTO getProductById(Long id) {
        logger.debug("Fetching product by id: {}", id);
        return productService.getProductById(id);
    }
    
    @CircuitBreaker(name = "productService", fallbackMethod = "getAllProductsFallback")
    @Retry(name = "productService")
    public List<ProductDTO> getAllProducts() {
        logger.debug("Fetching all products");
        return productService.getAllProducts();
    }
    
    // Fallback methods
    private ProductDTO getProductByIdFallback(Long id, Exception e) {
        logger.error("Circuit breaker opened for productService.getProductById({}): {}", id, e.getMessage());
        throw new RuntimeException("Product service is temporarily unavailable. Please try again later.", e);
    }
    
    private List<ProductDTO> getAllProductsFallback(Exception e) {
        logger.error("Circuit breaker opened for productService.getAllProducts(): {}", e.getMessage());
        return new ArrayList<>(); // Return empty list instead of failing
    }
}
