import React, { useState } from 'react';
import { Card, Button, LoadingSpinner } from '@shared/components/ui';
import { CategoryForm } from '../CategoryForm';
import { useToast } from '@shared/context';
import { categoryService } from '@shared/services';
import { CategoryTree } from '@shared/components/features';
import { getErrorMessage } from '@shared/utils';
import { useCategories } from '../../hooks';

export const CategoriesTab = () => {
  const toast = useToast();
  const { categories, allCategoriesFlat, loading, refresh } = useCategories(true);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setShowCategoryForm(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? This will also delete all subcategories.')) {
      return;
    }
    setDeletingId(id);
    try {
      await categoryService.delete(id);
      toast.success('Category deleted successfully');
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete category'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = () => {
    setShowCategoryForm(false);
    setEditingCategory(null);
    refresh();
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const renderCategoryTree = (categoryList, level = 0) => {
    if (!categoryList || !Array.isArray(categoryList) || categoryList.length === 0) {
      return null;
    }
    
    return categoryList.map((category) => {
      if (!category || !category.id) {
        return null;
      }
      
      const hasChildren = category.children && Array.isArray(category.children) && category.children.length > 0;
      const isExpanded = expandedCategories.has(category.id);
      
      const handleCategoryClick = (e) => {
        const buttonContainer = e.target.closest('[data-button-container]');
        if (buttonContainer) {
          return;
        }
        if (hasChildren) {
          toggleCategory(category.id);
        }
      };
      
      return (
        <div
          key={category.id}
          style={{ 
            marginBottom: '10px', 
            marginLeft: `${level * 20}px`,
          }}
        >
        <Card 
          style={{ 
            transition: 'all 0.2s ease',
            cursor: hasChildren ? 'pointer' : 'default',
            position: 'relative',
            backgroundColor: 'white'
          }}
          onClick={handleCategoryClick}
          onMouseEnter={(e) => {
            if (hasChildren) {
              e.currentTarget.style.backgroundColor = '#f8f9fa';
            }
          }}
          onMouseLeave={(e) => {
            if (hasChildren) {
              e.currentTarget.style.backgroundColor = 'white';
            }
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div 
              style={{ 
                flex: 1
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                {hasChildren && (
                  <span
                    style={{
                      fontSize: '14px',
                      padding: '2px 5px',
                      userSelect: 'none'
                    }}
                  >
                    {isExpanded ? '▼' : '▶'}
                  </span>
                )}
                {!hasChildren && <span style={{ width: '24px', display: 'inline-block' }}></span>}
                <h4 style={{ margin: 0, userSelect: 'none' }}>{category.name}</h4>
                {hasChildren && (
                  <span style={{ fontSize: '12px', color: '#666', fontStyle: 'italic', userSelect: 'none' }}>
                    ({category.children.length} subcategor{category.children.length !== 1 ? 'ies' : 'y'})
                  </span>
                )}
              </div>
              {category.description && (
                <p style={{ color: '#666', marginBottom: '10px', userSelect: 'none' }}>{category.description}</p>
              )}
              {category.imageUrl && (
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px', userSelect: 'none' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                  draggable={false}
                />
              )}
            </div>
            <div 
              data-button-container
              style={{ display: 'flex', gap: '10px', zIndex: 10, position: 'relative' }}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleEditCategory(category)}
              >
                Edit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDeleteCategory(category.id)}
                disabled={deletingId === category.id}
              >
                {deletingId === category.id ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </Card>
        {hasChildren && isExpanded && (
          <div style={{ marginTop: '10px' }}>
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
        </div>
      );
    }).filter(Boolean);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Category Management</h2>
        <Button variant="primary" onClick={handleCreateCategory}>
          + Add New Category
        </Button>
      </div>

      <CategoryForm
        isOpen={showCategoryForm}
        onClose={() => {
          setShowCategoryForm(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
        categories={categories}
        onSave={handleSave}
      />

      {categories.length === 0 ? (
        <Card>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p style={{ color: '#666', marginBottom: '10px' }}>No categories found</p>
            <p style={{ fontSize: '14px', color: '#999' }}>
              Categories will be created automatically on system startup.
              <br />
              If you see this message, please restart the backend server to initialize data.
            </p>
          </div>
        </Card>
      ) : (
        <div>
          {renderCategoryTree(categories)}
        </div>
      )}
    </div>
  );
};

export default CategoriesTab;
