package org.bulkby.order.service;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.bulkby.order.service.PaymentQueryService.PaymentInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ResilientPaymentQueryService {
    
    private static final Logger logger = LoggerFactory.getLogger(ResilientPaymentQueryService.class);
    
    @Autowired
    private PaymentQueryService paymentQueryService;
    
    @CircuitBreaker(name = "paymentQueryService", fallbackMethod = "hasRemainingPaymentCompletedFallback")
    @Retry(name = "paymentQueryService")
    public boolean hasRemainingPaymentCompleted(Long interestId) {
        logger.debug("Checking remaining payment completion for interest: {}", interestId);
        return paymentQueryService.hasRemainingPaymentCompleted(interestId);
    }
    
    @CircuitBreaker(name = "paymentQueryService", fallbackMethod = "getPaymentsByInterestIdFallback")
    @Retry(name = "paymentQueryService")
    public List<PaymentInfo> getPaymentsByInterestId(Long interestId) {
        logger.debug("Fetching payments for interest: {}", interestId);
        return paymentQueryService.getPaymentsByInterestId(interestId);
    }
    
    // Fallback method - return false (not paid) if service is down to be safe
    private boolean hasRemainingPaymentCompletedFallback(Long interestId, Exception e) {
        logger.error("Circuit breaker opened for paymentQueryService.hasRemainingPaymentCompleted({}): {}", 
            interestId, e.getMessage());
        // Return false to be safe - don't mark as complete if we can't verify
        return false;
    }
    
    // Fallback method - return empty list if service is down
    private List<PaymentInfo> getPaymentsByInterestIdFallback(Long interestId, Exception e) {
        logger.error("Circuit breaker opened for paymentQueryService.getPaymentsByInterestId({}): {}", 
            interestId, e.getMessage());
        return new ArrayList<>(); // Return empty list
    }
}
