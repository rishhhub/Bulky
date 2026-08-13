import React from 'react';
import { Link } from 'react-router-dom';
import { authService } from '@shared/services';

export const ProfileCard = () => {
  const user = authService.getCurrentUser();
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) return null;

  const getFullName = () => {
    if (!user) return 'User';
    if (user.fullName) return user.fullName;
    const parts = [user.firstName, user.middleName, user.lastName].filter(Boolean);
    return parts.join(' ') || 'User';
  };
  
  const getInitials = () => {
    if (!user) return '?';
    const initials = [];
    if (user.firstName) initials.push(user.firstName[0]);
    if (user.lastName) initials.push(user.lastName[0]);
    return initials.join('').toUpperCase() || '?';
  };

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(getFullName())}&background=007bff&color=fff&size=128&bold=true&font-size=0.5`;

  return (
    <Link 
      to="/profile" 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 16px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        textDecoration: 'none',
        color: 'white',
        transition: 'all 0.2s ease',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#007bff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          flexShrink: 0
        }}
      >
        {user?.profilePicture ? (
          <img 
            src={user.profilePicture} 
            alt={getFullName()}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <img 
            src={defaultAvatar}
            alt={getFullName()}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.textContent = getInitials();
              e.target.parentElement.style.fontSize = '14px';
              e.target.parentElement.style.fontWeight = '600';
              e.target.parentElement.style.color = 'white';
            }}
          />
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span style={{ 
          fontSize: '14px', 
          fontWeight: '600',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {getFullName()}
        </span>
        <span style={{ 
          fontSize: '12px', 
          opacity: 0.8,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {user?.email || user?.phone || ''}
        </span>
      </div>
    </Link>
  );
};

export default ProfileCard;
