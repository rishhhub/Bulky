import React from 'react';

/**
 * Form checkbox with label
 * @param {Object} props
 * @param {string} props.label - Checkbox label
 * @param {string} props.error - Error message
 */
export const FormCheckbox = ({
  label,
  error,
  ...checkboxProps
}) => {
  return (
    <div className="form-group">
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          style={{
            width: '18px',
            height: '18px',
            cursor: 'pointer'
          }}
          {...checkboxProps}
        />
        {label}
      </label>
      {error && (
        <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '5px' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default FormCheckbox;
