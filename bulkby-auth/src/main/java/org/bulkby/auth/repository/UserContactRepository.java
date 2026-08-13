package org.bulkby.auth.repository;

import org.bulkby.auth.model.User;
import org.bulkby.auth.model.UserContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserContactRepository extends JpaRepository<UserContact, Long> {
    List<UserContact> findByUser(User user);
    List<UserContact> findByUserAndVerifiedTrue(User user);
}
