package org.bulkby.order.exception;

import org.bulkby.order.model.Interest;

public class InvalidInterestStatusException extends RuntimeException {
    public InvalidInterestStatusException(String message) {
        super(message);
    }
    
    public InvalidInterestStatusException(Interest.InterestStatus currentStatus, String operation) {
        super("Cannot " + operation + " interest in current status: " + currentStatus);
    }
}
