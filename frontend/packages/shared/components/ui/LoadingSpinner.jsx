import React from 'react';

/**
 * Loading spinner component
 * @param {Object} props
 * @param {string} props.size - Size: 'sm', 'md', 'lg'
 * @param {string} props.className - Additional CSS classes
 */
export const LoadingSpinner = ({
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: { width: '20px', height: '20px', borderWidth: '2px' },
    md: { width: '40px', height: '40px', borderWidth: '3px' },
    lg: { width: '60px', height: '60px', borderWidth: '4px' }
  };

  const style = {
    border: `${sizeStyles[size].borderWidth} solid #f3f3f3`,
    borderTop: `${sizeStyles[size].borderWidth} solid #007bff`,
    borderRadius: '50%',
    width: sizeStyles[size].width,
    height: sizeStyles[size].height,
    animation: 'spin 1s linear infinite',
    ...props.style
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}
      className={className}
    >
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={style} {...props}></div>
    </div>
  );
};

export default LoadingSpinner;
