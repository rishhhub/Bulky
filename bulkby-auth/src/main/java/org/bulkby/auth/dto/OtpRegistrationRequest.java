package org.bulkby.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.bulkby.auth.model.ContactType;

@Data
public class OtpRegistrationRequest {
    
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
    
    @NotBlank(message = "Contact value is required")
    @Pattern(regexp = "^(?:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}|\\+?[1-9]\\d{1,14})$", 
             message = "Invalid email or phone number format")
    private String contactValue; // Email or phone
    
    private ContactType contactType; // EMAIL or PHONE
    
    @NotBlank(message = "OTP is required")
    private String otp;
}
