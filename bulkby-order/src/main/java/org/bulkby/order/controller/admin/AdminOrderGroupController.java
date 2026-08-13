package org.bulkby.order.controller.admin;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController("adminOrderGroupAcceptingController")
@RequestMapping("/admin/order-groups")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderGroupController {
    
    @Autowired
    private org.bulkby.order.service.OrderGroupService orderGroupService;
    
    @PutMapping("/{id}/accepting-new-orders")
    public ResponseEntity<Void> setAcceptingNewOrders(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> request) {
        Boolean accepting = request.get("accepting");
        if (accepting == null) {
            return ResponseEntity.badRequest().build();
        }
        orderGroupService.setAcceptingNewOrders(id, accepting);
        return ResponseEntity.noContent().build();
    }
    
    @PutMapping("/accepting-new-orders")
    public ResponseEntity<Void> setAcceptingNewOrdersForAll(
            @RequestBody Map<String, Boolean> request) {
        Boolean accepting = request.get("accepting");
        if (accepting == null) {
            return ResponseEntity.badRequest().build();
        }
        orderGroupService.setAcceptingNewOrdersForAll(accepting);
        return ResponseEntity.noContent().build();
    }
}
