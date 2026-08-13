package org.bulkby.auth.service;

import org.bulkby.auth.dto.SellerProfileDTO;
import org.bulkby.auth.dto.SellerStatusDTO;
import org.bulkby.auth.model.SellerProfile;
import org.bulkby.auth.model.User;

import java.util.List;

public interface SellerService {
    
    /**
     * Register a user as a seller
     * Creates seller profile and updates user role to SELLER
     */
    SellerProfileDTO registerAsSeller(Long userId, SellerProfileDTO sellerProfileDTO);
    
    /**
     * Get seller profile for current user
     */
    SellerProfileDTO getSellerProfile(Long userId);
    
    /**
     * Update seller profile
     */
    SellerProfileDTO updateSellerProfile(Long userId, SellerProfileDTO sellerProfileDTO);
    
    /**
     * Check if user is a seller and get status
     */
    SellerStatusDTO getSellerStatus(Long userId);
    
    /**
     * Approve seller profile (admin only)
     */
    SellerProfileDTO approveSeller(Long sellerId, Long adminId);
    
    /**
     * Reject seller profile (admin only)
     */
    SellerProfileDTO rejectSeller(Long sellerId, Long adminId, String rejectionReason);
    
    /**
     * Check if seller profile is complete (has company, PAN, GSTIN)
     */
    boolean isProfileComplete(Long userId);
    
    /**
     * Get all sellers (admin only)
     */
    List<SellerProfileDTO> getAllSellers();
}
