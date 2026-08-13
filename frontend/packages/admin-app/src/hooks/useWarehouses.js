import { useState, useEffect, useCallback } from 'react';
import { warehouseService, orderService } from '@shared/services';
import { logger } from '@shared/utils';

export function useWarehouses(enabled = true) {
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseSellerOrders, setWarehouseSellerOrders] = useState({});
  const [loading, setLoading] = useState(true);

  const loadWarehouses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await warehouseService.getAll();
      setWarehouses(data || []);
      const ordersByWarehouse = {};
      for (const warehouse of data || []) {
        if (warehouse.active) {
          try {
            const orders = await orderService.getSellerOrdersByWarehouse(warehouse.id);
            ordersByWarehouse[warehouse.id] = orders || [];
          } catch {
            ordersByWarehouse[warehouse.id] = [];
          }
        }
      }
      setWarehouseSellerOrders(ordersByWarehouse);
    } catch (err) {
      logger.error('Failed to load warehouses:', err);
      setWarehouses([]);
      setWarehouseSellerOrders({});
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    await loadWarehouses();
  }, [enabled, loadWarehouses]);

  useEffect(() => {
    if (!enabled) return;
    loadWarehouses();
  }, [enabled]);

  return { warehouses, warehouseSellerOrders, loading, loadWarehouses, refresh };
}
