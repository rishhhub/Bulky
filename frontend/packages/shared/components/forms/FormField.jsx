import React from 'react';
import { Input } from '../ui/Input.jsx';

/**
 * Form field with label and input
 * @param {Object} props
 * @param {string} props.label - Field label
 * @param {string} props.error - Error message
 * @param {boolean} props.required - Required field indicator
 */
export const FormField = ({
  label,
  error,
  required,
  helperText,
  ...inputProps
}) => {
  return (
    <div className="form-group" style={{ marginBottom: '20px' }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: '600',
          color: '#374151'
        }}>
          {label}
          {required && <span style={{ color: '#dc3545', marginLeft: '2px' }}> *</span>}
        </label>
      )}
      <Input error={error} {...inputProps} />
      {helperText && !error && (
        <small style={{ display: 'block', marginTop: '4px', color: '#6b7280', fontSize: '13px' }}>
          {helperText}
        </small>
      )}
    </div>
  );
};

export default FormField;
