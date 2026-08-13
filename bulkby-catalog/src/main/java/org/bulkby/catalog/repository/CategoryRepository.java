package org.bulkby.catalog.repository;

import org.bulkby.catalog.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByActiveTrue();
    List<Category> findByActiveTrueAndParentIsNull();
    List<Category> findByParentIsNull();
    List<Category> findByParentId(Long parentId);
    Optional<Category> findByName(String name);
    
    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT c FROM Category c LEFT JOIN FETCH c.children WHERE c.parent IS NULL AND c.active = true")
    List<Category> findByActiveTrueAndParentIsNullWithChildren();
    
    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT c FROM Category c LEFT JOIN FETCH c.children WHERE c.parent IS NULL")
    List<Category> findByParentIsNullWithChildren();
    
    boolean existsByNameIgnoreCase(String name);
}
