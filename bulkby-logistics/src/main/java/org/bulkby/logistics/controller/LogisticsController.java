package org.bulkby.logistics.controller;

import org.bulkby.logistics.dto.LogisticsCostRequest;
import org.bulkby.logistics.dto.LogisticsCostResponse;
import org.bulkby.logistics.service.LogisticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/logistics")
@CrossOrigin(origins = "*")
public class LogisticsController {
    
    @Autowired
    private LogisticsService logisticsService;
    
    @PostMapping("/calculate")
    public ResponseEntity<LogisticsCostResponse> calculateDeliveryCost(@RequestBody LogisticsCostRequest request) {
        LogisticsCostResponse response = logisticsService.calculateDeliveryCost(request);
        return ResponseEntity.ok(response);
    }
}
