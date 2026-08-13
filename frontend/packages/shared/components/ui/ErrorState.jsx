import React from 'react';
import { Button } from './Button.jsx';

/**
 * Error state with message and retry button.
 * @param {Object} props
 * @param {string} props.message - Error message (e.g. from getErrorMessage)
 * @param {Function} [props.onRetry] - Called when user clicks Retry
 * @param {string} [props.retryLabel] - Label for retry button (default "Try again")
 */
export function ErrorState({ message, onRetry, retryLabel = 'Try again' }) {
  return (
    <div
      className="error-state"
      style={{
        padding: 'var(--spacing-xxl, 48px) var(--spacing-lg, 24px)',
        textAlign: 'center'
      }}
    >
      <p style={{ margin: 0, fontSize: 'var(--font-size-base)', color: 'var(--color-danger, #dc3545)', fontWeight: 500 }}>
        {message}
      </p>
      {onRetry && (
        <Button variant="primary" onClick={onRetry} style={{ marginTop: 'var(--spacing-lg, 24px)' }}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
