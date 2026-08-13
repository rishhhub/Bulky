import React from 'react';
import { Select } from '../ui/Select.jsx';

/**
 * Form select with label
 * @param {Object} props
 * @param {string} props.label - Field label
 * @param {Array} props.options - Select options
 * @param {string} props.error - Error message
 * @param {boolean} props.required - Required field indicator
 */
export const FormSelect = ({
  label,
  options = [],
  error,
  required,
  helperText,
  ...selectProps
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
      <Select options={options} error={error} {...selectProps} />
      {error && (
        <div style={{ color: '#dc3545', fontSize: '13px', marginTop: '6px', fontWeight: '500' }}>
          {error}
        </div>
      )}
      {helperText && !error && (
        <small style={{ display: 'block', marginTop: '4px', color: '#6b7280', fontSize: '13px' }}>
          {helperText}
        </small>
      )}
    </div>
  );
};

export default FormSelect;
