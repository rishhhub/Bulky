import React from 'react';

/**
 * Text input component
 * @param {Object} props
 * @param {string} props.type - Input type
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.error - Error message
 */
export const Input = ({
  type = 'text',
  className = '',
  error,
  readOnly,
  disabled,
  onFocus,
  onBlur,
  ...props
}) => {
  const inputClasses = [
    'form-control',
    error ? 'is-invalid' : '',
    className
  ].filter(Boolean).join(' ');

  const isReadOnlyOrDisabled = readOnly || disabled;

  const handleFocus = (e) => {
    if (isReadOnlyOrDisabled) {
      e.target.blur(); // Prevent focus on read-only/disabled fields
      return;
    }
    if (!error) {
      e.target.style.borderColor = '#007bff';
      e.target.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
    }
    if (onFocus) {
      onFocus(e);
    }
  };

  const handleBlur = (e) => {
    if (!error) {
      e.target.style.borderColor = '#e0e0e0';
      e.target.style.boxShadow = 'none';
    }
    if (onBlur) {
      onBlur(e);
    }
  };

  const handleKeyDown = (e) => {
    if (isReadOnlyOrDisabled) {
      e.preventDefault(); // Prevent typing in read-only/disabled fields
    }
  };

  return (
    <div>
      <input
        type={type}
        className={inputClasses}
        readOnly={readOnly}
        disabled={disabled}
        style={{
          borderColor: error ? '#dc3545' : '#e0e0e0',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '15px',
          transition: 'all 0.2s ease',
          backgroundColor: isReadOnlyOrDisabled ? '#f5f5f5' : '#ffffff',
          cursor: isReadOnlyOrDisabled ? 'not-allowed' : 'text',
          ...props.style
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        {...props}
      />
      {error && (
        <div style={{ color: '#dc3545', fontSize: '13px', marginTop: '6px', fontWeight: '500' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default Input;
