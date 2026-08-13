package org.bulkby.order.exception;

public class OrderGroupCreationException extends RuntimeException {
    public OrderGroupCreationException(String message) {
        super(message);
    }
    
    public OrderGroupCreationException(String message, Throwable cause) {
        super(message, cause);
    }
}
