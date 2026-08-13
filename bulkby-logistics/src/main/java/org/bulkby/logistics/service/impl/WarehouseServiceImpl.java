package org.bulkby.logistics.service.impl;

import org.bulkby.logistics.dto.WarehouseDTO;
import org.bulkby.logistics.model.Address;
import org.bulkby.logistics.model.Warehouse;
import org.bulkby.logistics.repository.WarehouseRepository;
import org.bulkby.logistics.service.WarehouseService;
import org.bulkby.common.dto.PincodeInfo;
import org.bulkby.common.service.PincodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class WarehouseServiceImpl implements WarehouseService {
    
    @Autowired
    private WarehouseRepository warehouseRepository;
    
    @Autowired(required = false)
    private PincodeService pincodeService;
    
    private WarehouseDTO convertToDTO(Warehouse warehouse) {
        WarehouseDTO dto = new WarehouseDTO();
        dto.setId(warehouse.getId());
        dto.setName(warehouse.getName());
        
        if (warehouse.getAddress() != null) {
            dto.setStreet(warehouse.getAddress().getStreet());
            dto.setPincode(warehouse.getAddress().getPincode());
            dto.setCityId(warehouse.getAddress().getCityId());
            dto.setStateId(warehouse.getAddress().getStateId());
            
            // Fetch city and state from pincode lookup for display
            if (pincodeService != null && warehouse.getAddress().getPincode() != null) {
                PincodeInfo pincodeInfo = pincodeService.lookupByPincode(warehouse.getAddress().getPincode());
                if (pincodeInfo != null) {
                    dto.setCity(pincodeInfo.getCityName());
                    dto.setState(pincodeInfo.getStateName());
                }
            }
        }
        
        dto.setPhone(warehouse.getPhone());
        dto.setHoursOfOperation(warehouse.getHoursOfOperation());
        dto.setActive(warehouse.getActive());
        return dto;
    }
    
    private Warehouse convertToEntity(WarehouseDTO dto) {
        Warehouse warehouse = new Warehouse();
        if (dto.getId() != null) {
            warehouse.setId(dto.getId());
        }
        warehouse.setName(dto.getName());
        
        // Create or update address
        Address address = new Address();
        address.setStreet(dto.getStreet());
        address.setPincode(dto.getPincode());
        address.setCityId(dto.getCityId());
        address.setStateId(dto.getStateId());
        warehouse.setAddress(address);
        
        warehouse.setPhone(dto.getPhone());
        warehouse.setHoursOfOperation(dto.getHoursOfOperation());
        warehouse.setActive(dto.getActive() != null ? dto.getActive() : true);
        return warehouse;
    }
    
    @Override
    public List<WarehouseDTO> getAllActiveWarehouses() {
        return warehouseRepository.findByActiveTrue()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<WarehouseDTO> getAllWarehouses() {
        return warehouseRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public WarehouseDTO getWarehouseById(Long id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Warehouse not found with id: " + id));
        return convertToDTO(warehouse);
    }
    
    @Override
    @Transactional
    public void deleteWarehouse(Long id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Warehouse not found with id: " + id));
        warehouseRepository.delete(warehouse);
    }
    
    @Override
    @Transactional
    public WarehouseDTO createWarehouse(WarehouseDTO warehouseDTO) {
        Warehouse warehouse = convertToEntity(warehouseDTO);
        warehouse = warehouseRepository.save(warehouse);
        return convertToDTO(warehouse);
    }
    
    @Override
    @Transactional
    public WarehouseDTO updateWarehouse(Long id, WarehouseDTO warehouseDTO) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Warehouse not found with id: " + id));
        
        warehouse.setName(warehouseDTO.getName());
        
        // Update address
        if (warehouse.getAddress() == null) {
            warehouse.setAddress(new Address());
        }
        warehouse.getAddress().setStreet(warehouseDTO.getStreet());
        warehouse.getAddress().setPincode(warehouseDTO.getPincode());
        warehouse.getAddress().setCityId(warehouseDTO.getCityId());
        warehouse.getAddress().setStateId(warehouseDTO.getStateId());
        
        warehouse.setPhone(warehouseDTO.getPhone());
        warehouse.setHoursOfOperation(warehouseDTO.getHoursOfOperation());
        if (warehouseDTO.getActive() != null) {
            warehouse.setActive(warehouseDTO.getActive());
        }
        
        warehouse = warehouseRepository.save(warehouse);
        return convertToDTO(warehouse);
    }
}
