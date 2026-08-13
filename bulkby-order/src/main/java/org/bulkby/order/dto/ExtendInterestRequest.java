package org.bulkby.order.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExtendInterestRequest {
    @NotNull(message = "Period days is required")
    @Positive(message = "Period days must be positive")
    private Integer periodDays;
}
