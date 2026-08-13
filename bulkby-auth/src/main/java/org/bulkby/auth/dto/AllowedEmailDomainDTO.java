package org.bulkby.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AllowedEmailDomainDTO {
    
    private Long id;
    
    @NotBlank(message = "Domain is required")
    @Size(max = 255, message = "Domain must not exceed 255 characters")
    @Pattern(regexp = "^[a-zA-Z0-9]([a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?)*$", 
             message = "Invalid domain format")
    private String domain; // e.g., "gmail.com", "company.com"
    
    private Boolean active = true;
    
    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
