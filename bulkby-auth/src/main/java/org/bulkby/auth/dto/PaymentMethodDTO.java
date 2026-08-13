package org.bulkby.auth.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;
import org.bulkby.auth.model.PaymentMethodType;

import java.time.LocalDateTime;

@Data
public class PaymentMethodDTO {
    private Long id;
    private PaymentMethodType type;
    private String provider;
    private String lastFourDigits;
    private String upiId;
    private String cardExpiry;
    private Boolean isDefault;
    
    @Size(max = 500, message = "Metadata must not exceed 500 characters")
    private String metadata;
    
    private LocalDateTime createdAt;
}
