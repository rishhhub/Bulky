package org.bulkby.auth.repository;

import org.bulkby.auth.model.OtpPurpose;
import org.bulkby.auth.model.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {
    
    Optional<OtpVerification> findFirstByContactValueAndPurposeAndVerifiedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            String contactValue, OtpPurpose purpose, LocalDateTime now);
    
    List<OtpVerification> findAllByContactValueAndPurposeAndVerifiedFalseAndExpiresAtAfter(
            String contactValue, OtpPurpose purpose, LocalDateTime now);
    
    void deleteByExpiresAtBefore(LocalDateTime now);
}
