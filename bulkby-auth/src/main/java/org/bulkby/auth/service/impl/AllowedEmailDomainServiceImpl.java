package org.bulkby.auth.service.impl;

import org.bulkby.auth.dto.AllowedEmailDomainDTO;
import org.bulkby.auth.model.AllowedEmailDomain;
import org.bulkby.auth.repository.AllowedEmailDomainRepository;
import org.bulkby.auth.service.AllowedEmailDomainService;
import org.bulkby.common.util.InputSanitizer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AllowedEmailDomainServiceImpl implements AllowedEmailDomainService {
    
    @Autowired
    private AllowedEmailDomainRepository repository;
    
    @Override
    @Transactional(readOnly = true)
    public List<AllowedEmailDomainDTO> getAllAllowedDomains() {
        return repository.findAllByOrderByDomainAsc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AllowedEmailDomainDTO> getActiveAllowedDomains() {
        return repository.findByActiveTrueOrderByDomainAsc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public AllowedEmailDomainDTO createAllowedDomain(AllowedEmailDomainDTO dto) {
        // Normalize domain (lowercase, trim)
        String normalizedDomain = normalizeDomain(dto.getDomain());
        
        // Check if domain already exists
        if (repository.existsByDomainIgnoreCase(normalizedDomain)) {
            throw new RuntimeException("Domain '" + normalizedDomain + "' already exists");
        }
        
        AllowedEmailDomain domain = new AllowedEmailDomain();
        domain.setDomain(normalizedDomain);
        domain.setActive(dto.getActive() != null ? dto.getActive() : true);
        domain.setDescription(dto.getDescription() != null ? 
            InputSanitizer.sanitize(dto.getDescription()) : null);
        
        domain = repository.save(domain);
        return convertToDTO(domain);
    }
    
    @Override
    @Transactional
    public AllowedEmailDomainDTO updateAllowedDomain(Long id, AllowedEmailDomainDTO dto) {
        AllowedEmailDomain domain = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Allowed email domain not found with id: " + id));
        
        // Normalize domain if changed
        if (dto.getDomain() != null && !dto.getDomain().equalsIgnoreCase(domain.getDomain())) {
            String normalizedDomain = normalizeDomain(dto.getDomain());
            
            // Check if new domain already exists (excluding current domain)
            if (repository.existsByDomainIgnoreCase(normalizedDomain) && 
                !normalizedDomain.equalsIgnoreCase(domain.getDomain())) {
                throw new RuntimeException("Domain '" + normalizedDomain + "' already exists");
            }
            
            domain.setDomain(normalizedDomain);
        }
        
        if (dto.getActive() != null) {
            domain.setActive(dto.getActive());
        }
        
        if (dto.getDescription() != null) {
            domain.setDescription(InputSanitizer.sanitize(dto.getDescription()));
        }
        
        domain = repository.save(domain);
        return convertToDTO(domain);
    }
    
    @Override
    @Transactional
    public void deleteAllowedDomain(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Allowed email domain not found with id: " + id);
        }
        repository.deleteById(id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean isEmailDomainAllowed(String email) {
        if (email == null || !email.contains("@")) {
            return false;
        }
        
        String domain = email.substring(email.lastIndexOf("@") + 1).toLowerCase().trim();
        
        // Check if any active domain matches
        return repository.findByActiveTrueOrderByDomainAsc().stream()
                .anyMatch(allowed -> allowed.getDomain().equalsIgnoreCase(domain));
    }
    
    private String normalizeDomain(String domain) {
        if (domain == null) {
            return null;
        }
        // Remove leading/trailing whitespace, convert to lowercase
        String normalized = domain.trim().toLowerCase();
        // Remove leading @ if present
        if (normalized.startsWith("@")) {
            normalized = normalized.substring(1);
        }
        return normalized;
    }
    
    private AllowedEmailDomainDTO convertToDTO(AllowedEmailDomain domain) {
        AllowedEmailDomainDTO dto = new AllowedEmailDomainDTO();
        dto.setId(domain.getId());
        dto.setDomain(domain.getDomain());
        dto.setActive(domain.getActive());
        dto.setDescription(domain.getDescription());
        dto.setCreatedAt(domain.getCreatedAt());
        dto.setUpdatedAt(domain.getUpdatedAt());
        return dto;
    }
}
