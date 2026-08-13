import React from 'react';

/**
 * Button component with variants
 * @param {Object} props
 * @param {string} props.variant - Button variant: 'primary', 'secondary', 'success', 'danger', 'warning', 'info'
 * @param {string} props.size - Button size: 'sm', 'md', 'lg'
 * @param {boolean} props.disabled - Disabled state
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Button content
 */
export const Button = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  children,
  ...props
}) => {
  const variantStyles = {
    primary: { backgroundColor: '#007bff', color: 'white', border: '1px solid #007bff' },
    secondary: { backgroundColor: '#6c757d', color: 'white', border: '1px solid #6c757d' },
    success: { backgroundColor: '#28a745', color: 'white', border: '1px solid #28a745' },
    danger: { backgroundColor: '#dc3545', color: 'white', border: '1px solid #dc3545' },
    warning: { backgroundColor: '#ffc107', color: '#212529', border: '1px solid #ffc107' },
    info: { backgroundColor: '#17a2b8', color: 'white', border: '1px solid #17a2b8' },
    text: { backgroundColor: 'transparent', color: '#007bff', border: 'none', textDecoration: 'underline' }
  };

  const sizeStyles = {
    sm: { padding: '4px 12px', fontSize: '14px' },
    md: { padding: '8px 16px', fontSize: '16px' },
    lg: { padding: '12px 24px', fontSize: '18px' }
  };

  const getHoverStyle = (variant) => {
    const hoverColors = {
      primary: '#0056b3',
      secondary: '#545b62',
      success: '#218838',
      danger: '#c82333',
      warning: '#e0a800',
      info: '#138496'
    };
    return hoverColors[variant] || hoverColors.primary;
  };

  const currentVariant = variantStyles[variant] || variantStyles.primary;
  const originalBgColor = currentVariant.backgroundColor;
  const hoverBgColor = getHoverStyle(variant);

  const baseStyle = {
    borderRadius: '8px',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.2s ease',
    boxShadow: variant === 'text' ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)',
    backgroundColor: originalBgColor,
    color: currentVariant.color,
    border: currentVariant.border,
    ...sizeStyles[size] || sizeStyles.md,
    ...props.style
  };

  // Extract style prop to avoid passing it twice
  const { style, ...restProps } = props;

  return (
    <button
      className={className}
      disabled={disabled}
      style={baseStyle}
      onMouseEnter={(e) => {
        if (!disabled && variant !== 'text') {
          e.currentTarget.style.backgroundColor = hoverBgColor;
        } else if (!disabled && variant === 'text') {
          e.currentTarget.style.opacity = '0.8';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && variant !== 'text') {
          e.currentTarget.style.backgroundColor = originalBgColor;
        } else if (!disabled && variant === 'text') {
          e.currentTarget.style.opacity = '1';
        }
        e.currentTarget.style.transform = 'scale(1)';
      }}
      onMouseDown={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(0.98)';
        }
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
      {...restProps}
    >
      {children}
    </button>
  );
};

export default Button;
