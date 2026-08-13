package org.bulkby.auth.repository;

import org.bulkby.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    
    Optional<User> findByPhone(String phone);
    boolean existsByPhone(String phone);
    
    @Query("SELECT u FROM User u WHERE u.email = :contactValue OR u.phone = :contactValue")
    Optional<User> findByEmailOrPhone(@Param("contactValue") String contactValue);
    
    List<User> findByRole(User.Role role);
}
