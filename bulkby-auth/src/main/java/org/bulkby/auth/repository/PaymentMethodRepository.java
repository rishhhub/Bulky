package org.bulkby.auth.repository;

import org.bulkby.auth.model.User;
import org.bulkby.auth.model.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Long> {
    List<PaymentMethod> findByUser(User user);
    List<PaymentMethod> findByUserAndIsDefaultTrue(User user);
}
