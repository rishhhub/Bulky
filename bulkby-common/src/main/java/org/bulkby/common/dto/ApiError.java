package org.bulkby.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Standard API error response body. Used by global exception handlers
 * so clients receive a consistent JSON shape (e.g. message, code, path, timestamp).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiError {
    private String message;
    private String code;
    private String path;
    private Instant timestamp;
    /** Optional; used for validation errors (field-level messages). */
    private List<FieldError> errors;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FieldError {
        private String field;
        private String message;
        private String code;
    }
}
