import React from 'react';

/**
 * Dropdown select component
 * @param {Object} props
 * @param {Array} props.options - Array of {value, label} objects
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.error - Error message
 */
export const Select = ({
  options = [],
  className = '',
  error,
  children,
  ...props
}) => {
  const selectClasses = [
    'form-control',
    error ? 'is-invalid' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div>
      <select
        className={selectClasses}
        style={{
          borderColor: error ? '#dc3545' : '#e0e0e0',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '15px',
          transition: 'all 0.2s ease',
          backgroundColor: '#ffffff',
          width: '100%',
          cursor: 'pointer',
          ...props.style
        }}
        onFocus={(e) => {
          if (!error) {
            e.target.style.borderColor = '#007bff';
            e.target.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
          }
        }}
        onBlur={(e) => {
          if (!error) {
            e.target.style.borderColor = '#e0e0e0';
            e.target.style.boxShadow = 'none';
          }
        }}
        {...props}
      >
        {children || options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <div style={{ color: '#dc3545', fontSize: '13px', marginTop: '6px', fontWeight: '500' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default Select;
