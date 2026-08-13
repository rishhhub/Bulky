import React from 'react';
import { Button } from './Button.jsx';

/**
 * Empty state placeholder: message and optional primary action.
 * @param {Object} props
 * @param {string} props.message - Main message (e.g. "No products found")
 * @param {string} [props.description] - Optional secondary text
 * @param {string} [props.actionLabel] - Label for primary button
 * @param {Function} [props.onAction] - Called when primary button is clicked
 * @param {React.ReactNode} [props.icon] - Optional icon or emoji
 */
export function EmptyState({ message, description, actionLabel, onAction, icon }) {
  return (
    <div
      className="empty-state"
      style={{
        padding: 'var(--spacing-xxl, 48px) var(--spacing-lg, 24px)',
        textAlign: 'center'
      }}
    >
      {icon && (
        <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-md, 16px)', opacity: 0.6 }}>
          {icon}
        </div>
      )}
      <p style={{ margin: 0, fontSize: 'var(--font-size-lg, 18px)', color: 'var(--color-text-primary)', fontWeight: 500 }}>
        {message}
      </p>
      {description && (
        <p style={{ margin: 'var(--spacing-sm, 8px) 0 0', fontSize: 'var(--font-size-sm, 14px)', color: 'var(--color-text-secondary)' }}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction} style={{ marginTop: 'var(--spacing-lg, 24px)' }}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
