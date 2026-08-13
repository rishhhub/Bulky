package org.bulkby.auth.service;

import org.bulkby.auth.model.ContactType;
import org.bulkby.auth.model.OtpPurpose;

public interface OtpService {
    
    /**
     * Send OTP to the specified contact (email or phone)
     * @param contactValue Email address or phone number
     * @param type Contact type (EMAIL or PHONE)
     * @param purpose Purpose of OTP (REGISTRATION, LOGIN, etc.)
     * @return The generated OTP (for mock/testing purposes)
     */
    String sendOtp(String contactValue, ContactType type, OtpPurpose purpose);
    
    /**
     * Verify OTP for the specified contact
     * @param contactValue Email address or phone number
     * @param otp The OTP to verify
     * @param purpose Purpose of OTP
     * @return true if OTP is valid and not expired, false otherwise
     */
    boolean verifyOtp(String contactValue, String otp, OtpPurpose purpose);
    
    /**
     * Resend OTP to the specified contact
     * @param contactValue Email address or phone number
     * @param purpose Purpose of OTP
     * @return The generated OTP (for mock/testing purposes)
     */
    String resendOtp(String contactValue, OtpPurpose purpose);
}
