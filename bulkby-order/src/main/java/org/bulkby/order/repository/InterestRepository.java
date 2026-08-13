package org.bulkby.order.repository;

import org.bulkby.order.model.Interest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InterestRepository extends JpaRepository<Interest, Long> {
    List<Interest> findByUserId(Long userId);
    List<Interest> findByProductId(Long productId);
    List<Interest> findByStatus(Interest.InterestStatus status);
    
    @Query("SELECT i FROM Interest i WHERE i.endDate <= :now AND i.status = :status")
    List<Interest> findExpiredInterests(@Param("now") LocalDateTime now, @Param("status") Interest.InterestStatus status);
    
    @Query("SELECT i FROM Interest i WHERE i.productId = :productId AND i.endDate <= :now AND i.status = :status")
    List<Interest> findExpiredInterestsByProduct(@Param("productId") Long productId, @Param("now") LocalDateTime now, @Param("status") Interest.InterestStatus status);
    
    @Query("SELECT SUM(i.quantity) FROM Interest i WHERE i.productId = :productId AND i.endDate <= :now AND i.status = :status")
    Integer sumQuantityByProductAndStatus(@Param("productId") Long productId, @Param("now") LocalDateTime now, @Param("status") Interest.InterestStatus status);
    
    @Query("SELECT i FROM Interest i WHERE i.status = :status AND i.extensionReminderSentAt <= :expiryTime")
    List<Interest> findInterestsForAutoRefund(@Param("status") Interest.InterestStatus status, @Param("expiryTime") LocalDateTime expiryTime);
    
    @Query(value = "SELECT i.* FROM interests i INNER JOIN order_group_interests ogi ON i.id = ogi.interest_id WHERE ogi.order_group_id = :orderGroupId", nativeQuery = true)
    List<Interest> findByOrderGroupId(@Param("orderGroupId") Long orderGroupId);
    
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Interest i WHERE i.productId = :productId AND i.status = :status")
    List<Interest> findByProductIdAndStatusLocked(@Param("productId") Long productId, @Param("status") Interest.InterestStatus status);
}
