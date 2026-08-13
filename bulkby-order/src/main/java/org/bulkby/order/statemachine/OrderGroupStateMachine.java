package org.bulkby.order.statemachine;

import org.bulkby.order.exception.InvalidInterestStatusException;
import org.bulkby.order.model.OrderGroup;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.EnumSet;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * State machine for OrderGroup status transitions.
 * Ensures only valid state transitions are allowed.
 */
@Component
public class OrderGroupStateMachine {
    
    private static final Logger logger = LoggerFactory.getLogger(OrderGroupStateMachine.class);
    
    // Define valid transitions
    private static final Map<OrderGroup.OrderGroupStatus, Set<OrderGroup.OrderGroupStatus>> VALID_TRANSITIONS = new HashMap<>();
    
    static {
        VALID_TRANSITIONS.put(OrderGroup.OrderGroupStatus.PENDING, EnumSet.of(
            OrderGroup.OrderGroupStatus.COLLECTING,
            OrderGroup.OrderGroupStatus.CANCELLED
        ));
        
        VALID_TRANSITIONS.put(OrderGroup.OrderGroupStatus.COLLECTING, EnumSet.of(
            OrderGroup.OrderGroupStatus.COMPLETE,
            OrderGroup.OrderGroupStatus.CANCELLED
        ));
        
        // Terminal states - no transitions allowed
        VALID_TRANSITIONS.put(OrderGroup.OrderGroupStatus.COMPLETE, EnumSet.noneOf(OrderGroup.OrderGroupStatus.class));
        VALID_TRANSITIONS.put(OrderGroup.OrderGroupStatus.CANCELLED, EnumSet.noneOf(OrderGroup.OrderGroupStatus.class));
    }
    
    /**
     * Check if a state transition is valid.
     * @param currentStatus Current status
     * @param newStatus Desired new status
     * @return true if transition is valid
     */
    public boolean canTransition(OrderGroup.OrderGroupStatus currentStatus, OrderGroup.OrderGroupStatus newStatus) {
        Set<OrderGroup.OrderGroupStatus> allowedTransitions = VALID_TRANSITIONS.get(currentStatus);
        if (allowedTransitions == null) {
            logger.warn("Unknown current status: {}", currentStatus);
            return false;
        }
        return allowedTransitions.contains(newStatus);
    }
    
    /**
     * Transition to a new state, throwing exception if invalid.
     * @param orderGroup OrderGroup entity
     * @param newStatus Desired new status
     * @throws InvalidInterestStatusException if transition is not allowed
     */
    public void transition(OrderGroup orderGroup, OrderGroup.OrderGroupStatus newStatus) {
        OrderGroup.OrderGroupStatus currentStatus = orderGroup.getStatus();
        
        if (currentStatus == newStatus) {
            logger.debug("OrderGroup {} already in status {}", orderGroup.getId(), newStatus);
            return; // Already in desired state
        }
        
        if (!canTransition(currentStatus, newStatus)) {
            logger.error("Invalid state transition for orderGroup {}: {} -> {}", 
                orderGroup.getId(), currentStatus, newStatus);
            throw new InvalidInterestStatusException(
                String.format("Cannot transition OrderGroup from %s to %s", currentStatus, newStatus)
            );
        }
        
        logger.info("Transitioning orderGroup {} from {} to {}", orderGroup.getId(), currentStatus, newStatus);
        orderGroup.setStatus(newStatus);
    }
    
    /**
     * Get all valid next states for a given status.
     * @param currentStatus Current status
     * @return Set of valid next states
     */
    public Set<OrderGroup.OrderGroupStatus> getValidNextStates(OrderGroup.OrderGroupStatus currentStatus) {
        return VALID_TRANSITIONS.getOrDefault(currentStatus, EnumSet.noneOf(OrderGroup.OrderGroupStatus.class));
    }
}
