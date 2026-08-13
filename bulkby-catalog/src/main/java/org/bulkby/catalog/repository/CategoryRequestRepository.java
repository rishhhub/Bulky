package org.bulkby.catalog.repository;

import org.bulkby.auth.model.User;
import org.bulkby.catalog.model.CategoryRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRequestRepository extends JpaRepository<CategoryRequest, Long> {
    
    List<CategoryRequest> findBySeller(User seller);
    
    List<CategoryRequest> findByStatus(CategoryRequest.RequestStatus status);
}
