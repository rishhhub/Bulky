package org.bulkby.auth.controller;

import org.bulkby.auth.dto.*;
import org.bulkby.auth.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {
    
    @Autowired
    private AuthService authService;

    // @Autowired
    // private RedisRateLimiter otpRateLimiter;
    
    @Value("${spring.profiles.active:dev}")
    private String activeProfile;
    
    private boolean isDevelopment() {
        return "dev".equals(activeProfile) || activeProfile.contains("dev");
    }
    
    private String getClientIdentifier(HttpServletRequest request, String contactValue) {
        // Use contact value as primary identifier, fallback to IP
        if (contactValue != null && !contactValue.trim().isEmpty()) {
            return "contact:" + contactValue.trim().toLowerCase();
        }
        return "ip:" + getClientIpAddress(request);
    }
    
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
    
    @PostMapping("/otp/send")
    public ResponseEntity<Map<String, String>> sendOtp(@Valid @RequestBody SendOtpRequest request, HttpServletRequest httpRequest) {
        // String clientId = getClientIdentifier(httpRequest, request.getContactValue());
        // if (!otpRateLimiter.isAllowed(clientId)) {
        //     Map<String, String> errorResponse = new HashMap<>();
        //     errorResponse.put("message", "Too many requests. Please wait before requesting another OTP.");
        //     errorResponse.put("remainingRequests", String.valueOf(otpRateLimiter.getRemainingRequests(clientId)));
        //     return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(errorResponse);
        // }
        
        String otp = authService.sendRegistrationOtp(request);
        Map<String, String> response = new HashMap<>();
        response.put("message", "OTP sent successfully");
        if (isDevelopment()) {
            response.put("otp", otp);
        }
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/register/otp")
    public ResponseEntity<AuthResponse> registerWithOtp(@Valid @RequestBody OtpRegistrationRequest request) {
        AuthResponse response = authService.registerWithOtp(request);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/login/otp/send")
    public ResponseEntity<Map<String, String>> sendLoginOtp(@Valid @RequestBody SendOtpRequest request, HttpServletRequest httpRequest) {
        // String clientId = getClientIdentifier(httpRequest, request.getContactValue());
        // if (!otpRateLimiter.isAllowed(clientId)) {
        //     Map<String, String> errorResponse = new HashMap<>();
        //     errorResponse.put("message", "Too many requests. Please wait before requesting another OTP.");
        //     errorResponse.put("remainingRequests", String.valueOf(otpRateLimiter.getRemainingRequests(clientId)));
        //     return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(errorResponse);
        // }
        
        String otp = authService.sendLoginOtp(request);
        Map<String, String> response = new HashMap<>();
        response.put("message", "OTP sent successfully");
        if (isDevelopment()) {
            response.put("otp", otp);
        }
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/login/otp")
    public ResponseEntity<AuthResponse> loginWithOtp(@Valid @RequestBody OtpLoginRequest request) {
        AuthResponse response = authService.loginWithOtp(request);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}
