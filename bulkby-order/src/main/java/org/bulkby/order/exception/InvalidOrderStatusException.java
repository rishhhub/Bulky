package org.bulkby.order.exception;

import org.bulkby.order.model.Order;

public class InvalidOrderStatusException extends RuntimeException {
    public InvalidOrderStatusException(Order.OrderStatus currentStatus, String operation) {
        super(String.format("Order cannot be %s in current status: %s", operation, currentStatus));
    }
}
