import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '@shared/services';
import { Button, ProfileCard } from '@shared/components/ui';
import { appUrls } from '@shared/config';

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();
  const isAuthenticated = authService.isAuthenticated();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div style={{ 
        padding: '50px', 
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f7fa'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          maxWidth: '500px'
        }}>
          <h1 style={{ marginTop: 0, color: '#111827', fontSize: '28px', fontWeight: '700' }}>Access Denied</h1>
          <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '16px' }}>
            You must be an administrator to access this panel.
          </p>
          <Button onClick={() => navigate('/login')} variant="primary">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa' }}>
      <nav style={{ 
        backgroundColor: '#1a1d29', 
        color: 'white', 
        padding: '12px 0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div className="container" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link 
              to="/admin" 
              style={{ 
                color: '#ffc107', 
                textDecoration: 'none', 
                fontSize: '22px', 
                fontWeight: '700',
                letterSpacing: '-0.5px'
              }}
            >
              BulkBy Admin
            </Link>
            {isAuthenticated && <ProfileCard />}
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Link 
              to="/admin" 
              style={{ 
                color: isActive('/admin') && !location.pathname.includes('/order-groups') && !location.pathname.includes('/financial') ? 'white' : 'rgba(255, 255, 255, 0.9)', 
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: isActive('/admin') && !location.pathname.includes('/order-groups') && !location.pathname.includes('/financial') ? '600' : '500',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: isActive('/admin') && !location.pathname.includes('/order-groups') && !location.pathname.includes('/financial') ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive('/admin') || location.pathname.includes('/order-groups') || location.pathname.includes('/financial')) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('/admin') || location.pathname.includes('/order-groups') || location.pathname.includes('/financial')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                } else {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                }
              }}
            >
              Dashboard
            </Link>
            <Link 
              to="/admin/financial" 
              style={{ 
                color: isActive('/admin/financial') ? 'white' : 'rgba(255, 255, 255, 0.9)', 
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: isActive('/admin/financial') ? '600' : '500',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: isActive('/admin/financial') ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive('/admin/financial')) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('/admin/financial')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                } else {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                }
              }}
            >
              💰 Financial
            </Link>
            <Link 
              to="/admin/locations" 
              style={{ 
                color: isActive('/admin/locations') ? 'white' : 'rgba(255, 255, 255, 0.9)', 
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: isActive('/admin/locations') ? '600' : '500',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: isActive('/admin/locations') ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive('/admin/locations')) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('/admin/locations')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                } else {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                }
              }}
            >
              📍 Locations
            </Link>
            <a 
              href={appUrls.userAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                color: 'rgba(255, 255, 255, 0.9)', 
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: '500',
                padding: '8px 12px',
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              View Site
            </a>
            <Button 
              onClick={handleLogout} 
              variant="danger" 
              size="sm"
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid rgba(220, 53, 69, 0.3)'
              }}
            >
              <span>⏻</span>
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </nav>
      <main style={{ minHeight: 'calc(100vh - 60px)' }}>{children}</main>
    </div>
  );
}

export default Layout;
