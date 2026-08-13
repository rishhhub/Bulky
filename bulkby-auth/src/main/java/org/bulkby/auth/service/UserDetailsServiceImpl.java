package org.bulkby.auth.service;

import org.bulkby.auth.model.User;
import org.bulkby.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Override
    @Transactional
    public UserDetails loadUserByUsername(String contactValue) throws UsernameNotFoundException {
        // contactValue can be either email or phone (primary contact)
        User user = userRepository.findByEmailOrPhone(contactValue)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with contact: " + contactValue));
        
        // Use primary contact as username (email if present, otherwise phone)
        String username = user.getEmail() != null ? user.getEmail() : user.getPhone();
        
        // Password can be null for OTP-only users, use empty string for Spring Security
        String password = user.getPasswordHash() != null ? user.getPasswordHash() : "";
        
        return org.springframework.security.core.userdetails.User.builder()
                .username(username)
                .password(password)
                .roles(user.getRole().name())
                .disabled(!user.getEnabled())
                .build();
    }
}
