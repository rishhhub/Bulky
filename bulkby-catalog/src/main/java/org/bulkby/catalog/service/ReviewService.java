package org.bulkby.catalog.service;

public interface ReviewService {
    Double getAverageRating(Long productId);
    Long getReviewCount(Long productId);
    java.util.List<org.bulkby.catalog.dto.ReviewDTO> getReviewsByProductId(Long productId);
    org.bulkby.catalog.dto.ReviewDTO getReviewById(Long id);
    org.bulkby.catalog.dto.ReviewDTO createReview(org.bulkby.catalog.dto.ReviewDTO reviewDTO, Long userId);
    org.bulkby.catalog.dto.ReviewDTO updateReview(Long id, org.bulkby.catalog.dto.ReviewDTO reviewDTO, Long userId);
    void deleteReview(Long id, Long userId);
}
