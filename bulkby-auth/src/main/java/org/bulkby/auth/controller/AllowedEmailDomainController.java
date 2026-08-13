package org.bulkby.auth.controller;

import org.bulkby.auth.dto.AllowedEmailDomainDTO;
import org.bulkby.auth.service.AllowedEmailDomainService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/admin/allowed-email-domains")
@PreAuthorize("hasRole('ADMIN')")
public class AllowedEmailDomainController {
    
    @Autowired
    private AllowedEmailDomainService allowedEmailDomainService;
    
    @GetMapping
    public ResponseEntity<List<AllowedEmailDomainDTO>> getAllAllowedDomains() {
        List<AllowedEmailDomainDTO> domains = allowedEmailDomainService.getAllAllowedDomains();
        return ResponseEntity.ok(domains);
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<AllowedEmailDomainDTO>> getActiveAllowedDomains() {
        List<AllowedEmailDomainDTO> domains = allowedEmailDomainService.getActiveAllowedDomains();
        return ResponseEntity.ok(domains);
    }
    
    @PostMapping
    public ResponseEntity<AllowedEmailDomainDTO> createAllowedDomain(@Valid @RequestBody AllowedEmailDomainDTO dto) {
        AllowedEmailDomainDTO created = allowedEmailDomainService.createAllowedDomain(dto);
        return ResponseEntity.ok(created);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<AllowedEmailDomainDTO> updateAllowedDomain(
            @PathVariable Long id,
            @Valid @RequestBody AllowedEmailDomainDTO dto) {
        AllowedEmailDomainDTO updated = allowedEmailDomainService.updateAllowedDomain(id, dto);
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAllowedDomain(@PathVariable Long id) {
        allowedEmailDomainService.deleteAllowedDomain(id);
        return ResponseEntity.noContent().build();
    }
}
