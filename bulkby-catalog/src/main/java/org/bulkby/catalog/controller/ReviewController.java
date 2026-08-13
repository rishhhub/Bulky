package org.bulkby.catalog.controller;

import org.bulkby.auth.repository.UserRepository;
import org.bulkby.catalog.dto.ReviewDTO;
import org.bulkby.catalog.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/reviews")
public class ReviewController {
    
    @Autowired
    private ReviewService reviewService;
    
    @Autowired
    private UserRepository userRepository;
    
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ReviewDTO>> getReviewsByProductId(@PathVariable("productId") Long productId) {
        List<ReviewDTO> reviews = reviewService.getReviewsByProductId(productId);
        return ResponseEntity.ok(reviews);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ReviewDTO> getReviewById(@PathVariable("id") Long id) {
        ReviewDTO review = reviewService.getReviewById(id);
        return ResponseEntity.ok(review);
    }
    
    @PostMapping
    public ResponseEntity<ReviewDTO> createReview(@Valid @RequestBody ReviewDTO reviewDTO) {
        Long userId = getCurrentUserId();
        ReviewDTO created = reviewService.createReview(reviewDTO, userId);
        return ResponseEntity.ok(created);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ReviewDTO> updateReview(@PathVariable("id") Long id, @Valid @RequestBody ReviewDTO reviewDTO) {
        Long userId = getCurrentUserId();
        ReviewDTO updated = reviewService.updateReview(id, reviewDTO, userId);
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable("id") Long id) {
        Long userId = getCurrentUserId();
        reviewService.deleteReview(id, userId);
        return ResponseEntity.noContent().build();
    }
    
    private Long getCurrentUserId() {
        String contact = getCurrentUserContact();
        if (contact == null) {
            throw new RuntimeException("User not authenticated");
        }
        return userRepository.findByEmailOrPhone(contact)
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
    }
    
    private String getCurrentUserContact() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : null;
    }
}
