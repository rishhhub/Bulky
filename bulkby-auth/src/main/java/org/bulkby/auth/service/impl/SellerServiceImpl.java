package org.bulkby.auth.service.impl;

import org.bulkby.auth.dto.SellerProfileDTO;
import org.bulkby.auth.dto.SellerStatusDTO;
import org.bulkby.auth.model.SellerProfile;
import org.bulkby.auth.model.User;
import org.bulkby.auth.repository.SellerProfileRepository;
import org.bulkby.auth.repository.UserRepository;
import org.bulkby.auth.service.SellerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SellerServiceImpl implements SellerService {
    
    @Autowired
    private SellerProfileRepository sellerProfileRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Override
    @Transactional
    public SellerProfileDTO registerAsSeller(Long userId, SellerProfileDTO sellerProfileDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if user already has a seller profile
        if (sellerProfileRepository.findByUser(user).isPresent()) {
            throw new RuntimeException("User is already registered as a seller");
        }
        
        // Validate PAN if provided
        if (sellerProfileDTO.getPanNumber() != null && !sellerProfileDTO.getPanNumber().trim().isEmpty()) {
            if (sellerProfileRepository.existsByPanNumber(sellerProfileDTO.getPanNumber())) {
                throw new RuntimeException("PAN number already registered");
            }
        }
        
        // Validate GSTIN if provided
        if (sellerProfileDTO.getGstin() != null && !sellerProfileDTO.getGstin().trim().isEmpty()) {
            if (sellerProfileRepository.existsByGstin(sellerProfileDTO.getGstin())) {
                throw new RuntimeException("GSTIN already registered");
            }
        }
        
        // Create seller profile
        SellerProfile sellerProfile = new SellerProfile();
        sellerProfile.setUser(user);
        sellerProfile.setCompanyName(sellerProfileDTO.getCompanyName());
        sellerProfile.setCompanyAddress(sellerProfileDTO.getCompanyAddress());
        sellerProfile.setPanNumber(sellerProfileDTO.getPanNumber());
        sellerProfile.setGstin(sellerProfileDTO.getGstin());
        sellerProfile.setProfileStatus(SellerProfile.ProfileStatus.PENDING);
        
        sellerProfile = sellerProfileRepository.save(sellerProfile);
        
        // Update user role to SELLER
        user.setRole(User.Role.SELLER);
        userRepository.save(user);
        
        return convertToDTO(sellerProfile);
    }
    
    @Override
    @Transactional(readOnly = true)
    public SellerProfileDTO getSellerProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        SellerProfile sellerProfile = sellerProfileRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Seller profile not found"));
        
        return convertToDTO(sellerProfile);
    }
    
    @Override
    @Transactional
    public SellerProfileDTO updateSellerProfile(Long userId, SellerProfileDTO sellerProfileDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        SellerProfile sellerProfile = sellerProfileRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Seller profile not found"));
        
        // Don't allow updates if already approved (unless admin)
        if (sellerProfile.getProfileStatus() == SellerProfile.ProfileStatus.APPROVED) {
            throw new RuntimeException("Cannot update approved seller profile. Contact admin for changes.");
        }
        
        // Update fields
        if (sellerProfileDTO.getCompanyName() != null) {
            sellerProfile.setCompanyName(sellerProfileDTO.getCompanyName());
        }
        if (sellerProfileDTO.getCompanyAddress() != null) {
            sellerProfile.setCompanyAddress(sellerProfileDTO.getCompanyAddress());
        }
        
        // Validate and update PAN
        if (sellerProfileDTO.getPanNumber() != null && !sellerProfileDTO.getPanNumber().trim().isEmpty()) {
            if (!sellerProfileDTO.getPanNumber().equals(sellerProfile.getPanNumber()) &&
                sellerProfileRepository.existsByPanNumber(sellerProfileDTO.getPanNumber())) {
                throw new RuntimeException("PAN number already registered");
            }
            sellerProfile.setPanNumber(sellerProfileDTO.getPanNumber());
        }
        
        // Validate and update GSTIN
        if (sellerProfileDTO.getGstin() != null && !sellerProfileDTO.getGstin().trim().isEmpty()) {
            if (!sellerProfileDTO.getGstin().equals(sellerProfile.getGstin()) &&
                sellerProfileRepository.existsByGstin(sellerProfileDTO.getGstin())) {
                throw new RuntimeException("GSTIN already registered");
            }
            sellerProfile.setGstin(sellerProfileDTO.getGstin());
        }
        
        sellerProfile = sellerProfileRepository.save(sellerProfile);
        
        return convertToDTO(sellerProfile);
    }
    
    @Override
    @Transactional(readOnly = true)
    public SellerStatusDTO getSellerStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        boolean isSeller = user.getRole() == User.Role.SELLER;
        SellerStatusDTO statusDTO = new SellerStatusDTO();
        statusDTO.setSeller(isSeller);
        
        if (isSeller) {
            SellerProfile sellerProfile = sellerProfileRepository.findByUser(user).orElse(null);
            if (sellerProfile != null) {
                statusDTO.setProfileStatus(sellerProfile.getProfileStatus());
                statusDTO.setProfileComplete(isProfileComplete(userId));
            } else {
                statusDTO.setProfileStatus(null);
                statusDTO.setProfileComplete(false);
            }
        } else {
            statusDTO.setProfileStatus(null);
            statusDTO.setProfileComplete(false);
        }
        
        return statusDTO;
    }
    
    @Override
    @Transactional
    public SellerProfileDTO approveSeller(Long sellerId, Long adminId) {
        SellerProfile sellerProfile = sellerProfileRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Seller profile not found"));
        
        if (sellerProfile.getProfileStatus() == SellerProfile.ProfileStatus.APPROVED) {
            throw new RuntimeException("Seller profile is already approved");
        }
        
        sellerProfile.setProfileStatus(SellerProfile.ProfileStatus.APPROVED);
        sellerProfile.setApprovedAt(LocalDateTime.now());
        sellerProfile.setRejectedAt(null);
        sellerProfile.setRejectionReason(null);
        
        sellerProfile = sellerProfileRepository.save(sellerProfile);
        sellerProfileRepository.flush(); // Ensure changes are persisted immediately
        
        return convertToDTO(sellerProfile);
    }
    
    @Override
    @Transactional
    public SellerProfileDTO rejectSeller(Long sellerId, Long adminId, String rejectionReason) {
        SellerProfile sellerProfile = sellerProfileRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Seller profile not found"));
        
        sellerProfile.setProfileStatus(SellerProfile.ProfileStatus.REJECTED);
        sellerProfile.setRejectedAt(LocalDateTime.now());
        sellerProfile.setRejectionReason(rejectionReason);
        sellerProfile.setApprovedAt(null);
        
        sellerProfile = sellerProfileRepository.save(sellerProfile);
        
        return convertToDTO(sellerProfile);
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean isProfileComplete(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        SellerProfile sellerProfile = sellerProfileRepository.findByUser(user).orElse(null);
        if (sellerProfile == null) {
            return false;
        }
        
        // Profile is complete if company name, PAN, and GSTIN are all provided
        return sellerProfile.getCompanyName() != null && !sellerProfile.getCompanyName().trim().isEmpty() &&
               sellerProfile.getPanNumber() != null && !sellerProfile.getPanNumber().trim().isEmpty() &&
               sellerProfile.getGstin() != null && !sellerProfile.getGstin().trim().isEmpty();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SellerProfileDTO> getAllSellers() {
        List<User> sellers = userRepository.findByRole(User.Role.SELLER);
        return sellers.stream()
                .map(seller -> {
                    SellerProfile profile = sellerProfileRepository.findByUser(seller).orElse(null);
                    if (profile != null) {
                        return convertToDTO(profile);
                    }
                    return null;
                })
                .filter(profile -> profile != null)
                .collect(Collectors.toList());
    }
    
    private SellerProfileDTO convertToDTO(SellerProfile sellerProfile) {
        SellerProfileDTO dto = new SellerProfileDTO();
        dto.setId(sellerProfile.getId());
        dto.setUserId(sellerProfile.getUser().getId());
        dto.setCompanyName(sellerProfile.getCompanyName());
        dto.setCompanyAddress(sellerProfile.getCompanyAddress());
        dto.setPanNumber(sellerProfile.getPanNumber());
        dto.setGstin(sellerProfile.getGstin());
        dto.setProfileStatus(sellerProfile.getProfileStatus());
        dto.setCreatedAt(sellerProfile.getCreatedAt());
        dto.setUpdatedAt(sellerProfile.getUpdatedAt());
        dto.setApprovedAt(sellerProfile.getApprovedAt());
        dto.setRejectedAt(sellerProfile.getRejectedAt());
        dto.setRejectionReason(sellerProfile.getRejectionReason());
        return dto;
    }
}
