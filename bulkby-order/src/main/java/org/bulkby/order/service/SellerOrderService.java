package org.bulkby.order.service;

import org.bulkby.order.dto.PlaceOrderRequest;
import org.bulkby.order.dto.SellerFulfillmentRequest;
import org.bulkby.order.dto.SellerOrderDTO;
import org.bulkby.order.dto.UpdateTrackingRequest;

import java.util.List;

public interface SellerOrderService {
    SellerOrderDTO placeOrderWithSeller(Long orderGroupId, PlaceOrderRequest request);
    SellerOrderDTO updateSellerOrderFulfillment(Long sellerOrderId, Long sellerId, SellerFulfillmentRequest request);
    SellerOrderDTO updateSellerOrderTracking(Long sellerOrderId, UpdateTrackingRequest request);
    void markOrderArrived(Long sellerOrderId);
    List<SellerOrderDTO> getSellerOrdersByOrderGroup(Long orderGroupId);
    List<SellerOrderDTO> getAllSellerOrders();
    List<SellerOrderDTO> getSellerOrdersByWarehouse(Long warehouseId);
    List<SellerOrderDTO> getSellerOrdersBySellerId(Long sellerId);
}
