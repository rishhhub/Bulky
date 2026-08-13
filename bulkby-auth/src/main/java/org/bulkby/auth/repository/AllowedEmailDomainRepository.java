package org.bulkby.auth.repository;

import org.bulkby.auth.model.AllowedEmailDomain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AllowedEmailDomainRepository extends JpaRepository<AllowedEmailDomain, Long> {
    
    Optional<AllowedEmailDomain> findByDomainIgnoreCase(String domain);
    
    List<AllowedEmailDomain> findByActiveTrueOrderByDomainAsc();
    
    List<AllowedEmailDomain> findAllByOrderByDomainAsc();
    
    boolean existsByDomainIgnoreCase(String domain);
}
