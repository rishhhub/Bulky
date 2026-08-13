import React, { useState, useEffect, startTransition, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { profileService, pincodeService, sellerService } from '@shared/services';
import { FormField, PincodeInput } from '@shared/components/forms';
import { Button, Card, Select, LoadingSpinner, Badge } from '@shared/components/ui';
import { authService } from '@shared/services';

function Profile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState('basic');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile data
  const [profile, setProfile] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loginMethods, setLoginMethods] = useState([]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Email/Phone OTP
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailStep, setEmailStep] = useState(1); // 1: input, 2: OTP verification
  const [phoneStep, setPhoneStep] = useState(1); // 1: input, 2: OTP verification
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  
  // Name field editing states
  const [editingFirstName, setEditingFirstName] = useState(false);
  const [editingMiddleName, setEditingMiddleName] = useState(false);
  const [editingLastName, setEditingLastName] = useState(false);


  // Addresses
  const [addresses, setAddresses] = useState([]);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: '',
    street: '',
    pincode: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false,
    recipientName: '',
    recipientPhone: '',
    useMyDetails: false
  });
  const [pincodeInfo, setPincodeInfo] = useState(null);

  // Payment Methods
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [editingPayment, setEditingPayment] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    type: 'CARD',
    provider: '',
    lastFourDigits: '',
    upiId: '',
    cardExpiry: '',
    isDefault: false
  });

  // Seller Registration
  const [sellerStatus, setSellerStatus] = useState(null);
  const [loadingSellerStatus, setLoadingSellerStatus] = useState(false);
  const [showSellerRegistration, setShowSellerRegistration] = useState(false);
  const [sellerForm, setSellerForm] = useState({
    companyName: '',
    companyAddress: '',
    panNumber: '',
    gstin: ''
  });
  const [registeringSeller, setRegisteringSeller] = useState(false);

  useEffect(() => {
    loadProfile();
    loadAddresses();
    loadPaymentMethods();
    loadSellerStatus();
  }, []);

  // Load seller status when seller section is accessed
  useEffect(() => {
    if (activeSection === 'seller') {
      loadSellerStatus();
    }
  }, [activeSection]);

  // Load addresses when addresses section is accessed
  useEffect(() => {
    if (activeSection === 'addresses') {
      loadAddresses();
    }
  }, [activeSection]);

  // Load payment methods when payments section is accessed
  useEffect(() => {
    if (activeSection === 'payments') {
      loadPaymentMethods();
    }
  }, [activeSection]);

  const loadProfile = async () => {
    try {
      const data = await profileService.getProfile();
      setProfile(data);
      setFirstName(data.firstName || '');
      setMiddleName(data.middleName || '');
      setLastName(data.lastName || '');
      setEmail(data.email || '');
      setPhone(data.phone || '');
      setLoginMethods(data.loginMethods || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };


  const loadAddresses = async () => {
    try {
      const data = await profileService.getAddresses();
      setAddresses(data);
    } catch (err) {
      console.error('Failed to load addresses:', err);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const data = await profileService.getPaymentMethods();
      setPaymentMethods(data);
    } catch (err) {
      console.error('Failed to load payment methods:', err);
    }
  };

  const handleUpdateName = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    // Validate name fields
    if (!firstName.trim()) {
      setError('First name is required');
      setSaving(false);
      return;
    }
    if (!lastName.trim()) {
      setError('Last name is required');
      setSaving(false);
      return;
    }
    
    // Validate name format
    const namePattern = /^[a-zA-Z\s\-']+$/;
    if (!namePattern.test(firstName.trim())) {
      setError('First name can only contain letters, spaces, hyphens, and apostrophes');
      setSaving(false);
      return;
    }
    if (middleName.trim() && !namePattern.test(middleName.trim())) {
      setError('Middle name can only contain letters, spaces, hyphens, and apostrophes');
      setSaving(false);
      return;
    }
    if (!namePattern.test(lastName.trim())) {
      setError('Last name can only contain letters, spaces, hyphens, and apostrophes');
      setSaving(false);
      return;
    }

    try {
      await profileService.updateProfile({ 
        firstName: firstName.trim(),
        middleName: middleName.trim() || null,
        lastName: lastName.trim()
      });
      setSuccess('Name updated successfully');
      setEditingFirstName(false);
      setEditingMiddleName(false);
      setEditingLastName(false);
      loadProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update name');
    } finally {
      setSaving(false);
    }
  };
  
  const handleCancelNameEdit = () => {
    // Reset to original values
    setFirstName(profile?.firstName || '');
    setMiddleName(profile?.middleName || '');
    setLastName(profile?.lastName || '');
    setEditingFirstName(false);
    setEditingMiddleName(false);
    setEditingLastName(false);
    setError('');
  };

  const handleSendEmailOtp = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    // Validate email format with regex
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await profileService.sendContactOtp(email.trim(), 'EMAIL');
      setEmailStep(2);
      setSuccess('OTP sent to your email');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (emailOtp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await profileService.verifyContactOtp(email, emailOtp);
      if (response.verified) {
        // Include required fields (firstName, lastName) when updating email
        await profileService.updateProfile({ 
          firstName: profile?.firstName || '',
          middleName: profile?.middleName || null,
          lastName: profile?.lastName || '',
          email 
        });
        setSuccess('Email updated successfully');
        setEditingEmail(false);
        setEmailStep(1);
        setEmailOtp('');
        loadProfile();
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify OTP');
    } finally {
      setSaving(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }
    
    // Validate phone format - exactly 10 digits
    const phonePattern = /^[6-9]\d{9}$/;
    const trimmedPhone = phone.trim().replace(/[\s\-\(\)]/g, ''); // Remove spaces, hyphens, parentheses
    
    if (!phonePattern.test(trimmedPhone)) {
      setError('Please enter a valid 10-digit phone number (must start with 6, 7, 8, or 9)');
      return;
    }
    
    // Update phone to cleaned format
    setPhone(trimmedPhone);

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await profileService.sendContactOtp(phone.trim(), 'PHONE');
      setPhoneStep(2);
      setSuccess('OTP sent to your phone');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (phoneOtp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await profileService.verifyContactOtp(phone, phoneOtp);
      if (response.verified) {
        // Include required fields (firstName, lastName) when updating phone
        await profileService.updateProfile({ 
          firstName: profile?.firstName || '',
          middleName: profile?.middleName || null,
          lastName: profile?.lastName || '',
          phone 
        });
        setSuccess('Phone number updated successfully');
        setEditingPhone(false);
        setPhoneStep(1);
        setPhoneOtp('');
        loadProfile();
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify OTP');
    } finally {
      setSaving(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate password
    if (!newPassword || !newPassword.trim()) {
      setError('Password is required');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword.length > 128) {
      setError('Password must not exceed 128 characters');
      return;
    }

    // Validate confirm password
    if (!confirmPassword || !confirmPassword.trim()) {
      setError('Please confirm your password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Additional password strength checks (optional but recommended)
    // Check for at least one letter
    if (!/[a-zA-Z]/.test(newPassword)) {
      setError('Password must contain at least one letter');
      return;
    }

    // Check for at least one number
    if (!/\d/.test(newPassword)) {
      setError('Password must contain at least one number');
      return;
    }

    setSaving(true);

    try {
      await profileService.setPassword(newPassword);
      setSuccess('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      loadProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set password');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelPasswordForm = () => {
    setShowPasswordForm(false);
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const handleAddNewPassword = () => {
    setShowPasswordForm(true);
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };


  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate label
    if (!addressForm.label || !addressForm.label.trim()) {
      setError('Label is required');
      return;
    }
    if (addressForm.label.trim().length > 100) {
      setError('Label must not exceed 100 characters');
      return;
    }
    
    // Validate street
    if (!addressForm.street || !addressForm.street.trim()) {
      setError('Street address is required');
      return;
    }
    if (addressForm.street.trim().length > 200) {
      setError('Street address must not exceed 200 characters');
      return;
    }
    
    // Validate pincode
    if (!addressForm.pincode || addressForm.pincode.length !== 6) {
      setError('Valid 6-digit pincode is required');
      return;
    }
    if (!/^\d{6}$/.test(addressForm.pincode)) {
      setError('Pincode must contain exactly 6 digits');
      return;
    }
    if (!pincodeInfo || !pincodeInfo.serviceable) {
      setError('Pincode must be serviceable. Please enter a valid serviceable pincode.');
      return;
    }
    
    // Validate city (should be auto-filled from pincode)
    if (!addressForm.city || !addressForm.city.trim()) {
      setError('City is required. Please enter a valid pincode.');
      return;
    }
    if (addressForm.city.trim().length > 100) {
      setError('City must not exceed 100 characters');
      return;
    }
    
    // Validate state (should be auto-filled from pincode)
    if (!addressForm.state || !addressForm.state.trim()) {
      setError('State is required. Please enter a valid pincode.');
      return;
    }
    if (addressForm.state.trim().length > 100) {
      setError('State must not exceed 100 characters');
      return;
    }
    
    // Validate postal code
    if (!addressForm.postalCode || !addressForm.postalCode.trim()) {
      setError('Postal code is required');
      return;
    }
    if (!/^\d{6}$/.test(addressForm.postalCode.trim())) {
      setError('Postal code must be exactly 6 digits');
      return;
    }
    
    // Validate country
    if (!addressForm.country || !addressForm.country.trim()) {
      setError('Country is required');
      return;
    }
    if (addressForm.country.trim().length > 100) {
      setError('Country must not exceed 100 characters');
      return;
    }
    
    // Validate recipient name
    if (!addressForm.recipientName || !addressForm.recipientName.trim()) {
      setError('Recipient name is required');
      return;
    }
    if (addressForm.recipientName.trim().length > 100) {
      setError('Recipient name must not exceed 100 characters');
      return;
    }
    // Validate recipient name format (letters, spaces, hyphens, apostrophes only)
    const namePattern = /^[a-zA-Z\s\-']+$/;
    if (!namePattern.test(addressForm.recipientName.trim())) {
      setError('Recipient name can only contain letters, spaces, hyphens, and apostrophes');
      return;
    }
    
    // Validate recipient phone
    if (!addressForm.recipientPhone || !addressForm.recipientPhone.trim()) {
      setError('Recipient phone number is required');
      return;
    }
    // Validate phone - exactly 10 digits, must start with 6, 7, 8, or 9
    const cleanedPhone = addressForm.recipientPhone.trim().replace(/[\s\-\(\)]/g, '');
    const phonePattern = /^[6-9]\d{9}$/;
    if (!phonePattern.test(cleanedPhone)) {
      setError('Recipient phone number must be exactly 10 digits and start with 6, 7, 8, or 9');
      return;
    }
    
    setSaving(true);

    try {
      // Prepare address data (exclude useMyDetails from the request)
      const { useMyDetails, ...addressData } = addressForm;
      // Update recipient phone with cleaned format
      addressData.recipientPhone = cleanedPhone;
      
      if (editingAddress) {
        await profileService.updateAddress(editingAddress.id, addressData);
        setSuccess('Address updated successfully');
      } else {
        await profileService.addAddress(addressData);
        setSuccess('Address added successfully');
      }
      setEditingAddress(null);
      setShowAddressForm(false);
      setAddressForm({
        label: '', street: '', pincode: '', city: '', state: '', postalCode: '', country: 'India', 
        isDefault: false, recipientName: '', recipientPhone: '', useMyDetails: false
      });
      setPincodeInfo(null);
      await loadAddresses();
      
      // Check if we should navigate back
      const returnUrl = searchParams.get('returnUrl');
      if (returnUrl) {
        navigate(decodeURIComponent(returnUrl));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    try {
      await profileService.deleteAddress(id);
      setSuccess('Address deleted successfully');
      loadAddresses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete address');
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setShowAddressForm(true);
    setAddressForm({
      label: address.label || '',
      street: address.street || '',
      pincode: address.pincode || address.postalCode || '',
      city: address.city || '',
      state: address.state || '',
      postalCode: address.postalCode || address.pincode || '',
      country: address.country || 'India',
      isDefault: address.isDefault || false,
      recipientName: address.recipientName || '',
      recipientPhone: address.recipientPhone || '',
      useMyDetails: false
    });
    setPincodeInfo(null);
    setError('');
    setSuccess('');
  };
  
  const handleAddNewAddress = () => {
    setEditingAddress(null);
    setShowAddressForm(true);
    setAddressForm({
      label: '',
      street: '',
      pincode: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      isDefault: false,
      recipientName: '',
      recipientPhone: '',
      useMyDetails: false
    });
    setPincodeInfo(null);
    setError('');
    setSuccess('');
  };
  
  const handleCancelAddressForm = () => {
    setEditingAddress(null);
    setShowAddressForm(false);
    setAddressForm({
      label: '',
      street: '',
      pincode: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      isDefault: false,
      recipientName: '',
      recipientPhone: '',
      useMyDetails: false
    });
    setPincodeInfo(null);
    setError('');
    setSuccess('');
  };

  // Memoize the pincode lookup callback to prevent unnecessary re-renders and continuous API calls
  const handlePincodeLookup = useCallback(async (pincodeValue) => {
    try {
      const info = await pincodeService.lookup(pincodeValue);
      if (info && info.cityName && info.stateName) {
        // Update state - use functional updates to avoid stale closures
        setPincodeInfo(info);
        setAddressForm(prev => {
          // Create new object to avoid mutation
          return {
            ...prev,
            pincode: pincodeValue,
            city: info.cityName || prev.city || '',
            state: info.stateName || prev.state || '',
            postalCode: pincodeValue
          };
        });
        return info;
      }
      return null;
    } catch (err) {
      console.error('Error looking up pincode:', err);
      setPincodeInfo(null);
      return null;
    }
  }, []); // Empty deps array since we use functional state updates

  const handleSavePaymentMethod = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate type
    if (!paymentForm.type) {
      setError('Payment method type is required');
      return;
    }

    // Validate provider
    if (!paymentForm.provider || !paymentForm.provider.trim()) {
      setError('Provider is required');
      return;
    }
    if (paymentForm.provider.trim().length > 100) {
      setError('Provider must not exceed 100 characters');
      return;
    }

    // Validate UPI ID if type is UPI
    if (paymentForm.type === 'UPI') {
      if (!paymentForm.upiId || !paymentForm.upiId.trim()) {
        setError('UPI ID is required for UPI payment methods');
        return;
      }
      // UPI ID format: alphanumeric@provider (e.g., username@paytm, username@ybl)
      const upiPattern = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
      if (!upiPattern.test(paymentForm.upiId.trim())) {
        setError('Please enter a valid UPI ID (e.g., yourname@paytm)');
        return;
      }
    }

    // Validate last four digits if provided
    if (paymentForm.lastFourDigits && paymentForm.lastFourDigits.trim()) {
      const digits = paymentForm.lastFourDigits.trim().replace(/\D/g, '');
      if (digits.length !== 4) {
        setError('Last four digits must be exactly 4 digits');
        return;
      }
      if (!/^\d{4}$/.test(digits)) {
        setError('Last four digits must contain only numbers');
        return;
      }
    }

    // Validate card expiry if provided (for CARD type)
    if (paymentForm.type === 'CARD' && paymentForm.cardExpiry && paymentForm.cardExpiry.trim()) {
      const expiry = paymentForm.cardExpiry.trim();
      // Format: MM/YY
      const expiryPattern = /^(0[1-9]|1[0-2])\/\d{2}$/;
      if (!expiryPattern.test(expiry)) {
        setError('Card expiry must be in MM/YY format (e.g., 12/25)');
        return;
      }
      // Validate expiry is not in the past
      const [month, year] = expiry.split('/');
      const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiryDate < today) {
        setError('Card expiry date cannot be in the past');
        return;
      }
    }

    setSaving(true);

    try {
      // Prepare payment method data
      const paymentData = {
        type: paymentForm.type,
        provider: paymentForm.provider.trim(),
        isDefault: paymentForm.isDefault || false
      };

      // Add optional fields only if they have values
      if (paymentForm.lastFourDigits && paymentForm.lastFourDigits.trim()) {
        paymentData.lastFourDigits = paymentForm.lastFourDigits.trim().replace(/\D/g, '').slice(0, 4);
      }
      if (paymentForm.upiId && paymentForm.upiId.trim()) {
        paymentData.upiId = paymentForm.upiId.trim();
      }
      if (paymentForm.cardExpiry && paymentForm.cardExpiry.trim()) {
        paymentData.cardExpiry = paymentForm.cardExpiry.trim();
      }

      if (editingPayment) {
        await profileService.updatePaymentMethod(editingPayment.id, paymentData);
        setSuccess('Payment method updated successfully');
      } else {
        await profileService.addPaymentMethod(paymentData);
        setSuccess('Payment method added successfully');
      }
      setEditingPayment(null);
      setShowPaymentForm(false);
      setPaymentForm({
        type: 'CARD', provider: '', lastFourDigits: '', upiId: '', cardExpiry: '', isDefault: false
      });
      await loadPaymentMethods();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save payment method');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePaymentMethod = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment method?')) return;

    try {
      await profileService.deletePaymentMethod(id);
      setSuccess('Payment method deleted successfully');
      loadPaymentMethods();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete payment method');
    }
  };

  const handleEditPaymentMethod = (payment) => {
    setEditingPayment(payment);
    setShowPaymentForm(true);
    setPaymentForm({
      type: payment.type || 'CARD',
      provider: payment.provider || '',
      lastFourDigits: payment.lastFourDigits || '',
      upiId: payment.upiId || '',
      cardExpiry: payment.cardExpiry || '',
      isDefault: payment.isDefault || false
    });
    setError('');
    setSuccess('');
  };

  const handleAddNewPaymentMethod = () => {
    setEditingPayment(null);
    setShowPaymentForm(true);
    setPaymentForm({
      type: 'CARD',
      provider: '',
      lastFourDigits: '',
      upiId: '',
      cardExpiry: '',
      isDefault: false
    });
    setError('');
    setSuccess('');
  };

  const handleCancelPaymentForm = () => {
    setEditingPayment(null);
    setShowPaymentForm(false);
    setPaymentForm({
      type: 'CARD',
      provider: '',
      lastFourDigits: '',
      upiId: '',
      cardExpiry: '',
      isDefault: false
    });
    setError('');
    setSuccess('');
  };

  const handleUpdateLoginMethods = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await profileService.updateLoginMethods({ loginMethods });
      setSuccess('Login methods updated successfully');
      loadProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update login methods');
    } finally {
      setSaving(false);
    }
  };

  const loadSellerStatus = async () => {
    try {
      setLoadingSellerStatus(true);
      const status = await sellerService.getSellerStatus();
      setSellerStatus(status);
    } catch (err) {
      // User might not be a seller yet, which is fine
      setSellerStatus({ seller: false, profileComplete: false });
    } finally {
      setLoadingSellerStatus(false);
    }
  };

  const validatePAN = (pan) => {
    if (!pan) return true;
    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panPattern.test(pan.toUpperCase());
  };

  const validateGSTIN = (gstin) => {
    if (!gstin) return true;
    const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinPattern.test(gstin.toUpperCase());
  };

  const handlePANChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 10) {
      setSellerForm({ ...sellerForm, panNumber: value });
    }
  };

  const handleGSTINChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 15) {
      setSellerForm({ ...sellerForm, gstin: value });
    }
  };

  const handleRegisterSeller = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!sellerForm.companyName.trim()) {
      setError('Company name is required');
      return;
    }

    if (sellerForm.panNumber && !validatePAN(sellerForm.panNumber)) {
      setError('PAN must be in format: ABCDE1234F');
      return;
    }

    if (sellerForm.gstin && !validateGSTIN(sellerForm.gstin)) {
      setError('GSTIN must be in format: 22AAAAA0000A1Z5');
      return;
    }

    setRegisteringSeller(true);
    try {
      await sellerService.registerAsSeller({
        companyName: sellerForm.companyName.trim(),
        companyAddress: sellerForm.companyAddress.trim() || null,
        panNumber: sellerForm.panNumber.trim() || null,
        gstin: sellerForm.gstin.trim() || null
      });
      setSuccess('Seller registration submitted successfully! Your profile is pending admin approval.');
      setShowSellerRegistration(false);
      setSellerForm({ companyName: '', companyAddress: '', panNumber: '', gstin: '' });
      loadSellerStatus();
      // Reload profile to get updated role
      loadProfile();
    } catch (err) {
      console.error('Seller registration error:', err);
      if (err.response?.status === 403) {
        setError('Access denied. Please make sure you are logged in as a regular user. If the problem persists, try logging out and logging back in.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to register as seller');
      }
    } finally {
      setRegisteringSeller(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '50px', textAlign: 'center' }}>
        <LoadingSpinner />
      </div>
    );
  }

  const user = authService.getCurrentUser();
  const getFullName = () => {
    if (!profile) return 'User';
    const parts = [profile.firstName, profile.middleName, profile.lastName].filter(Boolean);
    return parts.join(' ') || 'User';
  };
  const getInitials = () => {
    if (!profile) return '?';
    const initials = [];
    if (profile.firstName) initials.push(profile.firstName[0]);
    if (profile.lastName) initials.push(profile.lastName[0]);
    return initials.join('').toUpperCase() || '?';
  };
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(getFullName())}&background=007bff&color=fff&size=200&bold=true&font-size=0.4`;

  const sections = [
    { id: 'basic', label: 'Basic Information', icon: '👤' },
    { id: 'addresses', label: 'Addresses', icon: '📍' },
    { id: 'payments', label: 'Payment Methods', icon: '💳' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'seller', label: 'Seller Registration', icon: '🏪' }
  ];

  return (
    <div style={{ 
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: '24px',
      minHeight: 'calc(100vh - 60px)'
    }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '280px 1fr', 
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Sidebar */}
        <Card style={{ 
          padding: '0',
          position: 'sticky',
          top: '84px',
          maxHeight: 'calc(100vh - 108px)',
          overflowY: 'auto'
        }}>
          <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#007bff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '3px solid #e5e7eb',
                flexShrink: 0
              }}>
                {profile?.profilePicture ? (
                  <img 
                    src={profile.profilePicture} 
                    alt={getFullName()}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <img 
                    src={defaultAvatar}
                    alt={getFullName()}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.textContent = getInitials();
                      e.target.parentElement.style.fontSize = '24px';
                      e.target.parentElement.style.fontWeight = '600';
                      e.target.parentElement.style.color = 'white';
                    }}
                  />
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '18px', 
                  fontWeight: '700',
                  color: '#111827',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {getFullName()}
                </h3>
                <p style={{ 
                  margin: '4px 0 0 0', 
                  fontSize: '13px', 
                  color: '#6b7280',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {profile?.email || profile?.phone || ''}
                </p>
              </div>
            </div>
          </div>
          
          <nav style={{ padding: '8px' }}>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  setError('');
                  setSuccess('');
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  backgroundColor: activeSection === section.id ? '#eff6ff' : 'transparent',
                  color: activeSection === section.id ? '#007bff' : '#374151',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: activeSection === section.id ? '600' : '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  marginBottom: '4px'
                }}
                onMouseEnter={(e) => {
                  if (activeSection !== section.id) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeSection !== section.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: '20px' }}>{section.icon}</span>
                <span>{section.label}</span>
              </button>
            ))}
          </nav>
        </Card>

        {/* Main Content */}
        <div>
          {error && (
            <div style={{ 
              color: '#dc2626', 
              marginBottom: '16px', 
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
          {success && (
            <div style={{ 
              color: '#059669', 
              marginBottom: '16px', 
              padding: '12px 16px', 
              backgroundColor: '#ecfdf5', 
              borderRadius: '8px',
              border: '1px solid #a7f3d0',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {success}
            </div>
          )}

          {activeSection === 'basic' && (
            <Card>
              <h2 style={{ 
                marginTop: 0, 
                marginBottom: '24px', 
                fontSize: '24px', 
                fontWeight: '700',
                color: '#111827'
              }}>
                Basic Information
              </h2>
              
              {/* First Name Field */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    First Name *
                  </label>
                  {!editingFirstName && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditingFirstName(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>✏️</span>
                      <span>Edit</span>
                    </Button>
                  )}
                </div>
                {!editingFirstName ? (
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: '#f9fafb', 
                    borderRadius: '8px' 
                  }}>
                    <p style={{ margin: 0, fontSize: '15px', color: '#6b7280' }}>
                      {firstName || 'Not set'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <FormField
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      maxLength={50}
                      placeholder="John"
                      disabled={false}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={handleUpdateName}
                        disabled={saving}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleCancelNameEdit}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Middle Name Field */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    Middle Name
                  </label>
                  {!editingMiddleName && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditingMiddleName(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>✏️</span>
                      <span>Edit</span>
                    </Button>
                  )}
                </div>
                {!editingMiddleName ? (
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: '#f9fafb', 
                    borderRadius: '8px' 
                  }}>
                    <p style={{ margin: 0, fontSize: '15px', color: '#6b7280' }}>
                      {middleName || 'Not set'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <FormField
                      type="text"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      maxLength={50}
                      placeholder="Michael (optional)"
                      disabled={false}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={handleUpdateName}
                        disabled={saving}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleCancelNameEdit}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Last Name Field */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    Last Name *
                  </label>
                  {!editingLastName && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditingLastName(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>✏️</span>
                      <span>Edit</span>
                    </Button>
                  )}
                </div>
                {!editingLastName ? (
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: '#f9fafb', 
                    borderRadius: '8px' 
                  }}>
                    <p style={{ margin: 0, fontSize: '15px', color: '#6b7280' }}>
                      {lastName || 'Not set'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <FormField
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      maxLength={50}
                      placeholder="Doe"
                      disabled={false}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={handleUpdateName}
                        disabled={saving}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleCancelNameEdit}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
                
                {/* Email Field */}
                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                      Email
                    </label>
                    {!editingEmail && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingEmail(true);
                          setEmailStep(1);
                          setEmailOtp('');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>✏️</span>
                        <span>Edit</span>
                      </Button>
                    )}
                  </div>
                  {!editingEmail ? (
                    <div style={{ 
                      padding: '16px', 
                      backgroundColor: '#f9fafb', 
                      borderRadius: '8px' 
                    }}>
                      <p style={{ margin: 0, fontSize: '15px', color: '#6b7280' }}>
                        {profile?.email || 'Not set'}
                      </p>
                    </div>
                  ) : (
                    <div>
                      {emailStep === 1 ? (
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <FormField
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="your@email.com"
                              required
                            />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                            <Button 
                              type="button" 
                              onClick={handleSendEmailOtp} 
                              disabled={saving}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <span>📧</span>
                              <span>Send OTP</span>
                            </Button>
                            <Button 
                              type="button" 
                              variant="secondary"
                              onClick={() => {
                                setEditingEmail(false);
                                setEmail(profile?.email || '');
                                setEmailStep(1);
                                setEmailOtp('');
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <span>✕</span>
                              <span>Cancel</span>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p style={{ 
                            marginBottom: '16px', 
                            padding: '12px', 
                            backgroundColor: '#eff6ff', 
                            borderRadius: '8px',
                            fontSize: '14px',
                            color: '#1e40af'
                          }}>
                            OTP sent to: <strong>{email}</strong>
                          </p>
                          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                            <div style={{ flex: 1 }}>
                              <FormField
                                label="Enter OTP"
                                type="text"
                                value={emailOtp}
                                onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                maxLength="6"
                                placeholder="000000"
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                              <Button 
                                type="button" 
                                onClick={handleVerifyEmailOtp} 
                                disabled={saving || emailOtp.length !== 6}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <span>✓</span>
                                <span>Verify</span>
                              </Button>
                              <Button 
                                type="button" 
                                variant="secondary"
                                onClick={() => {
                                  setEmailStep(1);
                                  setEmailOtp('');
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <span>✕</span>
                                <span>Cancel</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Phone Field */}
                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                      Phone
                    </label>
                    {!editingPhone && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingPhone(true);
                          setPhoneStep(1);
                          setPhoneOtp('');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>✏️</span>
                        <span>Edit</span>
                      </Button>
                    )}
                  </div>
                  {!editingPhone ? (
                    <div style={{ 
                      padding: '16px', 
                      backgroundColor: '#f9fafb', 
                      borderRadius: '8px' 
                    }}>
                      <p style={{ margin: 0, fontSize: '15px', color: '#6b7280' }}>
                        {profile?.phone || 'Not set'}
                      </p>
                    </div>
                  ) : (
                    <div>
                      {phoneStep === 1 ? (
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <FormField
                              type="tel"
                              value={phone}
                              onChange={(e) => {
                                // Only allow digits, remove any non-digit characters except spaces, hyphens, parentheses
                                const value = e.target.value.replace(/[^\d\s\-\(\)]/g, '');
                                setPhone(value);
                              }}
                              placeholder="9876543210"
                              required
                              maxLength={15} // Allow some formatting characters
                            />
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                              Enter 10-digit phone number (e.g., 9876543210)
                            </p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                            <Button 
                              type="button" 
                              onClick={handleSendPhoneOtp} 
                              disabled={saving}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <span>📱</span>
                              <span>Send OTP</span>
                            </Button>
                            <Button 
                              type="button" 
                              variant="secondary"
                              onClick={() => {
                                setEditingPhone(false);
                                setPhone(profile?.phone || '');
                                setPhoneStep(1);
                                setPhoneOtp('');
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <span>✕</span>
                              <span>Cancel</span>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p style={{ 
                            marginBottom: '16px', 
                            padding: '12px', 
                            backgroundColor: '#eff6ff', 
                            borderRadius: '8px',
                            fontSize: '14px',
                            color: '#1e40af'
                          }}>
                            OTP sent to: <strong>{phone}</strong>
                          </p>
                          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                            <div style={{ flex: 1 }}>
                              <FormField
                                label="Enter OTP"
                                type="text"
                                value={phoneOtp}
                                onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                maxLength="6"
                                placeholder="000000"
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                              <Button 
                                type="button" 
                                onClick={handleVerifyPhoneOtp} 
                                disabled={saving || phoneOtp.length !== 6}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <span>✓</span>
                                <span>Verify</span>
                              </Button>
                              <Button 
                                type="button" 
                                variant="secondary"
                                onClick={() => {
                                  setPhoneStep(1);
                                  setPhoneOtp('');
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <span>✕</span>
                                <span>Cancel</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ 
                  marginTop: '12px', 
                  padding: '16px', 
                  backgroundColor: '#f9fafb', 
                  borderRadius: '8px' 
                }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    Primary Contact
                  </p>
                  <p style={{ margin: 0, fontSize: '15px', color: '#6b7280' }}>
                    {profile?.primaryContactType || 'N/A'}
                  </p>
                </div>
            </Card>
          )}

          {activeSection === 'addresses' && (
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: '24px', 
                  fontWeight: '700',
                  color: '#111827'
                }}>
                  Addresses
                </h2>
                {!showAddressForm && (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleAddNewAddress}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>➕</span>
                    <span>Add New Address</span>
                  </Button>
                )}
              </div>

              {/* Address List */}
              {!showAddressForm && (
                <div>
                  {addresses.length === 0 ? (
                    <div style={{ 
                      padding: '40px', 
                      textAlign: 'center',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px'
                    }}>
                      <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                        No addresses added yet. Click "Add New Address" to add one.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {addresses.map((address) => (
                        <div 
                          key={address.id} 
                          style={{ 
                            padding: '16px', 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '8px',
                            backgroundColor: '#ffffff'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                                {address.label} {address.isDefault && (
                                  <span style={{ 
                                    marginLeft: '8px',
                                    padding: '2px 8px',
                                    backgroundColor: '#dcfce7',
                                    color: '#166534',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: '600'
                                  }}>
                                    Default
                                  </span>
                                )}
                              </p>
                              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
                                {address.street}, {address.city}, {address.state} {address.postalCode}, {address.country}
                              </p>
                              {address.recipientName && (
                                <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                                  <strong>Recipient:</strong> {address.recipientName} ({address.recipientPhone})
                                </p>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <Button 
                                type="button" 
                                variant="secondary"
                                size="sm"
                                onClick={() => handleEditAddress(address)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <span>✏️</span>
                                <span>Edit</span>
                              </Button>
                              <Button 
                                type="button" 
                                variant="danger"
                                size="sm"
                                onClick={() => handleDeleteAddress(address.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <span>🗑️</span>
                                <span>Delete</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Address Form */}
              {showAddressForm && (
                <form onSubmit={handleSaveAddress}>
                <FormField
                  label="Label *"
                  type="text"
                  value={addressForm.label}
                  onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                  placeholder="Home, Work, etc."
                  required
                  maxLength={100}
                />
                <FormField
                  label="Street Address *"
                  type="text"
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                  required
                  maxLength={200}
                />
                <PincodeInput
                  value={addressForm.pincode}
                  onChange={(value) => {
                    // Only update if value actually changed to prevent unnecessary re-renders
                    if (addressForm.pincode !== value) {
                      setAddressForm(prev => ({ ...prev, pincode: value }));
                      // Clear pincode info when pincode changes
                      if (value.length < 6) {
                        setPincodeInfo(null);
                      }
                    }
                  }}
                  onPincodeLookup={handlePincodeLookup}
                  required={true}
                  showCityState={true}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <FormField
                    label="City (Auto-filled from pincode)"
                    type="text"
                    value={addressForm.city || ''}
                    required
                    readOnly={true}
                    disabled={true}
                  />
                  <FormField
                    label="State/Province (Auto-filled from pincode)"
                    type="text"
                    value={addressForm.state || ''}
                    required
                    readOnly={true}
                    disabled={true}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <FormField
                    label="Postal Code (Auto-filled from pincode)"
                    type="text"
                    value={addressForm.postalCode || ''}
                    onChange={(e) => {
                      if (!pincodeInfo) {
                        setAddressForm({ ...addressForm, postalCode: e.target.value });
                      }
                    }}
                    required
                    style={{ backgroundColor: pincodeInfo ? '#f5f5f5' : 'white', cursor: pincodeInfo ? 'not-allowed' : 'text' }}
                    readOnly={!!pincodeInfo}
                    disabled={!!pincodeInfo}
                  />
                  <FormField
                    label="Country *"
                    type="text"
                    value={addressForm.country}
                    onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                    required
                    maxLength={100}
                  />
                </div>
                
                {/* Recipient Information */}
                <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    marginBottom: '16px',
                    color: '#374151'
                  }}>
                    Recipient Information
                  </h3>
                  
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '16px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    <input
                      type="checkbox"
                      checked={addressForm.useMyDetails}
                      disabled={!profile?.phone}
                      onChange={(e) => {
                        const useMyDetails = e.target.checked;
                        setAddressForm({ 
                          ...addressForm, 
                          useMyDetails,
                          recipientName: useMyDetails ? getFullName() : addressForm.recipientName,
                          recipientPhone: useMyDetails ? (profile?.phone || '') : addressForm.recipientPhone
                        });
                      }}
                      style={{ marginRight: '8px', width: '18px', height: '18px', cursor: profile?.phone ? 'pointer' : 'not-allowed' }}
                    />
                    <span>Use my name and mobile number</span>
                    {!profile?.phone && (
                      <span style={{ marginLeft: '8px', fontSize: '12px', color: '#dc2626' }}>
                        (Please add your mobile number in Basic Info first)
                      </span>
                    )}
                  </label>
                  
                  <FormField
                    label="Recipient Name *"
                    type="text"
                    value={addressForm.recipientName}
                    onChange={(e) => {
                      // Only allow letters, spaces, hyphens, apostrophes
                      const value = e.target.value.replace(/[^a-zA-Z\s\-']/g, '');
                      setAddressForm({ ...addressForm, recipientName: value });
                    }}
                    disabled={addressForm.useMyDetails}
                    required
                    maxLength={100}
                    placeholder="John Doe"
                  />
                  <FormField
                    label="Recipient Mobile Number *"
                    type="tel"
                    value={addressForm.recipientPhone}
                    onChange={(e) => {
                      // Only allow digits, spaces, hyphens, parentheses
                      const value = e.target.value.replace(/[^\d\s\-\(\)]/g, '');
                      setAddressForm({ ...addressForm, recipientPhone: value });
                    }}
                    disabled={addressForm.useMyDetails}
                    placeholder="9876543210"
                    required
                    maxLength={15}
                  />
                  {addressForm.recipientPhone && !addressForm.useMyDetails && (
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                      Enter 10-digit phone number (e.g., 9876543210)
                    </p>
                  )}
                </div>
                
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginTop: '20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#374151'
                }}>
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  Set as default address
                </label>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={saving}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>{editingAddress ? '✏️' : '➕'}</span>
                    <span>{editingAddress ? 'Update Address' : 'Add Address'}</span>
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={handleCancelAddressForm}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>✕</span>
                    <span>Cancel</span>
                  </Button>
                </div>
              </form>
              )}
            </Card>
          )}

          {activeSection === 'payments' && (
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: '24px', 
                  fontWeight: '700',
                  color: '#111827'
                }}>
                  Payment Methods
                </h2>
                {!showPaymentForm && (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleAddNewPaymentMethod}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>➕</span>
                    <span>Add New Payment Method</span>
                  </Button>
                )}
              </div>

              {/* Payment Methods List */}
              {!showPaymentForm && (
                <div>
                  {paymentMethods.length === 0 ? (
                    <div style={{ 
                      padding: '40px', 
                      textAlign: 'center',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px'
                    }}>
                      <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                        No payment methods added yet. Click "Add New Payment Method" to add one.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {paymentMethods.map((method) => (
                        <div 
                          key={method.id} 
                          style={{ 
                            padding: '16px', 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '8px',
                            backgroundColor: '#ffffff'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                                {method.type === 'CARD' ? '💳 Credit/Debit Card' :
                                 method.type === 'BANK_ACCOUNT' ? '🏦 Bank Account' :
                                 method.type === 'DIGITAL_WALLET' ? '📱 Digital Wallet' :
                                 method.type === 'UPI' ? '📲 UPI' : method.type} - {method.provider} {method.isDefault && (
                                  <span style={{ 
                                    marginLeft: '8px',
                                    padding: '2px 8px',
                                    backgroundColor: '#dcfce7',
                                    color: '#166534',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: '600'
                                  }}>
                                    Default
                                  </span>
                                )}
                              </p>
                              {method.lastFourDigits && (
                                <p style={{ margin: '4px 0', fontSize: '14px', color: '#6b7280' }}>
                                  ****{method.lastFourDigits}
                                </p>
                              )}
                              {method.upiId && (
                                <p style={{ margin: '4px 0', fontSize: '14px', color: '#6b7280' }}>
                                  UPI ID: {method.upiId}
                                </p>
                              )}
                              {method.cardExpiry && (
                                <p style={{ margin: '4px 0', fontSize: '14px', color: '#6b7280' }}>
                                  Expires: {method.cardExpiry}
                                </p>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <Button 
                                type="button" 
                                variant="secondary"
                                size="sm"
                                onClick={() => handleEditPaymentMethod(method)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <span>✏️</span>
                                <span>Edit</span>
                              </Button>
                              <Button 
                                type="button" 
                                variant="danger"
                                size="sm"
                                onClick={() => handleDeletePaymentMethod(method.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <span>🗑️</span>
                                <span>Delete</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Payment Method Form */}
              {showPaymentForm && (
                <form onSubmit={handleSavePaymentMethod}>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Type <span style={{ color: '#dc3545', marginLeft: '2px' }}> *</span>
                  </label>
                  <Select
                    value={paymentForm.type}
                    onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value, upiId: '', lastFourDigits: '', cardExpiry: '' })}
                  >
                    <option value="CARD">Credit/Debit Card</option>
                    <option value="BANK_ACCOUNT">Bank Account</option>
                    <option value="DIGITAL_WALLET">Digital Wallet</option>
                    <option value="UPI">UPI</option>
                  </Select>
                </div>
                <FormField
                  label="Provider *"
                  type="text"
                  value={paymentForm.provider}
                  onChange={(e) => setPaymentForm({ ...paymentForm, provider: e.target.value })}
                  placeholder={paymentForm.type === 'UPI' ? 'PhonePe, GooglePay, etc.' : 'Visa, Mastercard, PayPal, etc.'}
                  required
                  maxLength={100}
                />
                {paymentForm.type === 'UPI' ? (
                  <>
                    <FormField
                      label="UPI ID *"
                      type="text"
                      value={paymentForm.upiId}
                      onChange={(e) => setPaymentForm({ ...paymentForm, upiId: e.target.value })}
                      placeholder="yourname@paytm"
                      required
                      maxLength={256}
                    />
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                      Format: username@provider (e.g., yourname@paytm, yourname@ybl)
                    </p>
                  </>
                ) : (
                  <>
                    <FormField
                      label="Last 4 Digits"
                      type="text"
                      value={paymentForm.lastFourDigits}
                      onChange={(e) => setPaymentForm({ ...paymentForm, lastFourDigits: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                      maxLength="4"
                      placeholder="1234"
                    />
                    {paymentForm.type === 'CARD' && (
                      <>
                        <FormField
                          label="Expiry (MM/YY)"
                          type="text"
                          value={paymentForm.cardExpiry}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length >= 2) {
                              value = value.slice(0, 2) + '/' + value.slice(2, 4);
                            }
                            setPaymentForm({ ...paymentForm, cardExpiry: value });
                          }}
                          placeholder="12/25"
                          maxLength="5"
                        />
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                          Format: MM/YY (e.g., 12/25)
                        </p>
                      </>
                    )}
                  </>
                )}
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginTop: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#374151'
                }}>
                  <input
                    type="checkbox"
                    checked={paymentForm.isDefault}
                    onChange={(e) => setPaymentForm({ ...paymentForm, isDefault: e.target.checked })}
                    style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  Set as default payment method
                </label>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={saving}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>{editingPayment ? '✏️' : '➕'}</span>
                    <span>{editingPayment ? 'Update Payment Method' : 'Add Payment Method'}</span>
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={handleCancelPaymentForm}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>✕</span>
                    <span>Cancel</span>
                  </Button>
                </div>
              </form>
              )}
            </Card>
          )}

          {activeSection === 'security' && (
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: '24px', 
                  fontWeight: '700',
                  color: '#111827'
                }}>
                  Security Settings
                </h2>
                {!showPasswordForm && (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleAddNewPassword}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>🔒</span>
                    <span>{profile?.loginMethods?.includes('PASSWORD') ? 'Update Password' : 'Set Password'}</span>
                  </Button>
                )}
              </div>

              {/* Password Status */}
              {!showPasswordForm && (
                <div style={{ 
                  marginBottom: '40px',
                  padding: '16px',
                  backgroundColor: profile?.loginMethods?.includes('PASSWORD') ? '#dcfce7' : '#fef3c7',
                  borderRadius: '8px',
                  border: `1px solid ${profile?.loginMethods?.includes('PASSWORD') ? '#86efac' : '#fde68a'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>
                      {profile?.loginMethods?.includes('PASSWORD') ? '✅' : '⚠️'}
                    </span>
                    <div>
                      <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                        Password {profile?.loginMethods?.includes('PASSWORD') ? 'Enabled' : 'Not Set'}
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                        {profile?.loginMethods?.includes('PASSWORD') 
                          ? 'Your account is protected with a password. Click "Update Password" to change it.' 
                          : 'Set a password to enable password-based login for your account.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Password Form */}
              {showPasswordForm && (
                <div style={{ marginBottom: '40px' }}>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    marginBottom: '8px',
                    color: '#374151'
                  }}>
                    {profile?.loginMethods?.includes('PASSWORD') ? 'Update Password' : 'Set Password'}
                  </h3>
                  <p style={{ 
                    color: '#6b7280', 
                    marginBottom: '20px', 
                    fontSize: '14px'
                  }}>
                    {profile?.loginMethods?.includes('PASSWORD') 
                      ? 'Update your password to keep your account secure' 
                      : 'Set a password to enable password-based login'}
                  </p>
                  <form onSubmit={handleSetPassword}>
                    <FormField
                      label="New Password *"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength="6"
                      maxLength="128"
                      placeholder="Enter new password"
                    />
                    <p style={{ margin: '4px 0 12px 0', fontSize: '12px', color: '#6b7280' }}>
                      Password must be at least 6 characters and contain at least one letter and one number
                    </p>
                    <FormField
                      label="Confirm Password *"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength="6"
                      maxLength="128"
                      placeholder="Confirm new password"
                    />
                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                      <Button 
                        type="submit" 
                        variant="primary" 
                        disabled={saving || newPassword.length < 6 || confirmPassword.length < 6 || newPassword !== confirmPassword} 
                        style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <span>{saving ? '⏳' : '🔒'}</span>
                        <span>{saving ? 'Updating...' : (profile?.loginMethods?.includes('PASSWORD') ? 'Update Password' : 'Set Password')}</span>
                      </Button>
                      <Button 
                        type="button" 
                        variant="secondary" 
                        onClick={handleCancelPasswordForm}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>✕</span>
                        <span>Cancel</span>
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              <div>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  marginBottom: '8px',
                  color: '#374151'
                }}>
                  Login Methods
                </h3>
                <p style={{ 
                  color: '#6b7280', 
                  marginBottom: '20px', 
                  fontSize: '14px'
                }}>
                  Select which login methods you want to enable for your account
                </p>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                  >
                    <input
                      type="checkbox"
                      checked={loginMethods.includes('OTP')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setLoginMethods([...loginMethods, 'OTP']);
                        } else {
                          setLoginMethods(loginMethods.filter(m => m !== 'OTP'));
                        }
                      }}
                      style={{ 
                        marginRight: '12px', 
                        width: '20px', 
                        height: '20px', 
                        cursor: 'pointer'
                      }}
                    />
                    <div>
                      <span style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                        OTP (One-Time Password)
                      </span>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                        Login using a code sent to your email or phone
                      </p>
                    </div>
                  </label>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                  >
                    <input
                      type="checkbox"
                      checked={loginMethods.includes('PASSWORD')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (!profile?.passwordHash) {
                            setError('Please set a password first');
                            return;
                          }
                          setLoginMethods([...loginMethods, 'PASSWORD']);
                        } else {
                          setLoginMethods(loginMethods.filter(m => m !== 'PASSWORD'));
                        }
                      }}
                      style={{ 
                        marginRight: '12px', 
                        width: '20px', 
                        height: '20px', 
                        cursor: 'pointer'
                      }}
                    />
                    <div>
                      <span style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                        Password
                      </span>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                        Login using your email and password
                      </p>
                    </div>
                  </label>
                </div>
                <Button 
                  type="button" 
                  variant="primary" 
                  onClick={handleUpdateLoginMethods} 
                  disabled={saving || loginMethods.length === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>{saving ? '⏳' : '💾'}</span>
                  <span>{saving ? 'Saving...' : 'Update Login Methods'}</span>
                </Button>
              </div>
            </Card>
          )}

          {activeSection === 'seller' && (
            <Card>
              <h2 style={{ 
                marginTop: 0, 
                marginBottom: '24px', 
                fontSize: '24px', 
                fontWeight: '700',
                color: '#111827'
              }}>
                Seller Registration
              </h2>

              {loadingSellerStatus ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <LoadingSpinner />
                </div>
              ) : (
                <>
                  {sellerStatus?.seller ? (
                    <div>
                      <div style={{ 
                        padding: '16px', 
                        backgroundColor: sellerStatus.profileComplete ? '#dcfce7' : '#fef3c7',
                        borderRadius: '8px',
                        border: `1px solid ${sellerStatus.profileComplete ? '#86efac' : '#fde68a'}`,
                        marginBottom: '24px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '24px' }}>
                            {sellerStatus.profileComplete ? '✅' : '⚠️'}
                          </span>
                          <div>
                            <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                              Seller Account {sellerStatus.profileComplete ? 'Active' : 'Incomplete'}
                            </p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                              {sellerStatus.profileComplete 
                                ? 'Your seller profile is complete. You can now manage your products and orders.'
                                : 'Complete your seller profile to start selling.'}
                            </p>
                          </div>
                        </div>
                        {sellerStatus.profileStatus && (
                          <Badge 
                            style={{ 
                              backgroundColor: sellerStatus.profileStatus === 'APPROVED' ? '#28a745' : 
                                            sellerStatus.profileStatus === 'REJECTED' ? '#dc3545' : '#ffc107',
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600',
                              marginTop: '8px',
                              display: 'inline-block'
                            }}
                          >
                            Status: {sellerStatus.profileStatus}
                          </Badge>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <Button 
                          variant="primary" 
                          onClick={() => window.open('http://localhost:3002/dashboard', '_blank')}
                        >
                          Go to Seller Dashboard
                        </Button>
                        {!sellerStatus.profileComplete && (
                          <Button 
                            variant="secondary" 
                            onClick={() => window.open('http://localhost:3002/profile', '_blank')}
                          >
                            Complete Profile
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ 
                        padding: '16px', 
                        backgroundColor: '#eff6ff',
                        borderRadius: '8px',
                        border: '1px solid #bfdbfe',
                        marginBottom: '24px'
                      }}>
                        <p style={{ margin: 0, fontSize: '15px', color: '#1e40af' }}>
                          Register as a seller to start selling your products on BulkBy. You'll need to provide company details, PAN, and GSTIN.
                        </p>
                      </div>

                      {!showSellerRegistration ? (
                        <Button 
                          variant="primary" 
                          onClick={() => setShowSellerRegistration(true)}
                        >
                          Register as Seller
                        </Button>
                      ) : (
                        <form onSubmit={handleRegisterSeller}>
                          <FormField
                            label="Company Name *"
                            value={sellerForm.companyName}
                            onChange={(e) => setSellerForm({ ...sellerForm, companyName: e.target.value })}
                            required
                            maxLength={200}
                          />

                          <div className="form-group">
                            <label>Company Address</label>
                            <textarea
                              value={sellerForm.companyAddress}
                              onChange={(e) => setSellerForm({ ...sellerForm, companyAddress: e.target.value })}
                              rows={4}
                            />
                          </div>

                          <FormField
                            label="PAN Number *"
                            value={sellerForm.panNumber}
                            onChange={handlePANChange}
                            placeholder="ABCDE1234F"
                            maxLength={10}
                            required
                            style={{ 
                              textTransform: 'uppercase',
                              fontFamily: 'monospace',
                              letterSpacing: '2px'
                            }}
                          />
                          <small style={{ display: 'block', marginTop: '4px', color: '#6b7280', marginBottom: '16px' }}>
                            Format: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)
                          </small>

                          <FormField
                            label="GSTIN *"
                            value={sellerForm.gstin}
                            onChange={handleGSTINChange}
                            placeholder="22AAAAA0000A1Z5"
                            maxLength={15}
                            required
                            style={{ 
                              textTransform: 'uppercase',
                              fontFamily: 'monospace',
                              letterSpacing: '1px'
                            }}
                          />
                          <small style={{ display: 'block', marginTop: '4px', color: '#6b7280', marginBottom: '16px' }}>
                            Format: 2 digits, 5 letters, 4 digits, 1 letter, 1 char, Z, 1 char (e.g., 22AAAAA0000A1Z5)
                          </small>

                          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <Button 
                              type="submit" 
                              variant="primary" 
                              disabled={registeringSeller}
                            >
                              {registeringSeller ? 'Registering...' : 'Submit Registration'}
                            </Button>
                            <Button 
                              type="button" 
                              variant="secondary" 
                              onClick={() => {
                                setShowSellerRegistration(false);
                                setSellerForm({ companyName: '', companyAddress: '', panNumber: '', gstin: '' });
                                setError('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
