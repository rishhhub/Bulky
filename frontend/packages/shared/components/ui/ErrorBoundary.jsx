import React from 'react';
import { Button } from './Button.jsx';

/**
 * React Error Boundary. Catches errors in child tree and shows a fallback UI.
 * Use at app root or around route trees.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const fallback = this.props.fallback;
      if (fallback) {
        return typeof fallback === 'function'
          ? fallback({ error: this.state.error, retry: this.handleRetry })
          : fallback;
      }
      return (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            minHeight: '50vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <h2 style={{ marginBottom: '16px', color: 'var(--color-text-primary)' }}>
            Something went wrong
          </h2>
          <p style={{ marginBottom: '24px', color: 'var(--color-text-secondary)' }}>
            We encountered an unexpected error. Please try again.
          </p>
          <Button variant="primary" onClick={this.handleRetry}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
