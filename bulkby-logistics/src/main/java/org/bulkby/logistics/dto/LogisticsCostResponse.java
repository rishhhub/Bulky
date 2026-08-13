package org.bulkby.logistics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LogisticsCostResponse {
    private BigDecimal deliveryCost;
    private String calculationDetails;
}
