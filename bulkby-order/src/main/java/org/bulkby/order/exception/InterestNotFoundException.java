package org.bulkby.order.exception;

public class InterestNotFoundException extends RuntimeException {
    public InterestNotFoundException(String message) {
        super(message);
    }
    
    public InterestNotFoundException(Long id) {
        super("Interest not found with id: " + id);
    }
}
