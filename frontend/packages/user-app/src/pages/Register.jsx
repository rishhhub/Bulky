import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '@shared/services';
import { FormField } from '@shared/components/forms';
import { Button, Card } from '@shared/components/ui';
import { getErrorMessage, logger } from '@shared/utils';

function Register() {
  const [step, setStep] = useState(1); // 1: Enter details, 2: Enter OTP
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactValue, setContactValue] = useState('');
  const [contactType, setContactType] = useState('EMAIL'); // EMAIL or PHONE
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  const detectContactType = (value) => {
    return value.includes('@') ? 'EMAIL' : 'PHONE';
  };

  const handleContactChange = (e) => {
    const value = e.target.value;
    const detectedType = detectContactType(value);
    
    // If phone, clean the input (only allow digits, spaces, hyphens, parentheses)
    if (detectedType === 'PHONE') {
      const cleaned = value.replace(/[^\d\s\-\(\)]/g, '');
      setContactValue(cleaned);
      setContactType('PHONE');
    } else {
      setContactValue(value);
      setContactType('EMAIL');
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!firstName.trim()) {
      setError('First name is required');
      return;
    }
    
    if (!lastName.trim()) {
      setError('Last name is required');
      return;
    }
    
    // Validate name format (letters, spaces, hyphens, apostrophes only)
    const namePattern = /^[a-zA-Z\s\-']+$/;
    if (!namePattern.test(firstName.trim())) {
      setError('First name can only contain letters, spaces, hyphens, and apostrophes');
      return;
    }
    if (middleName.trim() && !namePattern.test(middleName.trim())) {
      setError('Middle name can only contain letters, spaces, hyphens, and apostrophes');
      return;
    }
    if (!namePattern.test(lastName.trim())) {
      setError('Last name can only contain letters, spaces, hyphens, and apostrophes');
      return;
    }
    
    if (!contactValue.trim()) {
      setError('Email or phone number is required');
      return;
    }
    
    // Validate email or phone format using regex
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (contactType === 'EMAIL') {
      if (!emailPattern.test(contactValue.trim())) {
        setError('Please enter a valid email address');
        return;
      }
    } else {
      // Validate phone - exactly 10 digits, must start with 6, 7, 8, or 9
      const cleanedPhone = contactValue.trim().replace(/[\s\-\(\)]/g, ''); // Remove spaces, hyphens, parentheses
      const phonePattern = /^[6-9]\d{9}$/;
      
      if (!phonePattern.test(cleanedPhone)) {
        setError('Please enter a valid 10-digit phone number (must start with 6, 7, 8, or 9)');
        return;
      }
      
      // Update contactValue to cleaned format
      setContactValue(cleanedPhone);
    }

    setLoading(true);
    try {
      const response = await authService.sendRegistrationOtp(contactValue, contactType);
      setOtpSent(true);
      setStep(2);
      // Start countdown (5 minutes = 300 seconds)
      setCountdown(300);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      if (response.otp) {
        logger.log('OTP for development:', response.otp);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to send OTP'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) {
      setError(`Please wait ${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')} before resending`);
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const response = await authService.sendRegistrationOtp(contactValue, contactType);
      setCountdown(300);
      if (response.otp) {
        logger.log('OTP for development:', response.otp);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to resend OTP'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.registerWithOtp(firstName, middleName, lastName, contactValue, contactType, otp);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '50px' }}>
      <Card>
        <h2 style={{ marginBottom: '20px' }}>Register</h2>
        {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
        
        {step === 1 ? (
          <form onSubmit={handleSendOtp}>
            <FormField
              label="First Name *"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              maxLength={50}
              placeholder="John"
              error={error && !firstName ? 'First name is required' : ''}
            />
            <FormField
              label="Middle Name"
              type="text"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              maxLength={50}
              placeholder="Michael (optional)"
            />
            <FormField
              label="Last Name *"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              maxLength={50}
              placeholder="Doe"
              error={error && !lastName ? 'Last name is required' : ''}
            />
            <FormField
              label={contactType === 'EMAIL' ? 'Email' : 'Phone Number'}
              type={contactType === 'EMAIL' ? 'email' : 'tel'}
              value={contactValue}
              onChange={handleContactChange}
              required
              placeholder={contactType === 'EMAIL' ? 'your@email.com' : '9876543210'}
              maxLength={contactType === 'EMAIL' ? undefined : 15}
              error={error && !contactValue ? `${contactType === 'EMAIL' ? 'Email' : 'Phone'} is required` : error || ''}
            />
            {contactType === 'PHONE' && (
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                Enter 10-digit phone number (e.g., 9876543210)
              </p>
            )}
            <Button type="submit" variant="primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
              <p style={{ margin: 0 }}><strong>Name:</strong> {firstName} {middleName ? middleName + ' ' : ''}{lastName}</p>
              <p style={{ margin: '5px 0 0 0' }}><strong>{contactType === 'EMAIL' ? 'Email' : 'Phone'}:</strong> {contactValue}</p>
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
            {countdown > 0 && (
              <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                OTP expires in: {formatTime(countdown)}
              </p>
            )}
            <Button type="submit" variant="primary" disabled={loading || otp.length !== 6} style={{ width: '100%', marginTop: '10px' }}>
              {loading ? 'Registering...' : 'Register'}
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={handleResendOtp} 
              disabled={loading || countdown > 0}
              style={{ width: '100%', marginTop: '10px' }}
            >
              {countdown > 0 ? `Resend OTP (${formatTime(countdown)})` : 'Resend OTP'}
            </Button>
            <Button 
              type="button" 
              variant="text" 
              onClick={() => { setStep(1); setOtp(''); setError(''); }}
              style={{ width: '100%', marginTop: '10px' }}
            >
              Change Contact
            </Button>
          </form>
        )}
        
        <p style={{ marginTop: '15px', textAlign: 'center' }}>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </Card>
    </div>
  );
}

export default Register;
