package org.bulkby.order.controller;

import org.bulkby.order.dto.WishlistDTO;
import org.bulkby.order.service.WishlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/wishlist")
public class WishlistController {
    
    @Autowired
    private WishlistService wishlistService;
    
    @Autowired
    private org.bulkby.auth.repository.UserRepository userRepository;
    
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new RuntimeException("User not authenticated");
        }
        String contact = authentication.getName();
        org.bulkby.auth.model.User user = userRepository.findByEmailOrPhone(contact)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }
    
    @PostMapping
    public ResponseEntity<WishlistDTO> addToWishlist(@RequestParam Long productId) {
        Long userId = getCurrentUserId();
        WishlistDTO wishlist = wishlistService.addToWishlist(userId, productId);
        return ResponseEntity.ok(wishlist);
    }
    
    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> removeFromWishlist(@PathVariable Long productId) {
        Long userId = getCurrentUserId();
        wishlistService.removeFromWishlist(userId, productId);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping
    public ResponseEntity<List<WishlistDTO>> getWishlist() {
        Long userId = getCurrentUserId();
        List<WishlistDTO> wishlist = wishlistService.getUserWishlist(userId);
        return ResponseEntity.ok(wishlist);
    }
    
    @GetMapping("/{productId}")
    public ResponseEntity<Boolean> isInWishlist(@PathVariable Long productId) {
        Long userId = getCurrentUserId();
        boolean inWishlist = wishlistService.isInWishlist(userId, productId);
        return ResponseEntity.ok(inWishlist);
    }
}
