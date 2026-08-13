package org.bulkby.auth.service;

import org.bulkby.auth.dto.AllowedEmailDomainDTO;

import java.util.List;

public interface AllowedEmailDomainService {
    
    List<AllowedEmailDomainDTO> getAllAllowedDomains();
    
    List<AllowedEmailDomainDTO> getActiveAllowedDomains();
    
    AllowedEmailDomainDTO createAllowedDomain(AllowedEmailDomainDTO dto);
    
    AllowedEmailDomainDTO updateAllowedDomain(Long id, AllowedEmailDomainDTO dto);
    
    void deleteAllowedDomain(Long id);
    
    boolean isEmailDomainAllowed(String email);
}
