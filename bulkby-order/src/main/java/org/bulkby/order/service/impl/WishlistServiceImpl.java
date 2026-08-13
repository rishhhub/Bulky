package org.bulkby.order.service.impl;

import org.bulkby.auth.model.User;
import org.bulkby.auth.model.UserAddress;
import org.bulkby.auth.repository.UserAddressRepository;
import org.bulkby.auth.repository.UserRepository;
import org.bulkby.catalog.dto.ProductDTO;
import org.bulkby.order.dto.WishlistDTO;
import org.bulkby.order.model.Wishlist;
import org.bulkby.order.repository.WishlistRepository;
import org.bulkby.order.service.ResilientProductService;
import org.bulkby.order.service.WishlistService;
import org.bulkby.common.service.PincodeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class WishlistServiceImpl implements WishlistService {
    
    private static final Logger logger = LoggerFactory.getLogger(WishlistServiceImpl.class);
    
    @Autowired
    private WishlistRepository wishlistRepository;
    
    @Autowired
    private ResilientProductService resilientProductService;
    
    @Autowired(required = false)
    private UserAddressRepository userAddressRepository;
    
    @Autowired(required = false)
    private UserRepository userRepository;
    
    @Autowired(required = false)
    private PincodeService pincodeService;
    
    @Override
    @Transactional
    public WishlistDTO addToWishlist(Long userId, Long productId) {
        // Check if already in wishlist
        Optional<Wishlist> existing = wishlistRepository.findByUserIdAndProductId(userId, productId);
        if (existing.isPresent()) {
            return convertToDTO(existing.get());
        }
        
        Wishlist wishlist = new Wishlist();
        wishlist.setUserId(userId);
        wishlist.setProductId(productId);
        wishlist.setCreatedAt(LocalDateTime.now());
        
        wishlist = wishlistRepository.save(wishlist);
        logger.info("Product {} added to wishlist for user {}", productId, userId);
        
        return convertToDTO(wishlist);
    }
    
    @Override
    @Transactional
    public void removeFromWishlist(Long userId, Long productId) {
        wishlistRepository.deleteByUserIdAndProductId(userId, productId);
        logger.info("Product {} removed from wishlist for user {}", productId, userId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<WishlistDTO> getUserWishlist(Long userId) {
        List<Wishlist> wishlists = wishlistRepository.findByUserId(userId);
        return wishlists.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean isInWishlist(Long userId, Long productId) {
        return wishlistRepository.existsByUserIdAndProductId(userId, productId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Long> getWishlistUsersByProductAndCity(Long productId, Long cityId) {
        // Get all wishlists for this product
        List<Wishlist> wishlists = wishlistRepository.findByProductId(productId);
        
        if (wishlists.isEmpty()) {
            return List.of();
        }
        
        // Get all user IDs from wishlists
        Set<Long> wishlistUserIds = wishlists.stream()
                .map(Wishlist::getUserId)
                .collect(Collectors.toSet());
        
        if (wishlistUserIds.isEmpty()) {
            return List.of();
        }
        
        // Filter users who have address in the specified city
        // We need to check user addresses' pincodes and look up their cityId
        if (userAddressRepository == null || pincodeService == null) {
            logger.warn("UserAddressRepository or PincodeService not available, cannot filter by city");
            return List.of();
        }
        
        if (userAddressRepository == null || userRepository == null || pincodeService == null) {
            logger.warn("Required services not available for filtering by city");
            return List.of();
        }
        
        return wishlistUserIds.stream()
                .filter(userId -> {
                    try {
                        // Get user first
                        Optional<User> userOpt = userRepository.findById(userId);
                        if (userOpt.isEmpty()) {
                            return false;
                        }
                        
                        // Get user addresses
                        List<UserAddress> addresses = userAddressRepository.findByUser(userOpt.get());
                        
                        if (addresses == null || addresses.isEmpty()) {
                            return false;
                        }
                        
                        // Check if any address has pincode that maps to target cityId
                        for (UserAddress address : addresses) {
                            if (address.getPostalCode() != null && address.getPostalCode().length() == 6) {
                                try {
                                    org.bulkby.common.dto.PincodeInfo pincodeInfo = 
                                        pincodeService.lookupByPincode(address.getPostalCode());
                                    if (pincodeInfo != null && pincodeInfo.getCityId() != null 
                                        && pincodeInfo.getCityId().equals(cityId)) {
                                        return true;
                                    }
                                } catch (Exception e) {
                                    logger.debug("Error looking up pincode {} for user {}: {}", 
                                        address.getPostalCode(), userId, e.getMessage());
                                }
                            }
                        }
                        return false;
                    } catch (Exception e) {
                        logger.warn("Error checking addresses for user {}: {}", userId, e.getMessage());
                        return false;
                    }
                })
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public void markAsNotified(Long userId, Long productId) {
        Optional<Wishlist> wishlistOpt = wishlistRepository.findByUserIdAndProductId(userId, productId);
        if (wishlistOpt.isPresent()) {
            Wishlist wishlist = wishlistOpt.get();
            wishlist.setNotifiedAt(LocalDateTime.now());
            wishlistRepository.save(wishlist);
        }
    }
    
    private WishlistDTO convertToDTO(Wishlist wishlist) {
        WishlistDTO dto = new WishlistDTO();
        dto.setId(wishlist.getId());
        dto.setUserId(wishlist.getUserId());
        dto.setProductId(wishlist.getProductId());
        dto.setCreatedAt(wishlist.getCreatedAt());
        dto.setNotifiedAt(wishlist.getNotifiedAt());
        
        // Fetch product name
        try {
            ProductDTO product = resilientProductService.getProductById(wishlist.getProductId());
            dto.setProductName(product.getName());
        } catch (Exception e) {
            logger.warn("Failed to fetch product {} for wishlist {}: {}", 
                wishlist.getProductId(), wishlist.getId(), e.getMessage());
            dto.setProductName("Product not found");
        }
        
        return dto;
    }
}
