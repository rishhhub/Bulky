package org.bulkby.common.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.bulkby.common.dto.ApiError;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        List<ApiError.FieldError> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> new ApiError.FieldError(
                        err.getField(),
                        err.getDefaultMessage(),
                        err.getCode()))
                .collect(Collectors.toList());
        ApiError body = ApiError.builder()
                .message("Request validation failed")
                .code("VALIDATION_FAILED")
                .path(request.getRequestURI())
                .timestamp(Instant.now())
                .errors(errors)
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraintViolation(
            ConstraintViolationException ex, HttpServletRequest request) {
        List<ApiError.FieldError> errors = new ArrayList<>();
        for (ConstraintViolation<?> v : ex.getConstraintViolations()) {
            String path = v.getPropertyPath() != null ? v.getPropertyPath().toString() : "unknown";
            String code = v.getConstraintDescriptor() != null && v.getConstraintDescriptor().getAnnotation() != null
                    ? v.getConstraintDescriptor().getAnnotation().annotationType().getSimpleName() : null;
            errors.add(new ApiError.FieldError(path, v.getMessage(), code));
        }
        ApiError body = ApiError.builder()
                .message("Request validation failed")
                .code("VALIDATION_FAILED")
                .path(request.getRequestURI())
                .timestamp(Instant.now())
                .errors(errors)
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiError> handleRuntimeException(
            RuntimeException ex, HttpServletRequest request) {
        String message = ex.getMessage() != null ? ex.getMessage() : "An unexpected error occurred";
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        if (ex.getMessage() != null && ex.getMessage().toLowerCase().contains("not found")) {
            status = HttpStatus.NOT_FOUND;
        } else if (ex.getMessage() != null && ex.getMessage().contains("Access denied")) {
            status = HttpStatus.FORBIDDEN;
        }
        ApiError body = ApiError.builder()
                .message(message)
                .code("RUNTIME_ERROR")
                .path(request.getRequestURI())
                .timestamp(Instant.now())
                .build();
        return ResponseEntity.status(status).body(body);
    }

    @ExceptionHandler(org.springframework.security.core.userdetails.UsernameNotFoundException.class)
    public ResponseEntity<ApiError> handleUsernameNotFoundException(
            org.springframework.security.core.userdetails.UsernameNotFoundException ex,
            HttpServletRequest request) {
        ApiError body = ApiError.builder()
                .message("User not found")
                .code("USER_NOT_FOUND")
                .path(request.getRequestURI())
                .timestamp(Instant.now())
                .build();
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(org.springframework.security.authentication.BadCredentialsException.class)
    public ResponseEntity<ApiError> handleBadCredentialsException(
            org.springframework.security.authentication.BadCredentialsException ex,
            HttpServletRequest request) {
        ApiError body = ApiError.builder()
                .message("Invalid email or password")
                .code("BAD_CREDENTIALS")
                .path(request.getRequestURI())
                .timestamp(Instant.now())
                .build();
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleException(Exception ex, HttpServletRequest request) {
        logger.error("Unhandled exception (not exposed to client)", ex);
        ApiError body = ApiError.builder()
                .message("An unexpected error occurred")
                .code("INTERNAL_SERVER_ERROR")
                .path(request.getRequestURI())
                .timestamp(Instant.now())
                .build();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
