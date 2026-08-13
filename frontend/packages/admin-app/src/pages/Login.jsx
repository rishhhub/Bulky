import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@shared/services';
import { FormField } from '@shared/components/forms';
import { Button, Card } from '@shared/components/ui';
import { getErrorMessage } from '@shared/utils';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(email, password);
      const user = authService.getCurrentUser();
      
      // Check if user is admin
      if (user && user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        setError('Access denied. Admin privileges required.');
        authService.logout();
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f7fa',
      padding: '24px'
    }}>
      <Card style={{ 
        maxWidth: '420px', 
        width: '100%',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '28px', 
            fontWeight: '700',
            color: '#111827'
          }}>
            Admin Login
          </h1>
          <p style={{ 
            margin: 0, 
            fontSize: '14px', 
            color: '#6b7280'
          }}>
            Access the admin dashboard
          </p>
        </div>
        
        {error && (
          <div style={{ 
            color: '#dc2626', 
            marginBottom: '20px', 
            padding: '12px 16px', 
            backgroundColor: '#fef2f2', 
            borderRadius: '8px',
            border: '1px solid #fecaca',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <FormField
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            error={error && !email ? 'Email is required' : ''}
          />
          <FormField
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            error={error && !password ? 'Password is required' : ''}
          />
          <div style={{ marginTop: '24px' }}>
            <Button 
              type="submit" 
              variant="primary" 
              size="lg"
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </div>
        </form>
        
        <p style={{ 
          marginTop: '24px', 
          textAlign: 'center', 
          fontSize: '13px', 
          color: '#6b7280',
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px'
        }}>
          Admin access only. Regular users should use the main application.
        </p>
      </Card>
    </div>
  );
}

export default Login;
