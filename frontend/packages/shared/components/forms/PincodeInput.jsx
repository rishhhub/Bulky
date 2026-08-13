import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LoadingSpinner } from '../ui';
import { logger } from '../../utils/logger.js';

export const PincodeInput = ({ 
  value, 
  onChange, 
  onPincodeLookup, 
  required = false,
  disabled = false,
  error = null,
  showCityState = true
}) => {
  const [pincode, setPincode] = useState(value || '');
  const [loading, setLoading] = useState(false);
  const [pincodeInfo, setPincodeInfo] = useState(null);
  const [lookupError, setLookupError] = useState(null);
  const isUserTypingRef = useRef(false);
  const inputRef = useRef(null);
  const previousValueRef = useRef(value);
  const wasFocusedRef = useRef(false);
  const lastLookupPincodeRef = useRef(null); // Track last looked up pincode to prevent duplicates

  // Initialize local state from prop on mount
  useEffect(() => {
    if (value !== undefined) {
      setPincode(value || '');
      previousValueRef.current = value;
      // If there's an initial value and it's a valid pincode, allow lookup
      if (value && value.length === 6 && /^\d{6}$/.test(value)) {
        lastLookupPincodeRef.current = null; // Reset to allow lookup of initial value
      }
    }
  }, []); // Only run on mount

  // Sync with external value changes (but not during user typing or when input is focused)
  useEffect(() => {
    // Only sync if:
    // 1. Value prop changed externally (different from previous ref)
    // 2. User is not currently typing
    // 3. Input is not currently focused
    // 4. The new value is different from current local state
    const valueChangedExternally = previousValueRef.current !== value;
    const isFocused = document.activeElement === inputRef.current;
    
    if (valueChangedExternally && !isUserTypingRef.current && !isFocused && value !== undefined && value !== pincode) {
      setPincode(value || '');
      previousValueRef.current = value;
      // Clear info when value is reset externally
      if (!value || value.length < 6) {
        setPincodeInfo(null);
        setLookupError(null);
      }
    } else if (valueChangedExternally) {
      // Update ref even if we don't sync (to track external changes)
      previousValueRef.current = value;
    }
  }, [value]);

  const handlePincodeLookup = useCallback(async (pincodeValue) => {
    if (!pincodeValue || pincodeValue.length !== 6 || !/^\d{6}$/.test(pincodeValue)) {
      return;
    }

    if (!onPincodeLookup) {
      return;
    }

    setLoading(true);
    setLookupError(null);
    
    try {
      const info = await onPincodeLookup(pincodeValue);
      if (info) {
        setPincodeInfo(info);
        if (!info.serviceable) {
          setLookupError('This pincode is not serviceable');
        }
      } else {
        setPincodeInfo(null);
        setLookupError('Pincode not found');
      }
    } catch (err) {
      logger.error('Pincode lookup error:', err);
      setPincodeInfo(null);
      if (err.response?.status === 404) {
        setLookupError('Pincode not found');
      } else if (err.message) {
        setLookupError(err.message);
      } else {
        setLookupError(err.response?.data?.message || 'Error looking up pincode');
      }
    } finally {
      setLoading(false);
    }
  }, [onPincodeLookup]);

  useEffect(() => {
    let isMounted = true;
    let timeoutId;
    
    // Debounce the lookup to allow user to finish typing
    if (pincode && pincode.length === 6 && /^\d{6}$/.test(pincode)) {
      // Only lookup if this pincode hasn't been looked up yet
      // The debounce timeout handles waiting for user to finish typing
      if (lastLookupPincodeRef.current !== pincode) {
        timeoutId = setTimeout(() => {
          // Double-check that pincode hasn't changed during the timeout and hasn't been looked up
          if (isMounted && lastLookupPincodeRef.current !== pincode && pincode.length === 6 && /^\d{6}$/.test(pincode)) {
            lastLookupPincodeRef.current = pincode;
            handlePincodeLookup(pincode).catch(err => {
              if (isMounted) {
                logger.error('Pincode lookup failed:', err);
                // Reset the ref on error so it can be retried
                if (lastLookupPincodeRef.current === pincode) {
                  lastLookupPincodeRef.current = null;
                }
              }
            });
          }
        }, 500); // Wait 500ms after user stops typing
      }
    } else if (pincode.length < 6) {
      // Clear info if pincode is being edited and is less than 6 digits
      if (isMounted) {
        setPincodeInfo(null);
        setLookupError(null);
        // Reset lookup ref when pincode is cleared so it can be looked up again when complete
        if (pincode.length === 0) {
          lastLookupPincodeRef.current = null;
        }
      }
    }
    
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [pincode, handlePincodeLookup]); // Include handlePincodeLookup but it's memoized in parent

  const handleChange = (e) => {
    try {
      isUserTypingRef.current = true;
      const newValue = e.target.value.replace(/\D/g, '').slice(0, 6); // Only digits, max 6
      // Clear pincode info when user starts editing
      if (newValue.length < 6 && pincodeInfo) {
        setPincodeInfo(null);
        setLookupError(null);
      }
      setPincode(newValue);
      // Update the ref to track this as our change (not external)
      previousValueRef.current = newValue;
      if (onChange) {
        onChange(newValue);
      }
      // Reset the typing flag after a longer delay to prevent sync during rapid typing
      setTimeout(() => {
        isUserTypingRef.current = false;
      }, 300);
    } catch (err) {
      logger.error('Error in handleChange:', err);
      isUserTypingRef.current = false;
    }
  };

  const displayError = error || lookupError;

  return (
    <div style={{ marginBottom: '15px' }}>
      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
        Pincode {required && <span style={{ color: 'red' }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={pincode}
          onChange={handleChange}
          onFocus={() => {
            wasFocusedRef.current = true;
          }}
          onBlur={() => {
            wasFocusedRef.current = false;
          }}
          placeholder="Enter 6-digit pincode"
          required={required}
          disabled={disabled || loading}
          maxLength={6}
          pattern="\d{6}"
          style={{
            width: '100%',
            padding: '10px',
            paddingRight: loading ? '40px' : '10px',
            border: displayError ? '2px solid #dc3545' : '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        />
        {loading && (
          <div style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)'
          }}>
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>
      
      {showCityState && pincodeInfo && !displayError && pincodeInfo.cityName && (
        <div style={{
          marginTop: '8px',
          padding: '10px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          <div style={{ fontWeight: '500', color: '#0369a1' }}>
            {pincodeInfo.cityName || 'Unknown'}, {pincodeInfo.stateName || 'Unknown'} {pincodeInfo.stateCode ? `(${pincodeInfo.stateCode})` : ''}
          </div>
          {pincodeInfo.serviceable === false && (
            <div style={{ color: '#dc2626', marginTop: '4px', fontSize: '12px' }}>
              ⚠️ This pincode is not serviceable
            </div>
          )}
        </div>
      )}
      
      {displayError && (
        <div style={{
          marginTop: '5px',
          color: '#dc3545',
          fontSize: '12px'
        }}>
          {displayError}
        </div>
      )}
      
      {pincode && pincode.length > 0 && pincode.length < 6 && (
        <div style={{
          marginTop: '5px',
          color: '#666',
          fontSize: '12px'
        }}>
          Enter {6 - pincode.length} more digit{pincode.length < 5 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default PincodeInput;
