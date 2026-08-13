package org.bulkby.order.repository;

import org.bulkby.order.model.SellerOrder;
import org.bulkby.order.model.SellerOrder.SellerOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SellerOrderRepository extends JpaRepository<SellerOrder, Long> {
    Optional<SellerOrder> findByOrderGroupId(Long orderGroupId);
    List<SellerOrder> findByStatus(SellerOrderStatus status);
    List<SellerOrder> findByDeliveryWarehouseId(Long warehouseId);
    
    /**
     * Find seller orders by seller ID through order group and product relationship
     * This query joins OrderGroup -> Product -> Seller to find orders for a specific seller
     */
    @Query("SELECT so FROM SellerOrder so " +
           "JOIN OrderGroup og ON so.orderGroupId = og.id " +
           "JOIN Product p ON og.productId = p.id " +
           "WHERE p.seller.id = :sellerId " +
           "ORDER BY so.placedAt DESC")
    List<SellerOrder> findBySellerId(@Param("sellerId") Long sellerId);
}
