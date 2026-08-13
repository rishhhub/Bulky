package org.bulkby.logistics.service;

import org.bulkby.logistics.dto.WarehouseDTO;

import java.util.List;

public interface WarehouseService {
    List<WarehouseDTO> getAllActiveWarehouses();
    List<WarehouseDTO> getAllWarehouses();
    WarehouseDTO getWarehouseById(Long id);
    WarehouseDTO createWarehouse(WarehouseDTO warehouseDTO);
    WarehouseDTO updateWarehouse(Long id, WarehouseDTO warehouseDTO);
    void deleteWarehouse(Long id);
}
