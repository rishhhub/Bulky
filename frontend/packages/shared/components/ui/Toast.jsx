import React, { useEffect } from 'react';

/**
 * Single toast message. Auto-dismisses after duration.
 * @param {Object} props
 * @param {string} props.message - Message text
 * @param {string} [props.type] - 'success' | 'error' | 'info'
 * @param {number} [props.duration] - Ms before auto-dismiss (0 = no auto-dismiss)
 * @param {Function} props.onClose - Called when toast is closed
 */
export function Toast({ message, type = 'info', duration = 5000, onClose }) {
  useEffect(() => {
    if (duration > 0 && onClose) {
      const t = setTimeout(onClose, duration);
      return () => clearTimeout(t);
    }
  }, [duration, onClose]);

  const typeStyles = {
    success: { backgroundColor: 'var(--color-success, #28a745)', color: 'white' },
    error: { backgroundColor: 'var(--color-danger, #dc3545)', color: 'white' },
    info: { backgroundColor: 'var(--color-primary, #007bff)', color: 'white' }
  };
  const style = typeStyles[type] || typeStyles.info;

  return (
    <div
      role="alert"
      style={{
        ...style,
        padding: '12px 20px',
        borderRadius: 'var(--radius-md, 8px)',
        boxShadow: 'var(--shadow-lg, 0 4px 6px rgba(0,0,0,0.1))',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        minWidth: '280px',
        maxWidth: '400px'
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          padding: '0 4px',
          fontSize: '18px',
          lineHeight: 1,
          opacity: 0.9
        }}
      >
        ×
      </button>
    </div>
  );
}

export default Toast;
