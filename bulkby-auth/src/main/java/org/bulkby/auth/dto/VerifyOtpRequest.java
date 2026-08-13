package org.bulkby.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.bulkby.auth.model.OtpPurpose;

@Data
public class VerifyOtpRequest {
    
    @NotBlank(message = "Contact value is required")
    private String contactValue;
    
    @NotBlank(message = "OTP is required")
    private String otp;
    
    private OtpPurpose purpose = OtpPurpose.REGISTRATION;
}
