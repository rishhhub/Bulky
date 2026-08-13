import React from 'react';

/**
 * Tab navigation component
 * @param {Object} props
 * @param {string} props.activeTab - Currently active tab ID
 * @param {Function} props.onTabChange - Tab change handler
 * @param {Array} props.tabs - Array of {id, label} objects
 * @param {string} props.className - Additional CSS classes
 */
export const Tabs = ({
  activeTab,
  onTabChange,
  tabs = [],
  className = '',
  ...props
}) => {
  return (
    <div
      style={{
        borderBottom: '2px solid #ddd',
        marginBottom: '20px',
        display: 'flex',
        gap: '20px',
        flexWrap: 'wrap'
      }}
      className={className}
      {...props}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === tab.id ? '2px solid #007bff' : '2px solid transparent',
            color: activeTab === tab.id ? '#007bff' : '#666',
            cursor: 'pointer',
            fontWeight: activeTab === tab.id ? 'bold' : 'normal',
            transition: 'all 0.3s'
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
