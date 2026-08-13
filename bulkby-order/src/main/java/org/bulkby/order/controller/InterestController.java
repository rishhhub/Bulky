package org.bulkby.order.controller;

import org.bulkby.order.dto.ExtendInterestRequest;
import org.bulkby.order.dto.InterestDTO;
import org.bulkby.order.dto.InterestRequest;
import org.bulkby.order.dto.UpdateInterestRequest;
import org.bulkby.order.service.InterestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/interests")
public class InterestController {
    
    @Autowired
    private InterestService interestService;
    
    @PostMapping
    public ResponseEntity<InterestDTO> createInterest(@Valid @RequestBody InterestRequest request) {
        InterestDTO interest = interestService.createInterest(request);
        return ResponseEntity.ok(interest);
    }
    
    @GetMapping("/my")
    public ResponseEntity<List<InterestDTO>> getMyInterests() {
        List<InterestDTO> interests = interestService.getUserInterests();
        return ResponseEntity.ok(interests);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<InterestDTO> getInterestById(@PathVariable("id") Long id) {
        InterestDTO interest = interestService.getInterestById(id);
        return ResponseEntity.ok(interest);
    }
    
    @PostMapping("/{id}/extend")
    public ResponseEntity<InterestDTO> extendInterest(@PathVariable("id") Long id, @Valid @RequestBody ExtendInterestRequest request) {
        InterestDTO interest = interestService.extendInterest(id, request.getPeriodDays());
        return ResponseEntity.ok(interest);
    }
    
    @PostMapping("/{id}/withdraw")
    public ResponseEntity<InterestDTO> withdrawInterest(@PathVariable("id") Long id) {
        InterestDTO interest = interestService.withdrawInterest(id);
        return ResponseEntity.ok(interest);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<org.bulkby.order.dto.UpdateInterestResponse> updateInterest(@PathVariable("id") Long id, @Valid @RequestBody UpdateInterestRequest request) {
        org.bulkby.order.dto.UpdateInterestResponse response = interestService.updateInterest(id, request);
        return ResponseEntity.ok(response);
    }
}
