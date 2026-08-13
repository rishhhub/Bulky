package org.bulkby.order.service;

import org.bulkby.catalog.dto.ProductDTO;

import java.util.List;

public interface ProductEnrichmentService {
    /**
     * Enrich products with direct order availability information
     * @param products List of products to enrich
     * @param userId User ID (optional, for filtering)
     * @param cityId City ID to check direct order availability
     * @return Enriched products
     */
    List<ProductDTO> enrichWithDirectOrderInfo(List<ProductDTO> products, Long userId, Long cityId);
    
    /**
     * Enrich a single product with direct order availability information
     * @param product Product to enrich
     * @param userId User ID (optional)
     * @param cityId City ID to check direct order availability
     * @return Enriched product
     */
    ProductDTO enrichWithDirectOrderInfo(ProductDTO product, Long userId, Long cityId);
}
