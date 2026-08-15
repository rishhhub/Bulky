package org.bulkby.auth.service.impl;

import org.bulkby.auth.model.ContactType;
import org.bulkby.auth.model.OtpPurpose;
import org.bulkby.auth.service.OtpService;
import org.springframework.stereotype.Service;

@Service
public class OtpServiceImpl implements OtpService {
    
     private static final String STATIC_OTP = "123456";
    
    @Override
    public String sendOtp(String contactValue, ContactType type, OtpPurpose purpose) {
        // Log to console for debugging purposes
        System.out.println("Static OTP triggered for " + contactValue + " (" + type + "): " + STATIC_OTP);
        
        // Simply return the static number immediately
        return STATIC_OTP;
    }
    
    @Override
    public boolean verifyOtp(String contactValue, String otp, OtpPurpose purpose) {
        // Validate if the input matches our hardcoded string
        return STATIC_OTP.equals(otp);
    }
    
    @Override
    public String resendOtp(String contactValue, OtpPurpose purpose) {
        // Mirror the exact same behavior as sendOtp
        ContactType type = contactValue.contains("@") ? ContactType.EMAIL : ContactType.PHONE;
        return sendOtp(contactValue, type, purpose);
    }
}
