package org.bulkby.auth.service.impl;

import org.bulkby.auth.model.ContactType;
import org.bulkby.auth.model.OtpPurpose;
import org.bulkby.auth.model.OtpVerification;
import org.bulkby.auth.repository.OtpVerificationRepository;
import org.bulkby.auth.service.OtpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
public class OtpServiceImpl implements OtpService {
    
    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int MAX_ATTEMPTS = 3;
    private static final int RATE_LIMIT_MINUTES = 15;
    private static final int MAX_REQUESTS_PER_WINDOW = 3;
    
    @Autowired
    private RedisTemplate<String, String> redisTemplate;
    
    @Autowired
    private OtpVerificationRepository otpVerificationRepository;
    
    private final SecureRandom random = new SecureRandom();
    
    @Override
    public String sendOtp(String contactValue, ContactType type, OtpPurpose purpose) {
        // Rate limiting check
        String rateLimitKey = "otp:ratelimit:" + contactValue + ":" + purpose;
        String requestCount = redisTemplate.opsForValue().get(rateLimitKey);
        
        if (requestCount != null && Integer.parseInt(requestCount) >= MAX_REQUESTS_PER_WINDOW) {
            throw new RuntimeException("Too many OTP requests. Please try again after " + RATE_LIMIT_MINUTES + " minutes.");
        }
        
        // Invalidate all previous unverified OTPs for this contact and purpose
        // This prevents multiple active OTPs from existing simultaneously
        LocalDateTime now = LocalDateTime.now();
        List<OtpVerification> previousOtps = otpVerificationRepository
                .findAllByContactValueAndPurposeAndVerifiedFalseAndExpiresAtAfter(contactValue, purpose, now);
        for (OtpVerification prevOtp : previousOtps) {
            // Mark as expired by setting expiresAt to past
            prevOtp.setExpiresAt(now.minusMinutes(1));
            otpVerificationRepository.save(prevOtp);
        }
        
        // Generate OTP
        String otp = generateOtp();
        
        // Store in Redis with expiry (this overwrites any previous OTP)
        String redisKey = "otp:" + contactValue + ":" + purpose;
        redisTemplate.opsForValue().set(redisKey, otp, OTP_EXPIRY_MINUTES, TimeUnit.MINUTES);
        
        // Store attempts counter (reset for new OTP)
        String attemptsKey = "otp:attempts:" + contactValue + ":" + purpose;
        redisTemplate.opsForValue().set(attemptsKey, "0", OTP_EXPIRY_MINUTES, TimeUnit.MINUTES);
        
        // Update rate limit counter
        Long currentCount = redisTemplate.opsForValue().increment(rateLimitKey);
        if (currentCount == 1) {
            redisTemplate.expire(rateLimitKey, RATE_LIMIT_MINUTES, TimeUnit.MINUTES);
        }
        
        // Save to database for audit trail
        OtpVerification verification = new OtpVerification();
        verification.setContactValue(contactValue);
        verification.setOtp(otp); // In production, store hash instead
        verification.setPurpose(purpose);
        verification.setExpiresAt(now.plusMinutes(OTP_EXPIRY_MINUTES));
        verification.setVerified(false);
        verification.setAttempts(0);
        otpVerificationRepository.save(verification);
        
        // Mock: Print OTP to console (for development)
        System.out.println("OTP for " + contactValue + " (" + type + "): " + otp);
        
        return otp; // Return for testing purposes
    }
    
    @Override
    public boolean verifyOtp(String contactValue, String otp, OtpPurpose purpose) {
        String redisKey = "otp:" + contactValue + ":" + purpose;
        String storedOtp = redisTemplate.opsForValue().get(redisKey);
        
        if (storedOtp == null) {
            return false; // OTP expired or doesn't exist
        }
        
        // Check attempts
        String attemptsKey = "otp:attempts:" + contactValue + ":" + purpose;
        String attemptsStr = redisTemplate.opsForValue().get(attemptsKey);
        int attempts = attemptsStr != null ? Integer.parseInt(attemptsStr) : 0;
        
        if (attempts >= MAX_ATTEMPTS) {
            throw new RuntimeException("Maximum OTP verification attempts exceeded. Please request a new OTP.");
        }
        
        // Increment attempts
        redisTemplate.opsForValue().increment(attemptsKey);
        
        if (!storedOtp.equals(otp)) {
            return false;
        }
        
        // OTP verified successfully - remove from Redis
        redisTemplate.delete(redisKey);
        redisTemplate.delete(attemptsKey);
        
        // Update database record - get the most recent unverified OTP
        // After our fix, there should only be one active OTP, but we'll handle multiple gracefully
        Optional<OtpVerification> verificationOpt = otpVerificationRepository
                .findFirstByContactValueAndPurposeAndVerifiedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
                        contactValue, purpose, LocalDateTime.now());
        
        if (verificationOpt.isPresent()) {
            OtpVerification verification = verificationOpt.get();
            verification.setVerified(true);
            otpVerificationRepository.save(verification);
        }
        
        return true;
    }
    
    @Override
    public String resendOtp(String contactValue, OtpPurpose purpose) {
        // Delete existing OTP
        String redisKey = "otp:" + contactValue + ":" + purpose;
        redisTemplate.delete(redisKey);
        redisTemplate.delete("otp:attempts:" + contactValue + ":" + purpose);
        
        // Send new OTP
        ContactType type = contactValue.contains("@") ? ContactType.EMAIL : ContactType.PHONE;
        return sendOtp(contactValue, type, purpose);
    }
    
    private String generateOtp() {
        StringBuilder otp = new StringBuilder(OTP_LENGTH);
        for (int i = 0; i < OTP_LENGTH; i++) {
            otp.append(random.nextInt(10));
        }
        return otp.toString();
    }
}
