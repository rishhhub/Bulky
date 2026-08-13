package org.bulkby.catalog.service.impl;

import org.bulkby.auth.service.UserService;
import org.bulkby.catalog.dto.ReviewDTO;
import org.bulkby.catalog.model.Product;
import org.bulkby.catalog.model.Review;
import org.bulkby.catalog.repository.ProductRepository;
import org.bulkby.catalog.repository.ReviewRepository;
import org.bulkby.catalog.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewServiceImpl implements ReviewService {
    
    @Autowired
    private ReviewRepository reviewRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private UserService userService;
    
    private ReviewDTO convertToDTO(Review review) {
        String userName = userService.getUserName(review.getUserId());
        return new ReviewDTO(
                review.getId(),
                review.getProduct().getId(),
                review.getUserId(),
                userName,
                review.getRating(),
                review.getComment(),
                review.getCreatedAt(),
                review.getUpdatedAt()
        );
    }
    
    private Review convertToEntity(ReviewDTO dto, Long userId) {
        Review review = new Review();
        if (dto.getId() != null) {
            review.setId(dto.getId());
        }
        
        Product product = productRepository.findById(dto.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + dto.getProductId()));
        review.setProduct(product);
        
        review.setUserId(userId);
        
        if (dto.getRating() == null || dto.getRating() < 1 || dto.getRating() > 5) {
            throw new RuntimeException("Rating must be between 1 and 5");
        }
        review.setRating(dto.getRating());
        review.setComment(dto.getComment() != null && !dto.getComment().trim().isEmpty() ? dto.getComment().trim() : null);
        
        return review;
    }
    
    @Override
    public List<ReviewDTO> getReviewsByProductId(Long productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public ReviewDTO getReviewById(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found with id: " + id));
        return convertToDTO(review);
    }
    
    @Override
    @Transactional
    public ReviewDTO createReview(ReviewDTO reviewDTO, Long userId) {
        // Check if user already reviewed this product
        reviewRepository.findByProductIdAndUserId(reviewDTO.getProductId(), userId)
                .ifPresent(review -> {
                    throw new RuntimeException("You have already reviewed this product");
                });
        
        Review review = convertToEntity(reviewDTO, userId);
        review = reviewRepository.save(review);
        return convertToDTO(review);
    }
    
    @Override
    @Transactional
    public ReviewDTO updateReview(Long id, ReviewDTO reviewDTO, Long userId) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found with id: " + id));
        
        // Check if user owns this review
        if (!review.getUserId().equals(userId)) {
            throw new RuntimeException("You can only update your own reviews");
        }
        
        if (reviewDTO.getRating() != null) {
            if (reviewDTO.getRating() < 1 || reviewDTO.getRating() > 5) {
                throw new RuntimeException("Rating must be between 1 and 5");
            }
            review.setRating(reviewDTO.getRating());
        }
        
        if (reviewDTO.getComment() != null) {
            review.setComment(reviewDTO.getComment().trim());
        }
        
        review = reviewRepository.save(review);
        return convertToDTO(review);
    }
    
    @Override
    @Transactional
    public void deleteReview(Long id, Long userId) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found with id: " + id));
        
        // Check if user owns this review or is admin
        org.bulkby.auth.model.User user = userService.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!review.getUserId().equals(userId) && user.getRole() != org.bulkby.auth.model.User.Role.ADMIN) {
            throw new RuntimeException("You can only delete your own reviews");
        }
        
        reviewRepository.delete(review);
    }
    
    @Override
    public Double getAverageRating(Long productId) {
        Double avg = reviewRepository.findAverageRatingByProductId(productId);
        // Return null if no reviews exist, so frontend can distinguish between "no reviews" and "0.0 rating"
        return avg != null ? avg : null;
    }
    
    @Override
    public Long getReviewCount(Long productId) {
        return reviewRepository.countByProductId(productId);
    }
}
