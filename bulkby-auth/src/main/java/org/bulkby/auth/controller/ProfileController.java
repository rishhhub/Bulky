package org.bulkby.auth.controller;

import org.bulkby.auth.dto.*;
import org.bulkby.auth.model.ContactType;
import org.bulkby.auth.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/profile")
public class ProfileController {
    
    @Autowired
    private ProfileService profileService;

    @Autowired
    private org.bulkby.auth.util.RedisRateLimiter otpRateLimiter;
    
    @Value("${spring.profiles.active:dev}")
    private String activeProfile;
    
    private boolean isDevelopment() {
        return "dev".equals(activeProfile) || activeProfile.contains("dev");
    }
    
    @GetMapping
    public ResponseEntity<ProfileDTO> getProfile() {
        ProfileDTO profile = profileService.getProfile();
        return ResponseEntity.ok(profile);
    }
    
    @PutMapping
    public ResponseEntity<ProfileDTO> updateProfile(@Valid @RequestBody ProfileDTO profileDTO) {
        ProfileDTO updated = profileService.updateProfile(profileDTO);
        return ResponseEntity.ok(updated);
    }
    
    @GetMapping("/contacts")
    public ResponseEntity<List<UserContactDTO>> getContacts() {
        List<UserContactDTO> contacts = profileService.getContacts();
        return ResponseEntity.ok(contacts);
    }
    
    @PostMapping("/contacts/otp/send")
    public ResponseEntity<Map<String, String>> sendContactOtp(
            @RequestParam String contactValue,
            @RequestParam ContactType contactType,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        String clientId = "contact:" + contactValue.trim().toLowerCase();
        if (!otpRateLimiter.isAllowed(clientId)) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "Too many requests. Please wait before requesting another OTP.");
            errorResponse.put("remainingRequests", String.valueOf(otpRateLimiter.getRemainingRequests(clientId)));
            return ResponseEntity.status(org.springframework.http.HttpStatus.TOO_MANY_REQUESTS).body(errorResponse);
        }
        
        String otp = profileService.sendContactOtp(contactValue, contactType);
        Map<String, String> response = new HashMap<>();
        response.put("message", "OTP sent successfully");
        if (isDevelopment()) {
            response.put("otp", otp);
        }
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/contacts/otp/verify")
    public ResponseEntity<Map<String, Boolean>> verifyContactOtp(
            @RequestParam String contactValue,
            @RequestParam String otp) {
        boolean verified = profileService.verifyContactOtp(contactValue, otp);
        return ResponseEntity.ok(Map.of("verified", verified));
    }
    
    @PostMapping("/contacts")
    public ResponseEntity<UserContactDTO> addContact(@Valid @RequestBody UserContactDTO contactDTO) {
        UserContactDTO added = profileService.addContact(contactDTO);
        return ResponseEntity.ok(added);
    }
    
    @PutMapping("/contacts/{id}")
    public ResponseEntity<UserContactDTO> updateContact(
            @PathVariable Long id,
            @Valid @RequestBody UserContactDTO contactDTO) {
        UserContactDTO updated = profileService.updateContact(id, contactDTO);
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/contacts/{id}")
    public ResponseEntity<Void> deleteContact(@PathVariable Long id) {
        profileService.deleteContact(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/addresses")
    public ResponseEntity<List<UserAddressDTO>> getAddresses() {
        List<UserAddressDTO> addresses = profileService.getAddresses();
        return ResponseEntity.ok(addresses);
    }
    
    @PostMapping("/addresses")
    public ResponseEntity<UserAddressDTO> addAddress(@Valid @RequestBody UserAddressDTO addressDTO) {
        UserAddressDTO added = profileService.addAddress(addressDTO);
        return ResponseEntity.ok(added);
    }
    
    @PutMapping("/addresses/{id}")
    public ResponseEntity<UserAddressDTO> updateAddress(
            @PathVariable Long id,
            @Valid @RequestBody UserAddressDTO addressDTO) {
        UserAddressDTO updated = profileService.updateAddress(id, addressDTO);
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/addresses/{id}")
    public ResponseEntity<Void> deleteAddress(@PathVariable Long id) {
        profileService.deleteAddress(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/payment-methods")
    public ResponseEntity<List<PaymentMethodDTO>> getPaymentMethods() {
        List<PaymentMethodDTO> paymentMethods = profileService.getPaymentMethods();
        return ResponseEntity.ok(paymentMethods);
    }
    
    @PostMapping("/payment-methods")
    public ResponseEntity<PaymentMethodDTO> addPaymentMethod(@Valid @RequestBody PaymentMethodDTO paymentMethodDTO) {
        PaymentMethodDTO added = profileService.addPaymentMethod(paymentMethodDTO);
        return ResponseEntity.ok(added);
    }
    
    @PutMapping("/payment-methods/{id}")
    public ResponseEntity<PaymentMethodDTO> updatePaymentMethod(
            @PathVariable Long id,
            @Valid @RequestBody PaymentMethodDTO paymentMethodDTO) {
        PaymentMethodDTO updated = profileService.updatePaymentMethod(id, paymentMethodDTO);
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/payment-methods/{id}")
    public ResponseEntity<Void> deletePaymentMethod(@PathVariable Long id) {
        profileService.deletePaymentMethod(id);
        return ResponseEntity.noContent().build();
    }
    
    @PutMapping("/login-methods")
    public ResponseEntity<Void> updateLoginMethods(@Valid @RequestBody UpdateLoginMethodsRequest request) {
        profileService.updateLoginMethods(request);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/password")
    public ResponseEntity<Void> setPassword(@Valid @RequestBody SetPasswordRequest request) {
        profileService.setPassword(request);
        return ResponseEntity.ok().build();
    }
}
