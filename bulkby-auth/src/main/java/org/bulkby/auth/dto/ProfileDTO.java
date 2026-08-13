package org.bulkby.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.bulkby.auth.model.PrimaryContactType;

import java.util.Set;

@Data
public class ProfileDTO {
    private Long id;
    
    @NotBlank(message = "First name is required")
    @Size(max = 50, message = "First name must not exceed 50 characters")
    @Pattern(regexp = "^[a-zA-Z\\s\\-']+$", message = "First name can only contain letters, spaces, hyphens, and apostrophes")
    private String firstName;
    
    @Size(max = 50, message = "Middle name must not exceed 50 characters")
    @Pattern(regexp = "^[a-zA-Z\\s\\-']*$", message = "Middle name can only contain letters, spaces, hyphens, and apostrophes")
    private String middleName; // Nullable
    
    @NotBlank(message = "Last name is required")
    @Size(max = 50, message = "Last name must not exceed 50 characters")
    @Pattern(regexp = "^[a-zA-Z\\s\\-']+$", message = "Last name can only contain letters, spaces, hyphens, and apostrophes")
    private String lastName;
    
    private String email;
    private String phone;
    private PrimaryContactType primaryContactType;
    private Set<String> loginMethods; // OTP, PASSWORD
}
