package org.bulkby.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import org.bulkby.auth.model.ContactType;
import org.bulkby.auth.model.OtpPurpose;

@Data
public class SendOtpRequest {
    
    @NotBlank(message = "Contact value is required")
    @Pattern(regexp = "^(?:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}|\\+?[1-9]\\d{1,14})$", 
             message = "Invalid email or phone number format")
    private String contactValue; // Email or phone
    
    private ContactType contactType; // EMAIL or PHONE
    
    private OtpPurpose purpose = OtpPurpose.REGISTRATION; // Default to REGISTRATION
}
