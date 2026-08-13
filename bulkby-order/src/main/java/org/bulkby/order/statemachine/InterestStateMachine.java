package org.bulkby.order.statemachine;

import org.bulkby.order.exception.InvalidInterestStatusException;
import org.bulkby.order.model.Interest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.EnumSet;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * State machine for Interest status transitions.
 * Ensures only valid state transitions are allowed.
 */
@Component
public class InterestStateMachine {
    
    private static final Logger logger = LoggerFactory.getLogger(InterestStateMachine.class);
    
    // Define valid transitions
    private static final Map<Interest.InterestStatus, Set<Interest.InterestStatus>> VALID_TRANSITIONS = new HashMap<>();
    
    static {
        VALID_TRANSITIONS.put(Interest.InterestStatus.PENDING, EnumSet.of(
            Interest.InterestStatus.THRESHOLD_MET,
            Interest.InterestStatus.EXPIRING,
            Interest.InterestStatus.EXPIRED,
            Interest.InterestStatus.WITHDRAWN
        ));
        
        VALID_TRANSITIONS.put(Interest.InterestStatus.EXPIRING, EnumSet.of(
            Interest.InterestStatus.PENDING,
            Interest.InterestStatus.EXPIRED,
            Interest.InterestStatus.WITHDRAWN
        ));
        
        VALID_TRANSITIONS.put(Interest.InterestStatus.THRESHOLD_MET, EnumSet.of(
            Interest.InterestStatus.COLLECTING,
            Interest.InterestStatus.COMPLETE
        ));
        
        VALID_TRANSITIONS.put(Interest.InterestStatus.COLLECTING, EnumSet.of(
            Interest.InterestStatus.COMPLETE
        ));
        
        VALID_TRANSITIONS.put(Interest.InterestStatus.DIRECT_ORDER_READY, EnumSet.of(
            Interest.InterestStatus.DIRECT_ORDER_PLACED,
            Interest.InterestStatus.COMPLETE
        ));
        
        // Terminal states - no transitions allowed
        VALID_TRANSITIONS.put(Interest.InterestStatus.COMPLETE, EnumSet.noneOf(Interest.InterestStatus.class));
        VALID_TRANSITIONS.put(Interest.InterestStatus.EXPIRED, EnumSet.noneOf(Interest.InterestStatus.class));
        VALID_TRANSITIONS.put(Interest.InterestStatus.WITHDRAWN, EnumSet.noneOf(Interest.InterestStatus.class));
        VALID_TRANSITIONS.put(Interest.InterestStatus.DIRECT_ORDER_PLACED, EnumSet.of(
            Interest.InterestStatus.COMPLETE
        ));
        VALID_TRANSITIONS.put(Interest.InterestStatus.PENDING_EXTENSION, EnumSet.of(
            Interest.InterestStatus.PENDING,
            Interest.InterestStatus.EXPIRED,
            Interest.InterestStatus.WITHDRAWN
        ));
    }
    
    /**
     * Check if a state transition is valid.
     * @param currentStatus Current status
     * @param newStatus Desired new status
     * @return true if transition is valid
     */
    public boolean canTransition(Interest.InterestStatus currentStatus, Interest.InterestStatus newStatus) {
        Set<Interest.InterestStatus> allowedTransitions = VALID_TRANSITIONS.get(currentStatus);
        if (allowedTransitions == null) {
            logger.warn("Unknown current status: {}", currentStatus);
            return false;
        }
        return allowedTransitions.contains(newStatus);
    }
    
    /**
     * Transition to a new state, throwing exception if invalid.
     * @param interest Interest entity
     * @param newStatus Desired new status
     * @throws InvalidInterestStatusException if transition is not allowed
     */
    public void transition(Interest interest, Interest.InterestStatus newStatus) {
        Interest.InterestStatus currentStatus = interest.getStatus();
        
        if (currentStatus == newStatus) {
            logger.debug("Interest {} already in status {}", interest.getId(), newStatus);
            return; // Already in desired state
        }
        
        if (!canTransition(currentStatus, newStatus)) {
            logger.error("Invalid state transition for interest {}: {} -> {}", 
                interest.getId(), currentStatus, newStatus);
            throw new InvalidInterestStatusException(
                String.format("Cannot transition from %s to %s", currentStatus, newStatus)
            );
        }
        
        logger.info("Transitioning interest {} from {} to {}", interest.getId(), currentStatus, newStatus);
        interest.setStatus(newStatus);
    }
    
    /**
     * Get all valid next states for a given status.
     * @param currentStatus Current status
     * @return Set of valid next states
     */
    public Set<Interest.InterestStatus> getValidNextStates(Interest.InterestStatus currentStatus) {
        return VALID_TRANSITIONS.getOrDefault(currentStatus, EnumSet.noneOf(Interest.InterestStatus.class));
    }
}
