import React, { useState } from 'react';

/**
 * Hierarchical category tree component
 * @param {Object} props
 * @param {Array} props.categories - Array of category objects with children
 * @param {string} props.selectedCategoryId - Currently selected category ID
 * @param {Function} props.onCategorySelect - Category selection handler
 * @param {number} props.level - Nesting level (internal)
 */
export const CategoryTree = ({
  categories = [],
  selectedCategoryId = '',
  onCategorySelect,
  level = 0
}) => {
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  if (!categories || categories.length === 0) {
    return (
      <div style={{
        padding: '15px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: '#f8f9fa',
        textAlign: 'center',
        fontSize: '13px',
        color: '#666'
      }}>
        <p style={{ margin: 0 }}>No categories available</p>
      </div>
    );
  }

  return (
    <div>
      {categories.map((category) => {
        if (!category || !category.id) return null;

        const hasChildren = category.children && Array.isArray(category.children) && category.children.length > 0;
        const isExpanded = expandedCategories.has(category.id);
        const isSelected = selectedCategoryId === category.id.toString();
        const productCount = category.productCount !== undefined ? category.productCount : 0;

        return (
          <div key={category.id} style={{ marginLeft: `${level * 20}px`, marginBottom: '2px' }}>
            <div
              onClick={() => {
                if (hasChildren) {
                  toggleCategory(category.id);
                }
                if (onCategorySelect) {
                  onCategorySelect(category.id.toString());
                }
              }}
              style={{
                padding: '12px 15px',
                cursor: 'pointer',
                backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s ease',
                minHeight: '44px',
                height: '44px',
                boxSizing: 'border-box'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                } else {
                  e.currentTarget.style.backgroundColor = '#eff6ff';
                }
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                flex: 1,
                minWidth: 0,
                overflow: 'hidden'
              }}>
                {hasChildren && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCategory(category.id);
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: '12px',
                      padding: '2px 5px',
                      minWidth: '20px',
                      width: '20px',
                      textAlign: 'center',
                      flexShrink: 0,
                      color: '#6b7280'
                    }}
                  >
                    {isExpanded ? '▼' : '▶'}
                  </button>
                )}
                {!hasChildren && <span style={{ width: '20px', display: 'inline-block', flexShrink: 0 }}></span>}
                <span style={{ 
                  fontWeight: isSelected ? '600' : '500',
                  fontSize: '14px',
                  color: isSelected ? '#007bff' : '#374151',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flex: 1
                }}>
                  {category.name || 'Unnamed Category'}
                </span>
              </div>
              {productCount > 0 && (
                <span style={{
                  fontSize: '12px',
                  color: '#007bff',
                  fontWeight: '600',
                  marginLeft: '8px',
                  flexShrink: 0
                }}>
                  ({productCount})
                </span>
              )}
            </div>
            {hasChildren && isExpanded && (
              <CategoryTree
                categories={category.children}
                selectedCategoryId={selectedCategoryId}
                onCategorySelect={onCategorySelect}
                level={level + 1}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CategoryTree;
