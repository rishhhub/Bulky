package org.bulkby.order.repository;

import org.bulkby.order.model.OrderGroup;
import org.bulkby.order.model.OrderGroup.OrderGroupStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderGroupRepository extends JpaRepository<OrderGroup, Long> {
    List<OrderGroup> findByStatus(OrderGroupStatus status);
    List<OrderGroup> findByProductId(Long productId);
    
    @Query("SELECT DISTINCT og FROM OrderGroup og LEFT JOIN FETCH og.interests WHERE og.id = :id")
    Optional<OrderGroup> findByIdWithInterests(@Param("id") Long id);
    
    @Query("SELECT DISTINCT og FROM OrderGroup og LEFT JOIN FETCH og.interests WHERE og.productId = :productId")
    List<OrderGroup> findByProductIdWithInterests(@Param("productId") Long productId);
    
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT DISTINCT og FROM OrderGroup og LEFT JOIN FETCH og.interests WHERE og.productId = :productId")
    List<OrderGroup> findByProductIdWithInterestsLocked(@Param("productId") Long productId);
    
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT DISTINCT og FROM OrderGroup og LEFT JOIN FETCH og.interests WHERE og.id = :id")
    Optional<OrderGroup> findByIdWithInterestsLocked(@Param("id") Long id);
}
