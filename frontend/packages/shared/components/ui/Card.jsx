import React from 'react';

/**
 * Card container component
 * @param {Object} props
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Card content
 */
export const Card = ({
  className = '',
  children,
  ...props
}) => {
  const classes = ['card', className].filter(Boolean).join(' ');

  return (
    <div 
      className={classes} 
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        transition: 'all 0.2s ease',
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
