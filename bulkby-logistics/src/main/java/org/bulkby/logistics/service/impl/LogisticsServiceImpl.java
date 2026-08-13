package org.bulkby.logistics.service.impl;

import org.bulkby.catalog.service.ProductService;
import org.bulkby.catalog.dto.ProductDTO;
import org.bulkby.logistics.dto.LogisticsCostRequest;
import org.bulkby.logistics.dto.LogisticsCostResponse;
import org.bulkby.logistics.service.LogisticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class LogisticsServiceImpl implements LogisticsService {
    
    @Autowired
    private ProductService productService;
    
    @Value("${logistics.weight-multiplier:2.5}")
    private Double weightMultiplier;
    
    @Override
    public LogisticsCostResponse calculateDeliveryCost(LogisticsCostRequest request) {
        ProductDTO product = productService.getProductById(request.getProductId());
        
        // Base delivery cost
        BigDecimal baseCost = product.getBaseDeliveryCost() != null ? 
                product.getBaseDeliveryCost() : BigDecimal.ZERO;
        
        // Weight-based cost calculation
        BigDecimal weightPerUnit = product.getWeightPerUnit() != null ? 
                product.getWeightPerUnit() : BigDecimal.ONE;
        
        BigDecimal totalWeight = weightPerUnit.multiply(BigDecimal.valueOf(request.getQuantity()));
        BigDecimal weightCost = totalWeight.multiply(BigDecimal.valueOf(weightMultiplier));
        
        // Total delivery cost
        BigDecimal totalDeliveryCost = baseCost.add(weightCost);
        
        // Round to 2 decimal places
        totalDeliveryCost = totalDeliveryCost.setScale(2, RoundingMode.HALF_UP);
        
        String details = String.format(
                "Base cost: ₹%s, Weight: %s kg × %d units × ₹%s/kg = ₹%s, Total: ₹%s",
                baseCost.setScale(2, RoundingMode.HALF_UP),
                weightPerUnit.setScale(2, RoundingMode.HALF_UP),
                request.getQuantity(),
                weightMultiplier,
                weightCost.setScale(2, RoundingMode.HALF_UP),
                totalDeliveryCost
        );
        
        return new LogisticsCostResponse(totalDeliveryCost, details);
    }
}
