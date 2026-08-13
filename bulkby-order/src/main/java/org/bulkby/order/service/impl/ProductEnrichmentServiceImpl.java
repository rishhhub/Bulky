package org.bulkby.order.service.impl;

import org.bulkby.catalog.dto.ProductDTO;
import org.bulkby.order.model.OrderGroup;
import org.bulkby.order.repository.OrderGroupRepository;
import org.bulkby.order.repository.SellerOrderRepository;
import org.bulkby.order.service.OrderGroupService;
import org.bulkby.order.service.ProductEnrichmentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductEnrichmentServiceImpl implements ProductEnrichmentService {
    
    private static final Logger logger = LoggerFactory.getLogger(ProductEnrichmentServiceImpl.class);
    
    @Autowired
    private OrderGroupService orderGroupService;
    
    @Autowired
    private OrderGroupRepository orderGroupRepository;
    
    @Autowired
    private SellerOrderRepository sellerOrderRepository;
    
    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> enrichWithDirectOrderInfo(List<ProductDTO> products, Long userId, Long cityId) {
        if (cityId == null) {
            // If no cityId provided, return products as-is
            return products;
        }
        
        return products.stream()
                .map(product -> enrichWithDirectOrderInfo(product, userId, cityId))
                .toList();
    }
    
    @Override
    @Transactional(readOnly = true)
    public ProductDTO enrichWithDirectOrderInfo(ProductDTO product, Long userId, Long cityId) {
        if (cityId == null) {
            product.setDirectOrderAvailable(false);
            return product;
        }
        
        try {
            // Check if direct order is available for this product and city
            boolean available = orderGroupService.isDirectOrderAvailable(product.getId(), cityId);
            product.setDirectOrderAvailable(available);
            
            if (available) {
                // Find the order group and set additional info
                List<OrderGroup> orderGroups = orderGroupRepository.findByProductIdWithInterests(product.getId());
                for (OrderGroup orderGroup : orderGroups) {
                    if (orderGroup.getCityId() != null && orderGroup.getCityId().equals(cityId) &&
                        orderGroup.getStatus() == OrderGroup.OrderGroupStatus.COLLECTING &&
                        orderGroup.getAcceptingNewOrders() != null && orderGroup.getAcceptingNewOrders()) {
                        
                        // Check if seller order has been placed
                        boolean sellerOrderPlaced = sellerOrderRepository.findByOrderGroupId(orderGroup.getId()).isPresent();
                        if (!sellerOrderPlaced) {
                            product.setDirectOrderOrderGroupId(orderGroup.getId());
                            product.setDirectOrderCityId(orderGroup.getCityId());
                            product.setDirectOrderCityName(orderGroup.getCityName());
                            // Expires when seller order is placed (we don't know when, so set to null for now)
                            // Could be set based on a timeout or when seller order is actually placed
                            product.setDirectOrderExpiresAt(null);
                            break;
                        }
                    }
                }
            } else {
                product.setDirectOrderOrderGroupId(null);
                product.setDirectOrderCityId(null);
                product.setDirectOrderCityName(null);
                product.setDirectOrderExpiresAt(null);
            }
        } catch (Exception e) {
            logger.warn("Error enriching product {} with direct order info: {}", product.getId(), e.getMessage());
            product.setDirectOrderAvailable(false);
        }
        
        return product;
    }
}
