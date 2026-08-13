package org.bulkby.auth.service;

import org.bulkby.auth.dto.*;
import org.bulkby.auth.model.*;
import org.bulkby.auth.repository.UserRepository;
import org.bulkby.auth.service.OtpService;
import org.bulkby.common.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private OtpService otpService;
    
    @Autowired
    private org.bulkby.auth.service.AllowedEmailDomainService allowedEmailDomainService;
    
    public String sendRegistrationOtp(SendOtpRequest request) {
        // Determine contact type if not provided
        ContactType contactType = request.getContactType();
        if (contactType == null) {
            contactType = request.getContactValue().contains("@") ? ContactType.EMAIL : ContactType.PHONE;
        }
        
        // Check if contact already exists
        if (contactType == ContactType.EMAIL) {
            // Validate email domain
            if (!allowedEmailDomainService.isEmailDomainAllowed(request.getContactValue())) {
                throw new RuntimeException("Email domain is not allowed for registration");
            }
            
            if (userRepository.existsByEmail(request.getContactValue())) {
                throw new RuntimeException("Email already registered");
            }
        } else {
            // Validate phone number format - exactly 10 digits, must start with 6, 7, 8, or 9
            String phone = request.getContactValue().trim().replaceAll("[\\s\\-\\(\\)]", "");
            if (!phone.matches("^[6-9]\\d{9}$")) {
                throw new RuntimeException("Phone number must be exactly 10 digits and start with 6, 7, 8, or 9");
            }
            
            if (userRepository.existsByPhone(phone)) {
                throw new RuntimeException("Phone number already registered");
            }
        }
        
        // Send OTP
        return otpService.sendOtp(request.getContactValue(), contactType, request.getPurpose());
    }
    
    @Transactional
    public AuthResponse registerWithOtp(OtpRegistrationRequest request) {
        // Determine contact type if not provided
        ContactType contactType = request.getContactType();
        if (contactType == null) {
            contactType = request.getContactValue().contains("@") ? ContactType.EMAIL : ContactType.PHONE;
        }
        
        // Verify OTP
        if (!otpService.verifyOtp(request.getContactValue(), request.getOtp(), OtpPurpose.REGISTRATION)) {
            throw new RuntimeException("Invalid or expired OTP");
        }
        
        // Check if user already exists
        String contactValue = request.getContactValue();
        if (contactType == ContactType.EMAIL) {
            // Validate email domain
            if (!allowedEmailDomainService.isEmailDomainAllowed(contactValue)) {
                throw new RuntimeException("Email domain is not allowed for registration");
            }
            
            if (userRepository.existsByEmail(contactValue)) {
                throw new RuntimeException("Email already registered");
            }
        } else {
            // Validate and normalize phone number format - exactly 10 digits, must start with 6, 7, 8, or 9
            String phone = contactValue.trim().replaceAll("[\\s\\-\\(\\)]", "");
            if (!phone.matches("^[6-9]\\d{9}$")) {
                throw new RuntimeException("Phone number must be exactly 10 digits and start with 6, 7, 8, or 9");
            }
            contactValue = phone; // Use normalized phone number
            
            if (userRepository.existsByPhone(contactValue)) {
                throw new RuntimeException("Phone number already registered");
            }
        }
        
        // Create user
        User user = new User();
        user.setFirstName(sanitizeName(request.getFirstName()));
        user.setMiddleName(request.getMiddleName() != null && !request.getMiddleName().trim().isEmpty() 
            ? sanitizeName(request.getMiddleName()) : null);
        user.setLastName(sanitizeName(request.getLastName()));
        user.setPrimaryContactType(contactType == ContactType.EMAIL ? PrimaryContactType.EMAIL : PrimaryContactType.PHONE);
        
        if (contactType == ContactType.EMAIL) {
            user.setEmail(contactValue);
            user.setPhone(null);
        } else {
            user.setPhone(contactValue);
            user.setEmail(null);
        }
        
        // Set default login method to OTP
        Set<LoginMethod> loginMethods = new HashSet<>();
        loginMethods.add(LoginMethod.OTP);
        user.setLoginMethods(loginMethods);
        
        user.setPasswordHash(null); // No password for OTP-only users
        user.setRole(User.Role.USER);
        user.setEnabled(true);
        
        user = userRepository.save(user);
        
        // Generate JWT token using primary contact
        String primaryContact = user.getEmail() != null ? user.getEmail() : user.getPhone();
        String token = jwtUtil.generateToken(primaryContact, user.getRole().name());
        
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getPhone(), 
            user.getFirstName(), user.getMiddleName(), user.getLastName(), 
            user.getFullName(), user.getRole().name());
    }
    
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Validate email domain
        if (!allowedEmailDomainService.isEmailDomainAllowed(request.getEmail())) {
            throw new RuntimeException("Email domain is not allowed for registration");
        }
        
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(sanitizeName(request.getFirstName()));
        user.setMiddleName(request.getMiddleName() != null && !request.getMiddleName().trim().isEmpty() 
            ? sanitizeName(request.getMiddleName()) : null);
        user.setLastName(sanitizeName(request.getLastName()));
        user.setPrimaryContactType(PrimaryContactType.EMAIL);
        
        // Set login methods
        Set<LoginMethod> loginMethods = new HashSet<>();
        loginMethods.add(LoginMethod.PASSWORD);
        user.setLoginMethods(loginMethods);
        
        user.setRole(User.Role.USER);
        user.setEnabled(true);
        
        user = userRepository.save(user);
        
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getPhone(), 
            user.getFirstName(), user.getMiddleName(), user.getLastName(), 
            user.getFullName(), user.getRole().name());
    }
    
    public String sendLoginOtp(SendOtpRequest request) {
        // Determine contact type if not provided
        ContactType contactType = request.getContactType();
        if (contactType == null) {
            contactType = request.getContactValue().contains("@") ? ContactType.EMAIL : ContactType.PHONE;
        }
        
        // Check if user exists
        User user = userRepository.findByEmailOrPhone(request.getContactValue())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if user has OTP login enabled
        if (!user.getLoginMethods().contains(LoginMethod.OTP)) {
            throw new RuntimeException("OTP login is not enabled for this account");
        }
        
        // Send OTP
        return otpService.sendOtp(request.getContactValue(), contactType, OtpPurpose.LOGIN);
    }
    
    public AuthResponse loginWithOtp(OtpLoginRequest request) {
        // Determine contact type if not provided
        ContactType contactType = request.getContactType();
        if (contactType == null) {
            contactType = request.getContactValue().contains("@") ? ContactType.EMAIL : ContactType.PHONE;
        }
        
        // Verify OTP
        if (!otpService.verifyOtp(request.getContactValue(), request.getOtp(), OtpPurpose.LOGIN)) {
            throw new RuntimeException("Invalid or expired OTP");
        }
        
        // Find user
        User user = userRepository.findByEmailOrPhone(request.getContactValue())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!user.getEnabled()) {
            throw new RuntimeException("User account is disabled");
        }
        
        // Generate JWT token
        String primaryContact = user.getEmail() != null ? user.getEmail() : user.getPhone();
        String token = jwtUtil.generateToken(primaryContact, user.getRole().name());
        
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getPhone(), 
            user.getFirstName(), user.getMiddleName(), user.getLastName(), 
            user.getFullName(), user.getRole().name());
    }
    
    public AuthResponse login(LoginRequest request) {
        // Password login requires email
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getPhone(), 
            user.getFirstName(), user.getMiddleName(), user.getLastName(), 
            user.getFullName(), user.getRole().name());
    }
    
    /**
     * Sanitizes name input to prevent XSS while allowing valid name characters.
     * Allows letters, spaces, hyphens, and apostrophes only.
     */
    private String sanitizeName(String name) {
        if (name == null) {
            return null;
        }
        // Remove any HTML/script tags
        String sanitized = name.trim();
        sanitized = sanitized.replaceAll("<[^>]*>", "");
        // Remove any characters that aren't letters, spaces, hyphens, or apostrophes
        sanitized = sanitized.replaceAll("[^a-zA-Z\\s\\-']", "");
        // Limit length
        if (sanitized.length() > 50) {
            sanitized = sanitized.substring(0, 50);
        }
        return sanitized.trim();
    }
}
