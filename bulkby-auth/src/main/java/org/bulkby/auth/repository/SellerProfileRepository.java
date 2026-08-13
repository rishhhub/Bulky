package org.bulkby.auth.repository;

import org.bulkby.auth.model.SellerProfile;
import org.bulkby.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SellerProfileRepository extends JpaRepository<SellerProfile, Long> {
    
    Optional<SellerProfile> findByUser(User user);
    
    Optional<SellerProfile> findByUserId(Long userId);
    
    boolean existsByPanNumber(String panNumber);
    
    boolean existsByGstin(String gstin);
}
