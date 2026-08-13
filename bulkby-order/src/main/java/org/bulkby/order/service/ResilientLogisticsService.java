package org.bulkby.order.service;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.bulkby.logistics.dto.LogisticsCostRequest;
import org.bulkby.logistics.dto.LogisticsCostResponse;
import org.bulkby.logistics.service.LogisticsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class ResilientLogisticsService {
    
    private static final Logger logger = LoggerFactory.getLogger(ResilientLogisticsService.class);
    
    @Autowired
    private LogisticsService logisticsService;
    
    @CircuitBreaker(name = "logisticsService", fallbackMethod = "calculateDeliveryCostFallback")
    @Retry(name = "logisticsService")
    public LogisticsCostResponse calculateDeliveryCost(LogisticsCostRequest request) {
        logger.debug("Calculating delivery cost for productId: {}, quantity: {}", 
            request.getProductId(), request.getQuantity());
        return logisticsService.calculateDeliveryCost(request);
    }
    
    // Fallback method - return zero cost if service is down
    private LogisticsCostResponse calculateDeliveryCostFallback(LogisticsCostRequest request, Exception e) {
        logger.warn("Circuit breaker opened for logisticsService.calculateDeliveryCost(): {}. Returning zero cost.", e.getMessage());
        LogisticsCostResponse response = new LogisticsCostResponse();
        response.setDeliveryCost(BigDecimal.ZERO);
        return response;
    }
}
