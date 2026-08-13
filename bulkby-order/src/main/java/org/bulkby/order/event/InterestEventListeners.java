package org.bulkby.order.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Example event listeners for Interest domain events.
 * These demonstrate how other services can react to domain events.
 */
@Component
public class InterestEventListeners {
    
    private static final Logger logger = LoggerFactory.getLogger(InterestEventListeners.class);
    
    @EventListener
    @Async
    public void handleInterestCreated(InterestCreatedEvent event) {
        logger.info("Interest created event received: interestId={}, productId={}, quantity={}", 
            event.getInterestId(), event.getProductId(), event.getQuantity());
        // Additional processing can be added here:
        // - Update analytics
        // - Send to message queue
        // - Update cache
        // - Trigger other workflows
    }
    
    @EventListener
    @Async
    public void handleInterestUpdated(InterestUpdatedEvent event) {
        logger.info("Interest updated event received: interestId={}, productId={}, quantityChanged={}->{}", 
            event.getInterestId(), event.getProductId(), event.getOldQuantity(), event.getNewQuantity());
        // Additional processing can be added here
    }
    
    @EventListener
    @Async
    public void handleThresholdMet(ThresholdMetEvent event) {
        logger.info("Threshold met event received: orderGroupId={}, productId={}, totalQuantity={}", 
            event.getOrderGroupId(), event.getProductId(), event.getTotalQuantity());
        // Additional processing can be added here:
        // - Update analytics dashboard
        // - Send notifications to admin
        // - Update reporting
    }
}
