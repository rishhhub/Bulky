package org.bulkby.order.repository;

import org.bulkby.order.model.OrderTracking;
import org.bulkby.order.model.OrderTracking.TrackingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderTrackingRepository extends JpaRepository<OrderTracking, Long> {
    // Existing queries (maintained for backward compatibility)
    List<OrderTracking> findByInterestId(Long interestId);
    List<OrderTracking> findByStatus(TrackingStatus status);
    List<OrderTracking> findByInterestIdOrderByStatusDateDesc(Long interestId);
    
    // New queries for Order and SellerOrder (adds clarity while maintaining Interest queries)
    List<OrderTracking> findByOrderId(Long orderId);
    List<OrderTracking> findBySellerOrderId(Long sellerOrderId);
    List<OrderTracking> findByOrderIdOrderByStatusDateDesc(Long orderId);
    List<OrderTracking> findBySellerOrderIdOrderByStatusDateDesc(Long sellerOrderId);
    
    // Combined queries for full traceability
    List<OrderTracking> findByInterestIdAndOrderId(Long interestId, Long orderId);
    List<OrderTracking> findByInterestIdAndSellerOrderId(Long interestId, Long sellerOrderId);
}
