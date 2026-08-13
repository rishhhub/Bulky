package org.bulkby.order.controller;

import org.bulkby.order.dto.OrderTrackingDTO;
import org.bulkby.order.service.OrderTrackingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tracking")
@CrossOrigin(origins = "*")
public class OrderTrackingController {
    
    @Autowired
    private OrderTrackingService orderTrackingService;
    
    @GetMapping("/interest/{id}")
    public ResponseEntity<List<OrderTrackingDTO>> getTrackingByInterest(@PathVariable("id") Long id) {
        List<OrderTrackingDTO> tracking = orderTrackingService.getTrackingByInterestId(id);
        return ResponseEntity.ok(tracking);
    }
}
