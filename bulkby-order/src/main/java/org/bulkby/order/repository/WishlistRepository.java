package org.bulkby.order.repository;

import org.bulkby.order.model.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    
    Optional<Wishlist> findByUserIdAndProductId(Long userId, Long productId);
    
    List<Wishlist> findByUserId(Long userId);
    
    List<Wishlist> findByProductId(Long productId);
    
    // Note: This query will be used in service layer with pincode lookup
    // We'll get wishlists by productId and filter by cityId in service
    
    boolean existsByUserIdAndProductId(Long userId, Long productId);
    
    void deleteByUserIdAndProductId(Long userId, Long productId);
}
