package org.bulkby.app.controller.admin;

import org.bulkby.order.dto.OrderDetailDTO;
import org.bulkby.order.dto.OrderGroupDTO;
import org.bulkby.order.dto.PendingInterestDTO;
import org.bulkby.order.dto.PlaceOrderRequest;
import org.bulkby.order.dto.SellerOrderDTO;
import org.bulkby.order.dto.UpdateTrackingRequest;
import org.bulkby.order.service.OrderGroupService;
import org.bulkby.order.service.SellerOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderGroupController {

    @Autowired
    private OrderGroupService orderGroupService;

    @Autowired
    private SellerOrderService sellerOrderService;

    @GetMapping("/order-groups")
    public ResponseEntity<List<OrderGroupDTO>> getAllOrderGroups() {
        List<OrderGroupDTO> orderGroups = orderGroupService.getAllOrderGroups();
        return ResponseEntity.ok(orderGroups);
    }

    @GetMapping("/order-groups/{id}/details")
    public ResponseEntity<OrderDetailDTO> getOrderGroupDetails(@PathVariable("id") Long id) {
        OrderDetailDTO details = orderGroupService.getOrderGroupDetails(id);
        return ResponseEntity.ok(details);
    }

    @PostMapping("/order-groups/{id}/place-order")
    public ResponseEntity<SellerOrderDTO> placeOrder(
            @PathVariable("id") Long id,
            @RequestBody(required = false) PlaceOrderRequest request) {
        if (request == null) {
            request = new PlaceOrderRequest();
        }
        SellerOrderDTO sellerOrder = sellerOrderService.placeOrderWithSeller(id, request);
        return ResponseEntity.ok(sellerOrder);
    }

    @GetMapping("/order-groups/{id}/seller-order")
    public ResponseEntity<SellerOrderDTO> getSellerOrder(@PathVariable("id") Long id) {
        List<SellerOrderDTO> orders = sellerOrderService.getSellerOrdersByOrderGroup(id);
        if (orders.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(orders.get(0));
    }

    @PutMapping("/seller-orders/{id}/tracking")
    public ResponseEntity<SellerOrderDTO> updateTracking(
            @PathVariable("id") Long id,
            @RequestBody UpdateTrackingRequest request) {
        SellerOrderDTO sellerOrder = sellerOrderService.updateSellerOrderTracking(id, request);
        return ResponseEntity.ok(sellerOrder);
    }

    @PostMapping("/seller-orders/{id}/mark-arrived")
    public ResponseEntity<Void> markOrderArrived(@PathVariable("id") Long id) {
        sellerOrderService.markOrderArrived(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/seller-orders")
    public ResponseEntity<List<SellerOrderDTO>> getAllSellerOrders() {
        List<SellerOrderDTO> orders = sellerOrderService.getAllSellerOrders();
        return ResponseEntity.ok(orders);
    }

    @PostMapping("/interests/{id}/mark-picked-up")
    public ResponseEntity<Void> markPickedUp(@PathVariable("id") Long id) {
        orderGroupService.markPickedUp(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/interests/{id}/mark-delivered")
    public ResponseEntity<Void> markDelivered(
            @PathVariable("id") Long id,
            @RequestBody(required = false) Map<String, String> request) {
        String deliveryTrackingId = request != null ? request.get("deliveryTrackingId") : null;
        orderGroupService.markDelivered(id, deliveryTrackingId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/order-groups/check-thresholds")
    public ResponseEntity<String> checkThresholds() {
        orderGroupService.checkAndCreateOrderGroups();
        orderGroupService.checkAndCreateOrderGroupsForActiveInterests();
        orderGroupService.triggerOrderGroupCompletionCheck();
        return ResponseEntity.ok("Threshold check completed");
    }

    @PostMapping("/order-groups/check-completion")
    public ResponseEntity<String> checkPaymentCompletion() {
        orderGroupService.triggerOrderGroupCompletionCheck();
        return ResponseEntity.ok("Payment completion check completed");
    }

    @GetMapping("/pending-interests")
    public ResponseEntity<List<PendingInterestDTO>> getPendingInterests() {
        List<PendingInterestDTO> pendingInterests = orderGroupService.getPendingInterestsSummary();
        return ResponseEntity.ok(pendingInterests);
    }
}
