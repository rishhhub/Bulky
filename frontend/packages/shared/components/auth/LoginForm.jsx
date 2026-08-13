import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/auth.js';
import { FormField } from '../forms/index.js';
import { Button, Card } from '../ui/index.js';
import { getErrorMessage, logger } from '../../utils/index.js';

const detectContactType = (value) => (value.includes('@') ? 'EMAIL' : 'PHONE');

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

/**
 * Shared login form: password + OTP, contact detection, optional role check.
 * @param {Object} props
 * @param {string} props.title - Page title (e.g. "Login", "Seller Login")
 * @param {Function} props.onSuccess - Called with user after successful login
 * @param {string|null} [props.requiredRole] - If set (e.g. 'SELLER'), login fails with message when user doesn't have role
 * @param {{ href?: string, to?: string, label: string }} [props.footerLink] - Link below form (e.g. Register, Go to User App)
 */
export function LoginForm({ title = 'Login', onSuccess, requiredRole = null, footerLink }) {
  const [loginMethod, setLoginMethod] = useState('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contactValue, setContactValue] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleContactChange = (e) => {
    const value = e.target.value;
    if (detectContactType(value) === 'PHONE') {
      setContactValue(value.replace(/[^\d\s\-\(\)]/g, ''));
    } else {
      setContactValue(value);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!contactValue.trim()) {
      setError('Email or phone number is required');
      return;
    }
    const contactType = detectContactType(contactValue);
    if (contactType === 'EMAIL') {
      if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(contactValue.trim())) {
        setError('Please enter a valid email address');
        return;
      }
    } else {
      const cleaned = contactValue.trim().replace(/[\s\-\(\)]/g, '');
      if (!/^[6-9]\d{9}$/.test(cleaned)) {
        setError('Please enter a valid 10-digit phone number (must start with 6, 7, 8, or 9)');
        return;
      }
    }
    setLoading(true);
    try {
      const response = await authService.sendLoginOtp(contactValue, contactType);
      setStep(2);
      setCountdown(300);
      const t = setInterval(() => {
        setCountdown((prev) => (prev <= 1 ? (clearInterval(t), 0) : prev - 1));
      }, 1000);
      if (response.otp) logger.log('OTP for development:', response.otp);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to send OTP'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) {
      setError(`Please wait ${formatTime(countdown)} before resending`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await authService.sendLoginOtp(contactValue, detectContactType(contactValue));
      setCountdown(300);
      if (response.otp) logger.log('OTP for development:', response.otp);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to resend OTP'));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.loginWithOtp(contactValue, detectContactType(contactValue), otp);
      const user = authService.getCurrentUser();
      if (requiredRole && user?.role !== requiredRole) {
        setError(requiredRole === 'SELLER' ? 'You must be a seller to access this panel. Please register as a seller first.' : 'You do not have access to this panel.');
        authService.logout();
        setLoading(false);
        return;
      }
      onSuccess(user);
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.login(email, password);
      const user = authService.getCurrentUser();
      if (requiredRole && user?.role !== requiredRole) {
        setError(requiredRole === 'SELLER' ? 'You must be a seller to access this panel. Please register as a seller first.' : 'You do not have access to this panel.');
        authService.logout();
        setLoading(false);
        return;
      }
      onSuccess(user);
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '50px' }}>
      <Card>
        <h2 style={{ marginBottom: '20px' }}>{title}</h2>
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <Button
            type="button"
            variant={loginMethod === 'password' ? 'primary' : 'secondary'}
            onClick={() => { setLoginMethod('password'); setStep(1); setError(''); }}
            style={{ flex: 1 }}
          >
            Password
          </Button>
          <Button
            type="button"
            variant={loginMethod === 'otp' ? 'primary' : 'secondary'}
            onClick={() => { setLoginMethod('otp'); setStep(1); setError(''); }}
            style={{ flex: 1 }}
          >
            OTP
          </Button>
        </div>
        {error && <div style={{ color: 'var(--color-danger)', marginBottom: '15px' }}>{error}</div>}
        {loginMethod === 'password' ? (
          <form onSubmit={handlePasswordLogin}>
            <FormField label="Email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required error={error && !email ? 'Email is required' : ''} />
            <FormField label="Password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required error={error && !password ? 'Password is required' : ''} />
            <Button type="submit" variant="primary" disabled={loading} style={{ width: '100%' }}>{loading ? 'Logging in...' : 'Login'}</Button>
          </form>
        ) : (
          <>
            {step === 1 ? (
              <form onSubmit={handleSendOtp}>
                <FormField
                  label="Email or Phone"
                  type="text"
                  value={contactValue}
                  onChange={handleContactChange}
                  required
                  placeholder={detectContactType(contactValue) === 'EMAIL' ? 'your@email.com' : '9876543210'}
                  maxLength={detectContactType(contactValue) === 'PHONE' ? 15 : undefined}
                  error={error && !contactValue ? 'Email or phone is required' : error || ''}
                />
                {detectContactType(contactValue) === 'PHONE' && contactValue && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>Enter 10-digit phone number (e.g., 9876543210)</p>
                )}
                <Button type="submit" variant="primary" disabled={loading} style={{ width: '100%' }}>{loading ? 'Sending OTP...' : 'Send OTP'}</Button>
              </form>
            ) : (
              <form onSubmit={handleOtpLogin}>
                <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                  <p style={{ margin: 0 }}><strong>Contact:</strong> {contactValue}</p>
                </div>
                <FormField
                  label="Enter OTP"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength="6"
                  placeholder="000000"
                  error={error && !otp ? 'OTP is required' : ''}
                />
                {countdown > 0 && <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>OTP expires in: {formatTime(countdown)}</p>}
                <Button type="submit" variant="primary" disabled={loading || otp.length !== 6} style={{ width: '100%', marginTop: '10px' }}>{loading ? 'Logging in...' : 'Login'}</Button>
                <Button type="button" variant="secondary" onClick={handleResendOtp} disabled={loading || countdown > 0} style={{ width: '100%', marginTop: '10px' }}>{countdown > 0 ? `Resend OTP (${formatTime(countdown)})` : 'Resend OTP'}</Button>
                <Button type="button" variant="text" onClick={() => { setStep(1); setOtp(''); setError(''); }} style={{ width: '100%', marginTop: '10px' }}>Change Contact</Button>
              </form>
            )}
          </>
        )}
        {footerLink && (
          <p style={{ marginTop: '15px', textAlign: 'center' }}>
            {footerLink.to ? (
              <Link to={footerLink.to}>{footerLink.label}</Link>
            ) : (
              <a href={footerLink.href} target="_blank" rel="noopener noreferrer">{footerLink.label}</a>
            )}
          </p>
        )}
      </Card>
    </div>
  );
}

export default LoginForm;
