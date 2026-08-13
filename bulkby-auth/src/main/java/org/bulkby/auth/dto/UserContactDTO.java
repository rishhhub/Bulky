package org.bulkby.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.bulkby.auth.model.ContactType;

import java.time.LocalDateTime;

@Data
public class UserContactDTO {
    private Long id;
    
    @NotNull(message = "Contact type is required")
    private ContactType contactType;
    
    @NotBlank(message = "Contact value is required")
    @Size(max = 100, message = "Contact value must not exceed 100 characters")
    private String value;
    
    private Boolean verified;
    private Boolean isPrimary;
    private LocalDateTime verifiedAt;
    private LocalDateTime createdAt;
}
