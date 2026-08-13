package org.bulkby.order.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

/**
 * Publisher for domain events. Uses Spring's ApplicationEventPublisher
 * for synchronous event publishing. Can be extended to use message queues
 * for asynchronous publishing in the future.
 */
@Component
public class DomainEventPublisher {
    
    private static final Logger logger = LoggerFactory.getLogger(DomainEventPublisher.class);
    
    private final ApplicationEventPublisher eventPublisher;
    
    public DomainEventPublisher(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }
    
    public void publish(DomainEvent event) {
        logger.debug("Publishing domain event: {} with id: {}", event.getEventType(), event.getEventId());
        try {
            eventPublisher.publishEvent(event);
            logger.debug("Successfully published event: {}", event.getEventId());
        } catch (Exception e) {
            logger.error("Error publishing domain event {}: {}", event.getEventId(), e.getMessage(), e);
            // Don't throw - event publishing should not break the main flow
        }
    }
}
