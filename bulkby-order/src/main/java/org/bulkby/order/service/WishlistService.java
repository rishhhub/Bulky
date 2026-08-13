package org.bulkby.order.service;

import org.bulkby.order.dto.WishlistDTO;

import java.util.List;

public interface WishlistService {
    /**
     * Add product to user's wishlist
     * @param userId User ID
     * @param productId Product ID
     * @return WishlistDTO
     */
    WishlistDTO addToWishlist(Long userId, Long productId);
    
    /**
     * Remove product from user's wishlist
     * @param userId User ID
     * @param productId Product ID
     */
    void removeFromWishlist(Long userId, Long productId);
    
    /**
     * Get all wishlist items for a user
     * @param userId User ID
     * @return List of WishlistDTO
     */
    List<WishlistDTO> getUserWishlist(Long userId);
    
    /**
     * Check if product is in user's wishlist
     * @param userId User ID
     * @param productId Product ID
     * @return true if in wishlist, false otherwise
     */
    boolean isInWishlist(Long userId, Long productId);
    
    /**
     * Get users who have product in wishlist and have address in specified city
     * @param productId Product ID
     * @param cityId City ID
     * @return List of user IDs
     */
    List<Long> getWishlistUsersByProductAndCity(Long productId, Long cityId);
    
    /**
     * Mark wishlist item as notified
     * @param userId User ID
     * @param productId Product ID
     */
    void markAsNotified(Long userId, Long productId);
}
