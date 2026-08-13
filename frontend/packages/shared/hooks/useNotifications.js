import { useState, useEffect, useCallback } from 'react';
import { logger } from '../utils/logger.js';

/**
 * Hook for managing notifications
 * @param {Object} options
 * @param {Function} options.notificationService - Notification service with getUserNotifications, getUnreadCount, markAsRead, markAllAsRead
 * @param {number} options.pollInterval - Polling interval in ms (default: 30000)
 * @param {boolean} options.autoPoll - Whether to auto-poll (default: true)
 */
export const useNotifications = ({
  notificationService,
  pollInterval = 30000,
  autoPoll = true
} = {}) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNotifications = useCallback(async () => {
    if (!notificationService) return;
    
    try {
      setError(null);
      const [notificationsData, unreadCountData] = await Promise.all([
        notificationService.getUserNotifications(),
        notificationService.getUnreadCount()
      ]);
      setNotifications(notificationsData || []);
      setUnreadCount(unreadCountData || 0);
    } catch (err) {
      logger.error('Failed to load notifications:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [notificationService]);

  const markAsRead = useCallback(async (notificationId) => {
    if (!notificationService) return;
    
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      logger.error('Failed to mark notification as read:', err);
      throw err;
    }
  }, [notificationService]);

  const markAllAsRead = useCallback(async () => {
    if (!notificationService) return;
    
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      logger.error('Failed to mark all as read:', err);
      throw err;
    }
  }, [notificationService]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!autoPoll || !notificationService) return;

    const interval = setInterval(() => {
      loadNotifications();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [autoPoll, pollInterval, loadNotifications, notificationService]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    markAsRead,
    markAllAsRead
  };
};

export default useNotifications;
