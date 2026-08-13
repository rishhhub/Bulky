package org.bulkby.logistics.controller;

import org.bulkby.logistics.dto.WarehouseDTO;
import org.bulkby.logistics.service.WarehouseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/warehouses")
@CrossOrigin(origins = "*")
public class WarehouseController {
    
    @Autowired
    private WarehouseService warehouseService;
    
    @GetMapping
    public ResponseEntity<List<WarehouseDTO>> getAllWarehouses() {
        List<WarehouseDTO> warehouses = warehouseService.getAllActiveWarehouses();
        return ResponseEntity.ok(warehouses);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<WarehouseDTO> getWarehouseById(@PathVariable("id") Long id) {
        WarehouseDTO warehouse = warehouseService.getWarehouseById(id);
        return ResponseEntity.ok(warehouse);
    }
}
