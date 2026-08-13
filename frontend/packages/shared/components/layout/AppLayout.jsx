import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/auth.js';
import { Button, ProfileCard } from '../ui/index.js';

const navStyle = {
  backgroundColor: '#1a1d29',
  color: 'white',
  padding: '12px 0',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  position: 'sticky',
  top: 0,
  zIndex: 1000
};

const containerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  maxWidth: 1400,
  margin: '0 auto',
  padding: '0 24px'
};

/**
 * Config-driven app layout with nav bar.
 * @param {Object} props
 * @param {string} props.brandLabel - Brand text (e.g. "BulkBy", "BulkBy Seller")
 * @param {string} props.brandTo - Path or URL for brand link
 * @param {string} [props.brandColor] - Brand link color (e.g. "#20c997" for seller)
 * @param {Array<{path: string, label: string}>} props.navItems - Main nav links
 * @param {Array<{href: string, label: string}>} [props.extraLinks] - External/extra links (e.g. View Site)
 * @param {React.ReactNode} [props.children] - Page content
 * @param {boolean} [props.showProfile] - Show ProfileCard when authenticated (default true)
 * @param {string} [props.logoutPath] - Path to redirect after logout (default "/login")
 */
export function AppLayout({
  brandLabel,
  brandTo,
  brandColor = 'white',
  navItems = [],
  extraLinks = [],
  children,
  showProfile = true,
  logoutPath = '/login'
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getCurrentUser();

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = () => {
    authService.logout();
    navigate(logoutPath);
  };

  const linkStyle = (path) => ({
    color: isActive(path) ? 'white' : 'rgba(255, 255, 255, 0.9)',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: isActive(path) ? 600 : 500,
    padding: '8px 12px',
    borderRadius: '8px',
    backgroundColor: isActive(path) ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
    transition: 'all 0.2s ease'
  });

  const isExternal = (to) => to.startsWith('http');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-secondary, #f5f7fa)' }}>
      <nav style={navStyle}>
        <div className="container" style={containerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {isExternal(brandTo) ? (
              <a
                href={brandTo}
                style={{ color: brandColor, textDecoration: 'none', fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px' }}
              >
                {brandLabel}
              </a>
            ) : (
              <Link
                to={brandTo}
                style={{ color: brandColor, textDecoration: 'none', fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px' }}
              >
                {brandLabel}
              </Link>
            )}
            {showProfile && isAuthenticated && <ProfileCard />}
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="nav-link"
                style={linkStyle(item.path)}
              >
                {item.label}
              </Link>
            ))}
            {extraLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-link"
                style={{ color: 'rgba(255, 255, 255, 0.9)', textDecoration: 'none', fontSize: '15px', fontWeight: 500, padding: '8px 12px', borderRadius: '8px', transition: 'all 0.2s ease' }}
              >
                {item.label}
              </a>
            ))}
            {isAuthenticated && (
              <Button
                onClick={handleLogout}
                variant="danger"
                size="sm"
                style={{ padding: '8px 16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(220, 53, 69, 0.3)' }}
              >
                <span>⏻</span>
                <span>Logout</span>
              </Button>
            )}
          </div>
        </div>
      </nav>
      <main style={{ minHeight: 'calc(100vh - 60px)' }}>{children}</main>
    </div>
  );
}

export default AppLayout;
