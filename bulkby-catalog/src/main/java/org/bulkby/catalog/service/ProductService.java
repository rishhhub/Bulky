package org.bulkby.catalog.service;

import org.bulkby.catalog.dto.ProductDTO;

import java.math.BigDecimal;
import java.util.List;

public interface ProductService {
    List<ProductDTO> getAllProducts();
    List<ProductDTO> searchProducts(String searchTerm, Long categoryId, BigDecimal minPrice, BigDecimal maxPrice, 
                                          String sortBy, String sortOrder);
    List<ProductDTO> getAllProductsForAdmin();
    ProductDTO getProductById(Long id);
    ProductDTO createProduct(ProductDTO productDTO);
    ProductDTO updateProduct(Long id, ProductDTO productDTO);
    void deleteProduct(Long id);
}
