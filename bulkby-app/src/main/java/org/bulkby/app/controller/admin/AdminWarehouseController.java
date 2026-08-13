package org.bulkby.app.controller.admin;

import org.bulkby.logistics.dto.WarehouseDTO;
import org.bulkby.logistics.service.WarehouseService;
import org.bulkby.order.dto.SellerOrderDTO;
import org.bulkby.order.service.SellerOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/admin/warehouses")
@PreAuthorize("hasRole('ADMIN')")
public class AdminWarehouseController {

    @Autowired
    private WarehouseService warehouseService;

    @Autowired
    private SellerOrderService sellerOrderService;

    @GetMapping
    public ResponseEntity<List<WarehouseDTO>> getAllWarehouses() {
        List<WarehouseDTO> warehouses = warehouseService.getAllWarehouses();
        return ResponseEntity.ok(warehouses);
    }

    @PostMapping
    public ResponseEntity<WarehouseDTO> createWarehouse(@Valid @RequestBody WarehouseDTO warehouseDTO) {
        WarehouseDTO created = warehouseService.createWarehouse(warehouseDTO);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<WarehouseDTO> updateWarehouse(
            @PathVariable("id") Long id,
            @Valid @RequestBody WarehouseDTO warehouseDTO) {
        WarehouseDTO updated = warehouseService.updateWarehouse(id, warehouseDTO);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWarehouse(@PathVariable("id") Long id) {
        warehouseService.deleteWarehouse(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/seller-orders")
    public ResponseEntity<List<SellerOrderDTO>> getSellerOrdersByWarehouse(@PathVariable("id") Long id) {
        List<SellerOrderDTO> orders = sellerOrderService.getSellerOrdersByWarehouse(id);
        return ResponseEntity.ok(orders);
    }
}
