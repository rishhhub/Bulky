package org.bulkby.auth.repository;

import org.bulkby.auth.model.User;
import org.bulkby.auth.model.UserAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserAddressRepository extends JpaRepository<UserAddress, Long> {
    List<UserAddress> findByUser(User user);
    List<UserAddress> findByUserAndIsDefaultTrue(User user);
}
