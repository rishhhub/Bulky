import { useState, useEffect, useCallback } from 'react';
import { logger } from '../utils/logger.js';

/**
 * Hook for managing order tracking
 * @param {Object} options
 * @param {Function} options.trackingService - Tracking service with getTrackingByInterestId
 * @param {Array} options.interestIds - Array of interest IDs to track
 */
export const useTracking = ({
  trackingService,
  interestIds = []
} = {}) => {
  const [trackingData, setTrackingData] = useState({});
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});

  const loadTracking = useCallback(async (interestId) => {
    if (!trackingService || !interestId) return;

    setLoading((prev) => ({ ...prev, [interestId]: true }));
    setError((prev) => {
      const next = { ...prev };
      delete next[interestId];
      return next;
    });

    try {
      const data = await trackingService.getTrackingByInterestId(interestId);
      setTrackingData((prev) => ({ ...prev, [interestId]: data || [] }));
    } catch (err) {
      logger.error(`Failed to load tracking for interest ${interestId}:`, err);
      setError((prev) => ({ ...prev, [interestId]: err }));
      setTrackingData((prev) => ({ ...prev, [interestId]: [] }));
    } finally {
      setLoading((prev) => ({ ...prev, [interestId]: false }));
    }
  }, [trackingService]);

  useEffect(() => {
    if (!trackingService || interestIds.length === 0) return;

    interestIds.forEach((interestId) => {
      if (!trackingData[interestId] && !loading[interestId]) {
        loadTracking(interestId);
      }
    });
  }, [interestIds, trackingService, loadTracking]);

  return {
    trackingData,
    loading,
    error,
    loadTracking
  };
};

export default useTracking;
