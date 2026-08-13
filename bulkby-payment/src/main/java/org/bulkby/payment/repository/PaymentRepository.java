package org.bulkby.payment.repository;

import org.bulkby.payment.model.Payment;
import org.bulkby.payment.model.Payment.PaymentType;
import org.bulkby.payment.model.Payment.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByUserId(Long userId);
    List<Payment> findByInterestId(Long interestId);
    List<Payment> findByPaymentType(PaymentType paymentType);
    List<Payment> findByStatus(PaymentStatus status);
}
