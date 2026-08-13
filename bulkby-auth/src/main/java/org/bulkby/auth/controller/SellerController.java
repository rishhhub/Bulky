package org.bulkby.auth.controller;

import org.bulkby.auth.dto.SellerProfileDTO;
import org.bulkby.auth.dto.SellerStatusDTO;
import org.bulkby.auth.service.ProfileService;
import org.bulkby.auth.service.SellerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/seller")
public class SellerController {
    
    @Autowired
    private SellerService sellerService;
    
    @Autowired
    private ProfileService profileService;
    
    /**
     * Register current user as a seller
     * Accessible to all authenticated users (USER role) - handled by SecurityConfig
     */
    @PostMapping("/register")
    public ResponseEntity<SellerProfileDTO> registerAsSeller(@Valid @RequestBody SellerProfileDTO sellerProfileDTO) {
        Long userId = profileService.getCurrentUser().getId();
        SellerProfileDTO created = sellerService.registerAsSeller(userId, sellerProfileDTO);
        return ResponseEntity.ok(created);
    }
    
    /**
     * Get seller profile for current user
     */
    @GetMapping("/profile")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<SellerProfileDTO> getSellerProfile() {
        Long userId = profileService.getCurrentUser().getId();
        SellerProfileDTO profile = sellerService.getSellerProfile(userId);
        return ResponseEntity.ok(profile);
    }
    
    /**
     * Update seller profile for current user
     */
    @PutMapping("/profile")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<SellerProfileDTO> updateSellerProfile(@Valid @RequestBody SellerProfileDTO sellerProfileDTO) {
        Long userId = profileService.getCurrentUser().getId();
        SellerProfileDTO updated = sellerService.updateSellerProfile(userId, sellerProfileDTO);
        return ResponseEntity.ok(updated);
    }
    
    /**
     * Get seller status for current user
     */
    @GetMapping("/status")
    public ResponseEntity<SellerStatusDTO> getSellerStatus() {
        Long userId = profileService.getCurrentUser().getId();
        SellerStatusDTO status = sellerService.getSellerStatus(userId);
        return ResponseEntity.ok(status);
    }
}
