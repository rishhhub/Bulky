package org.bulkby.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserAddressDTO {
    private Long id;
    
    @NotBlank(message = "Label is required")
    @Size(max = 100, message = "Label must not exceed 100 characters")
    private String label;
    
    @NotBlank(message = "Street address is required")
    @Size(max = 200, message = "Street address must not exceed 200 characters")
    private String street;
    
    @NotBlank(message = "City is required")
    @Size(max = 100, message = "City must not exceed 100 characters")
    private String city;
    
    @NotBlank(message = "State is required")
    @Size(max = 100, message = "State must not exceed 100 characters")
    private String state;
    
    @NotBlank(message = "Postal code is required")
    @Pattern(regexp = "^\\d{6}$", message = "Postal code must be exactly 6 digits")
    private String postalCode;
    
    @Size(max = 100, message = "Country must not exceed 100 characters")
    private String country;
    
    private Boolean isDefault;
    
    @Size(max = 100, message = "Recipient name must not exceed 100 characters")
    private String recipientName;
    
    @Size(max = 20, message = "Recipient phone must not exceed 20 characters")
    @Pattern(regexp = "^[\\d\\s\\+\\-\\(\\)]*$", message = "Recipient phone contains invalid characters")
    private String recipientPhone;
    
    private LocalDateTime createdAt;
}
