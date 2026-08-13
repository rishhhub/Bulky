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
              to="/" 
              style={{ 
                color: 'white', 
                textDecoration: 'none', 
                fontSize: '22px', 
                fontWeight: '700',
                letterSpacing: '-0.5px'
              }}
            >
              BulkBy
            </Link>
            {isAuthenticated && <ProfileCard />}
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Link 
              to="/products" 
              style={{ 
                color: isActive('/products') ? 'white' : 'rgba(255, 255, 255, 0.9)', 
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: isActive('/products') ? '600' : '500',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: isActive('/products') ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive('/products')) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('/products')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                } else {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                }
              }}
            >
              Products
            </Link>
            {isAuthenticated ? (
              <>
                <Link 
                  to="/dashboard" 
                  style={{ 
                    color: isActive('/dashboard') ? 'white' : 'rgba(255, 255, 255, 0.9)', 
                    textDecoration: 'none',
                    fontSize: '15px',
                    fontWeight: isActive('/dashboard') ? '600' : '500',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: isActive('/dashboard') ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive('/dashboard')) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive('/dashboard')) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    } else {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                    }
                  }}
                >
                  Dashboard
                </Link>
                {user?.role === 'ADMIN' && (
                  <Link 
                    to="/admin"
                    style={{ 
                      color: '#ffc107', 
                      textDecoration: 'none', 
                      fontWeight: '600',
                      padding: '8px 16px',
                      backgroundColor: 'rgba(255, 193, 7, 0.15)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 193, 7, 0.3)',
                      fontSize: '14px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 193, 7, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 193, 7, 0.15)';
                    }}
                  >
                    Admin
                  </Link>
                )}
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
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
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
                  Login
                </Link>
                <Button 
                  onClick={() => navigate('/register')}
                  variant="primary"
                  size="sm"
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px'
                  }}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>
      <main style={{ minHeight: 'calc(100vh - 60px)' }}>{children}</main>
    </div>
  );
}

export default Layout;
