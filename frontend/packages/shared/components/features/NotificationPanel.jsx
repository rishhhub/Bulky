import React from 'react';
import { Button } from '../ui/Button.jsx';
import { Card } from '../ui/Card.jsx';
import { formatDateTime } from '../../utils/formatters.js';

/**
 * Notification panel component
 * @param {Object} props
 * @param {Array} props.notifications - Array of notification objects
 * @param {number} props.unreadCount - Number of unread notifications
 * @param {boolean} props.isOpen - Whether panel is open
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onMarkRead - Mark notification as read handler
 * @param {Function} props.onMarkAllRead - Mark all as read handler
 */
export const NotificationPanel = ({
  notifications = [],
  unreadCount = 0,
  isOpen,
  onClose,
  onMarkRead,
  onMarkAllRead
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '60px',
        right: '20px',
        width: '400px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          padding: '15px',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <h3 style={{ margin: 0 }}>Notifications {unreadCount > 0 && `(${unreadCount})`}</h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#666'
          }}
        >
          ×
        </button>
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            No notifications
          </div>
        ) : (
          <div>
            {unreadCount > 0 && (
              <div style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onMarkAllRead}
                >
                  Mark All Read
                </Button>
              </div>
            )}
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => onMarkRead && onMarkRead(notification.id)}
                style={{
                  padding: '15px',
                  marginBottom: '10px',
                  backgroundColor: notification.read ? '#f8f9fa' : '#e7f3ff',
                  borderLeft: notification.read ? '3px solid #ccc' : '3px solid #007bff',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = notification.read ? '#e9ecef' : '#d0e7ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = notification.read ? '#f8f9fa' : '#e7f3ff';
                }}
              >
                <p style={{ margin: 0, fontWeight: notification.read ? 'normal' : 'bold' }}>
                  {notification.message}
                </p>
                <small style={{ color: '#666', fontSize: '12px' }}>
                  {formatDateTime(notification.createdAt)}
                </small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
