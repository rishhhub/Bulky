package org.bulkby.app.config;

import jakarta.servlet.http.HttpServletRequest;
import org.bulkby.common.dto.ApiError;
import org.bulkby.order.exception.*;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;

/**
 * Handles domain exceptions (order, etc.) and returns ApiError with appropriate HTTP status.
 * Runs before GlobalExceptionHandler so domain exceptions get correct status codes.
 */
@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class DomainExceptionHandler {

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ApiError> handleValidationException(
            ValidationException ex, HttpServletRequest request) {
        ApiError body = ApiError.builder()
                .message(ex.getMessage())
                .code("VALIDATION_ERROR")
                .path(request.getRequestURI())
                .timestamp(Instant.now())
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(InterestNotFoundException.class)
    public ResponseEntity<ApiError> handleInterestNotFoundException(
            InterestNotFoundException ex, HttpServletRequest request) {
        ApiError body = ApiError.builder()
                .message(ex.getMessage())
                .code("INTEREST_NOT_FOUND")
                .path(request.getRequestURI())
                .timestamp(Instant.now())
                .build();
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(InvalidInterestStatusException.class)
    public ResponseEntity<ApiError> handleInvalidInterestStatusException(
            InvalidInterestStatusException ex, HttpServletRequest request) {
        ApiError body = ApiError.builder()
                .message(ex.getMessage())
                .code("INVALID_INTEREST_STATUS")
                .path(request.getRequestURI())
                .timestamp(Instant.now())
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(InvalidOrderStatusException.class)
    public ResponseEntity<ApiError> handleInvalidOrderStatusException(
            InvalidOrderStatusException ex, HttpServletRequest request) {
        ApiError body = ApiError.builder()
                .message(ex.getMessage())
                .code("INVALID_ORDER_STATUS")
                .path(request.getRequestURI())
                .timestamp(Instant.now())
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(OrderGroupCreationException.class)
    public ResponseEntity<ApiError> handleOrderGroupCreationException(
            OrderGroupCreationException ex, HttpServletRequest request) {
        ApiError body = ApiError.builder()
                .message(ex.getMessage())
                .code("ORDER_GROUP_CREATION_ERROR")
                .path(request.getRequestURI())
                .timestamp(Instant.now())
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(PaymentVerificationException.class)
    public ResponseEntity<ApiError> handlePaymentVerificationException(
            PaymentVerificationException ex, HttpServletRequest request) {
        ApiError body = ApiError.builder()
                .message(ex.getMessage())
                .code("PAYMENT_VERIFICATION_ERROR")
                .path(request.getRequestURI())
                .timestamp(Instant.now())
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }
}
