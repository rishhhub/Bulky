import React from 'react';
import { Button } from '../components/ui/index.js';
import { appUrls } from '../config/appUrls.js';

/**
 * Access denied view with message and optional link to another app.
 * @param {Object} props
 * @param {string} props.message - Main message (e.g. "You must be an administrator to access this panel.")
 * @param {string} [props.linkUrl] - Optional URL for "Go to..." link
 * @param {string} [props.linkLabel] - Label for the link (e.g. "Open Admin Panel", "Go to User App")
 * @param {string} [props.loginPath] - Path to login (e.g. "/login") for primary action
 * @param {Function} [props.onGoToLogin] - Callback when user clicks go to login (e.g. navigate)
 */
export function AccessDenied({
  message,
  linkUrl,
  linkLabel,
  loginPath = '/login',
  onGoToLogin
}) {
  return (
    <div
      className="access-denied"
      style={{
        padding: '50px 24px',
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg-secondary, #f5f7fa)'
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-primary, #fff)',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          maxWidth: '500px'
        }}
      >
        <h1 style={{ marginTop: 0, color: '#111827', fontSize: '28px', fontWeight: '700' }}>
          Access Denied
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '16px' }}>{message}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          {onGoToLogin && (
            <Button onClick={onGoToLogin} variant="primary">
              Go to Login
            </Button>
          )}
          {!onGoToLogin && loginPath && (
            <a href={loginPath}>
              <Button variant="primary">Go to Login</Button>
            </a>
          )}
          {linkUrl && linkLabel && (
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--color-primary, #007bff)',
                textDecoration: 'none',
                fontSize: '15px'
              }}
            >
              {linkLabel}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default AccessDenied;
