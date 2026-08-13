import React from 'react';

/**
 * Form textarea with label
 * @param {Object} props
 * @param {string} props.label - Field label
 * @param {string} props.error - Error message
 * @param {boolean} props.required - Required field indicator
 */
export const FormTextarea = ({
  label,
  error,
  required,
  className = '',
  ...textareaProps
}) => {
  const classes = [
    'form-control',
    error ? 'is-invalid' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="form-group">
      {label && (
        <label>
          {label}
          {required && <span style={{ color: '#dc3545' }}> *</span>}
        </label>
      )}
      <textarea
        className={classes}
        style={{
          borderColor: error ? '#dc3545' : undefined
        }}
        {...textareaProps}
      />
      {error && (
        <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '5px' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default FormTextarea;
