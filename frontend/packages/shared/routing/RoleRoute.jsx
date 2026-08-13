import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.js';
import { AccessDenied } from './AccessDenied.jsx';
import { appUrls } from '../config/appUrls.js';

const ROLE_CONFIG = {
  ADMIN: {
    message: 'You must be an administrator to access this panel.',
    linkUrl: () => `${appUrls.adminAppUrl}/admin`,
    linkLabel: 'Open Admin Panel in New Tab'
  },
  SELLER: {
    message: 'You must be a seller to access this panel.',
    linkUrl: () => appUrls.userAppUrl,
    linkLabel: 'Go to User App'
  }
};

/**
 * Protects routes that require a specific role. Redirects to login if not authenticated,
 * or shows AccessDenied with optional link if wrong role.
 * @param {Object} props
 * @param {'ADMIN'|'SELLER'} props.role - Required role
 * @param {React.ReactNode} props.children - Content to render when authorized
 * @param {string} [props.loginPath] - Path to redirect to when not authenticated (default '/login')
 * @param {React.ReactNode} [props.fallback] - Custom fallback when wrong role (default: AccessDenied)
 */
export function RoleRoute({ role, children, loginPath = '/login', fallback }) {
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getCurrentUser();
  const hasRole = user && user.role === role;

  if (!isAuthenticated) {
    return <Navigate to={loginPath} replace />;
  }
  if (!hasRole) {
    if (fallback !== undefined) {
      return fallback;
    }
    const config = ROLE_CONFIG[role];
    const linkUrl = config?.linkUrl ? config.linkUrl() : undefined;
    const linkLabel = config?.linkLabel;
    return (
      <AccessDenied
        message={config?.message || 'You do not have permission to access this page.'}
        linkUrl={linkUrl}
        linkLabel={linkLabel}
        onGoToLogin={() => navigate(loginPath)}
      />
    );
  }
  return children;
}

export default RoleRoute;
