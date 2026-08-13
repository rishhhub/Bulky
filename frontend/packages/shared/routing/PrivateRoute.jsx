import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/auth.js';

/**
 * Protects routes that require authentication. Redirects to login if not authenticated.
 */
export function PrivateRoute({ children, loginPath = '/login' }) {
  return authService.isAuthenticated() ? children : <Navigate to={loginPath} replace />;
}

export default PrivateRoute;
