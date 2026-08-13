package org.bulkby.order.statemachine;

import org.bulkby.order.exception.InvalidOrderStatusException;
import org.bulkby.order.model.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * State machine for Order status transitions.
 * Ensures valid state changes for order fulfillment lifecycle.
 */
@Component
public class OrderStateMachine {

    private static final Logger logger = LoggerFactory.getLogger(OrderStateMachine.class);

    public void transition(Order order, Order.OrderStatus newStatus) {
        Order.OrderStatus currentStatus = order.getStatus();
        if (currentStatus == newStatus) {
            logger.debug("Order {} is already in status {}", order.getId(), newStatus);
            return;
        }

        switch (currentStatus) {
            case PENDING:
                if (newStatus == Order.OrderStatus.CONFIRMED ||
                    newStatus == Order.OrderStatus.SHIPPED ||
                    newStatus == Order.OrderStatus.CANCELLED) {
                    order.setStatus(newStatus);
                    if (newStatus == Order.OrderStatus.CONFIRMED) {
                        order.setConfirmedAt(java.time.LocalDateTime.now());
                    }
                    if (newStatus == Order.OrderStatus.SHIPPED) {
                        order.setShippedAt(java.time.LocalDateTime.now());
                    }
                    logger.info("Order {} transitioned from {} to {}", order.getId(), currentStatus, newStatus);
                } else {
                    throw new InvalidOrderStatusException(currentStatus, "transition to " + newStatus);
                }
                break;
                
            case CONFIRMED:
                if (newStatus == Order.OrderStatus.PROCESSING ||
                    newStatus == Order.OrderStatus.SHIPPED ||
                    newStatus == Order.OrderStatus.CANCELLED) {
                    order.setStatus(newStatus);
                    if (newStatus == Order.OrderStatus.SHIPPED) {
                        order.setShippedAt(java.time.LocalDateTime.now());
                    }
                    logger.info("Order {} transitioned from {} to {}", order.getId(), currentStatus, newStatus);
                } else {
                    throw new InvalidOrderStatusException(currentStatus, "transition to " + newStatus);
                }
                break;
                
            case PROCESSING:
                if (newStatus == Order.OrderStatus.SHIPPED ||
                    newStatus == Order.OrderStatus.CANCELLED) {
                    order.setStatus(newStatus);
                    if (newStatus == Order.OrderStatus.SHIPPED) {
                        order.setShippedAt(java.time.LocalDateTime.now());
                    }
                    logger.info("Order {} transitioned from {} to {}", order.getId(), currentStatus, newStatus);
                } else {
                    throw new InvalidOrderStatusException(currentStatus, "transition to " + newStatus);
                }
                break;
                
            case SHIPPED:
                if (newStatus == Order.OrderStatus.IN_TRANSIT ||
                    newStatus == Order.OrderStatus.CANCELLED) {
                    order.setStatus(newStatus);
                    logger.info("Order {} transitioned from {} to {}", order.getId(), currentStatus, newStatus);
                } else {
                    throw new InvalidOrderStatusException(currentStatus, "transition to " + newStatus);
                }
                break;
                
            case IN_TRANSIT:
                if (newStatus == Order.OrderStatus.ARRIVED ||
                    newStatus == Order.OrderStatus.CANCELLED) {
                    order.setStatus(newStatus);
                    logger.info("Order {} transitioned from {} to {}", order.getId(), currentStatus, newStatus);
                } else {
                    throw new InvalidOrderStatusException(currentStatus, "transition to " + newStatus);
                }
                break;
                
            case ARRIVED:
                if (newStatus == Order.OrderStatus.READY_FOR_PICKUP ||
                    newStatus == Order.OrderStatus.OUT_FOR_DELIVERY ||
                    newStatus == Order.OrderStatus.CANCELLED) {
                    order.setStatus(newStatus);
                    logger.info("Order {} transitioned from {} to {}", order.getId(), currentStatus, newStatus);
                } else {
                    throw new InvalidOrderStatusException(currentStatus, "transition to " + newStatus);
                }
                break;
                
            case READY_FOR_PICKUP:
                if (newStatus == Order.OrderStatus.PICKED_UP ||
                    newStatus == Order.OrderStatus.CANCELLED) {
                    order.setStatus(newStatus);
                    if (newStatus == Order.OrderStatus.PICKED_UP) {
                        order.setPickedUpAt(java.time.LocalDateTime.now());
                    }
                    logger.info("Order {} transitioned from {} to {}", order.getId(), currentStatus, newStatus);
                } else {
                    throw new InvalidOrderStatusException(currentStatus, "transition to " + newStatus);
                }
                break;
                
            case OUT_FOR_DELIVERY:
                if (newStatus == Order.OrderStatus.DELIVERED ||
                    newStatus == Order.OrderStatus.CANCELLED) {
                    order.setStatus(newStatus);
                    if (newStatus == Order.OrderStatus.DELIVERED) {
                        order.setDeliveredAt(java.time.LocalDateTime.now());
                    }
                    logger.info("Order {} transitioned from {} to {}", order.getId(), currentStatus, newStatus);
                } else {
                    throw new InvalidOrderStatusException(currentStatus, "transition to " + newStatus);
                }
                break;
                
            case DELIVERED:
            case PICKED_UP:
            case CANCELLED:
                logger.warn("Attempted to transition order {} from final status {} to {}", 
                    order.getId(), currentStatus, newStatus);
                throw new InvalidOrderStatusException(currentStatus, "transition from final state");
                
            default:
                throw new InvalidOrderStatusException(currentStatus, "unknown transition to " + newStatus);
        }
    }
}
