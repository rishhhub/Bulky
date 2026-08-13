import { useState, useEffect, useCallback } from 'react';
import { orderService } from '@shared/services';
import { logger } from '@shared/utils';

export function useOrderGroups(enabled = true) {
  const [orderGroups, setOrderGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrderGroups = useCallback(async () => {
    try {
      const data = await orderService.getAllOrderGroups();
      setOrderGroups(data || []);
    } catch (err) {
      logger.error('Failed to load order groups:', err);
      setOrderGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    await loadOrderGroups();
  }, [enabled, loadOrderGroups]);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    loadOrderGroups();
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps -- load on mount when tab is active

  return { orderGroups, loading, loadOrderGroups, refresh };
}
