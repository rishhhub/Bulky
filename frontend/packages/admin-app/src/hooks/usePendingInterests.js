import { useState, useEffect, useCallback } from 'react';
import { orderService } from '@shared/services';
import { logger } from '@shared/utils';

export function usePendingInterests(enabled = true) {
  const [pendingInterests, setPendingInterests] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPendingInterests = useCallback(async () => {
    try {
      const data = await orderService.getPendingInterests();
      setPendingInterests(data || []);
    } catch (err) {
      logger.error('Failed to load pending interests:', err);
      setPendingInterests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    await loadPendingInterests();
  }, [enabled, loadPendingInterests]);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    loadPendingInterests();
  }, [enabled]);

  return { pendingInterests, loading, loadPendingInterests, refresh };
}
