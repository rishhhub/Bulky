package org.bulkby.catalog.repository;

import org.bulkby.auth.model.User;
import org.bulkby.catalog.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    List<Product> findByActiveTrueAndMinOrderQuantityGreaterThan(Integer minOrderQuantity);
    List<Product> findByActiveTrue();
    
    @Query("SELECT COUNT(p) FROM Product p WHERE p.category.id = :categoryId AND p.active = true")
    Long countByCategoryId(@Param("categoryId") Long categoryId);
    
    List<Product> findBySeller(User seller);
    
    List<Product> findBySellerAndApprovalStatus(User seller, Product.ApprovalStatus approvalStatus);
}
