package org.bulkby.auth.service;

import org.bulkby.auth.model.User;

import java.util.Optional;

public interface UserService {
    Optional<User> findByEmail(String email);
    Optional<User> findById(Long id);
    boolean existsByEmail(String email);
    String getUserName(Long userId);
}
