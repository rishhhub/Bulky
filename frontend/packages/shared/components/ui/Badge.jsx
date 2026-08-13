import React from 'react';
import { STATUS_COLORS } from '../../utils/constants.js';

/**
 * Badge component for status display
 * @param {Object} props
 * @param {string} props.status - Status value (uses STATUS_COLORS)
 * @param {string} props.color - Custom color (overrides status color)
 * @param {string} props.variant - Variant: 'solid', 'outline'
 * @param {React.ReactNode} props.children - Badge content
 */
export const Badge = ({
  status,
  color,
  variant = 'solid',
  children,
  ...props
}) => {
  const badgeColor = color || STATUS_COLORS[status] || '#6c757d';
  
  const style = {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    ...(variant === 'solid' ? {
      backgroundColor: badgeColor,
      color: 'white'
    } : {
      backgroundColor: 'transparent',
      color: badgeColor,
      border: `1px solid ${badgeColor}`
    }),
    ...props.style
  };

  return (
    <span style={style} {...props}>
      {children || status}
    </span>
  );
};

export default Badge;
