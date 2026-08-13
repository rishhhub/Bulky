import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productService, categoryService } from '@shared/services';
import { ProductCard, CategoryTree } from '@shared/components/features';
import { Card, LoadingSpinner, Button, EmptyState, ErrorState } from '@shared/components/ui';
import { logger, findCategoryPath, findCategoryPathDisplay, findCategoryIdByName, getErrorMessage } from '@shared/utils';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [searchTerm, selectedCategory, minPrice, maxPrice, sortBy, sortOrder]);

  // Auto-expand categories to show selected category
  useEffect(() => {
    if (selectedCategory) {
      const findAndExpandCategory = (cats, targetId) => {
        for (const cat of cats) {
          if (cat.id.toString() === targetId) {
            return true; // Found it
          }
          if (cat.children && cat.children.length > 0) {
            if (findAndExpandCategory(cat.children, targetId)) {
              // Expand this category to show the selected one
              setExpandedCategories(prev => new Set([...prev, cat.id]));
              return true;
            }
          }
        }
        return false;
      };
      findAndExpandCategory(categories, selectedCategory);
    }
  }, [selectedCategory, categories]);

  const loadCategories = async () => {
    try {
      // Load categories for public view (only active, hierarchical)
      const data = await categoryService.getAll(false, false);
      logger.log('Loaded categories for product list:', data);
      if (data && Array.isArray(data)) {
        setCategories(data);
      } else {
        logger.warn('Categories data is not an array:', data);
        setCategories([]);
      }
    } catch (err) {
      logger.error('Failed to load categories:', err);
      logger.error('Error details:', err.response?.data || err.message);
      setCategories([]);
      // Retry loading after a delay if it fails
      setTimeout(() => {
        logger.log('Retrying category load...');
        loadCategories();
      }, 3000);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setProductsError(null);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.categoryId = parseInt(selectedCategory);
      if (minPrice) params.minPrice = parseFloat(minPrice);
      if (maxPrice) params.maxPrice = parseFloat(maxPrice);
      if (sortBy) params.sortBy = sortBy;
      if (sortOrder) params.sortOrder = sortOrder;

      const data = await productService.getAll(params);
      setProducts(data);
    } catch (err) {
      logger.error('Failed to load products:', err);
      setProductsError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('name');
    setSortOrder('asc');
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };


  if (loading && products.length === 0 && !productsError) {
    return (
      <div className="container" style={{ marginTop: '30px' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (productsError && products.length === 0) {
    return (
      <div className="page-container" style={{ marginTop: '30px' }}>
        <ErrorState
          message={getErrorMessage(productsError, 'Failed to load products')}
          onRetry={loadProducts}
          retryLabel="Try again"
        />
      </div>
    );
  }

  return (
    <div className="page-container" style={{ marginTop: '30px' }}>
      <div className="page-container">
        <h1 className="page-title">Products</h1>
        
        <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', width: '100%', boxSizing: 'border-box' }}>
          {/* Left Sidebar - Filters */}
          <div className="filters-sidebar">
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Filters</h3>
              {(selectedCategory || searchTerm || minPrice || maxPrice) && (
                <button
                  onClick={handleClearFilters}
                  style={{
                    padding: '5px 10px',
                    fontSize: '12px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  title="Clear all filters"
                >
                  Clear All
                </button>
              )}
            </div>
            
            {/* Active Filters Summary */}
            {(selectedCategory || searchTerm || minPrice || maxPrice) && (
              <div style={{ 
                marginBottom: '15px', 
                padding: '10px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Active Filters:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {selectedCategory && (() => {
                    const path = findCategoryPathDisplay(categories, selectedCategory);
                    return path && (
                      <span style={{
                        padding: '3px 8px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        {path}
                        <button
                          onClick={() => setSelectedCategory('')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            padding: 0,
                            marginLeft: '5px',
                            fontSize: '14px'
                          }}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })()}
                  {searchTerm && (
                    <span style={{
                      padding: '3px 8px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      Search: "{searchTerm}"
                      <button
                        onClick={() => setSearchTerm('')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          padding: 0,
                          marginLeft: '5px',
                          fontSize: '14px'
                        }}
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {(minPrice || maxPrice) && (
                    <span style={{
                      padding: '3px 8px',
                      backgroundColor: '#ffc107',
                      color: '#333',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      Price: ₹{minPrice || '0'} - ₹{maxPrice || '∞'}
                      <button
                        onClick={() => {
                          setMinPrice('');
                          setMaxPrice('');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#333',
                          cursor: 'pointer',
                          padding: 0,
                          marginLeft: '5px',
                          fontSize: '14px'
                        }}
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Search</label>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Shop by Category</label>
                {categories.length === 0 ? (
                  <div style={{ 
                    padding: '15px',
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    backgroundColor: '#f8f9fa',
                    textAlign: 'center',
                    fontSize: '13px',
                    color: '#666'
                  }}>
                    <p style={{ margin: 0 }}>Loading categories...</p>
                  </div>
                ) : (
                  <div 
                    className="category-scroll-container"
                    style={{ 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px', 
                      maxHeight: '500px', 
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      backgroundColor: '#fff',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <div
                      onClick={() => {
                        setSelectedCategory('');
                        setExpandedCategories(new Set());
                      }}
                      style={{
                        padding: '12px 15px',
                        cursor: 'pointer',
                        backgroundColor: selectedCategory === '' ? '#eff6ff' : 'transparent',
                        borderBottom: '1px solid #e5e7eb',
                        fontWeight: selectedCategory === '' ? '600' : '500',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s ease',
                        minHeight: '44px',
                        height: '44px',
                        boxSizing: 'border-box',
                        color: selectedCategory === '' ? '#007bff' : '#374151',
                        fontSize: '14px'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedCategory !== '') {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedCategory !== '') {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        } else {
                          e.currentTarget.style.backgroundColor = '#eff6ff';
                        }
                      }}
                    >
                      <span>All Categories</span>
                      {products.length > 0 && selectedCategory === '' && (
                        <span style={{ 
                          fontSize: '12px', 
                          color: '#007bff',
                          fontWeight: '600',
                          marginLeft: '8px'
                        }}>
                          ({products.length})
                        </span>
                      )}
                    </div>
                    <CategoryTree
                      categories={categories}
                      selectedCategoryId={selectedCategory}
                      onCategorySelect={(categoryId) => {
                        setSelectedCategory(categoryId);
                        setExpandedCategories(new Set());
                      }}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Price Range</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '10px' }}
                >
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="createdAt">Date Added</option>
                </select>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
              
              <button
                onClick={handleClearFilters}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  marginTop: '10px'
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

          {/* Main Content Area - Products Grid */}
          <div className="content-main">
          {loading ? (
            <div>Loading products...</div>
          ) : (
            <>
              {/* Breadcrumb Navigation */}
              {selectedCategory && (() => {
                const raw = findCategoryPath(categories, selectedCategory);
                const breadcrumbs = Array.isArray(raw) ? raw : (typeof raw === 'string' ? raw.split(' > ') : []);
                return breadcrumbs.length > 0 && (
                  <div className="breadcrumb-bar">
                    <span style={{ color: '#666', fontSize: '14px' }}>You are here:</span>
                    <span
                      onClick={() => setSelectedCategory('')}
                      style={{ 
                        color: '#007bff', 
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      All Categories
                    </span>
                    {breadcrumbs.map((crumb, index) => (
                      <React.Fragment key={index}>
                        <span style={{ color: '#999' }}>›</span>
                        <span style={{ 
                          color: index === breadcrumbs.length - 1 ? '#333' : '#007bff',
                          cursor: index === breadcrumbs.length - 1 ? 'default' : 'pointer',
                          fontWeight: index === breadcrumbs.length - 1 ? 'bold' : 'normal',
                          fontSize: '14px'
                        }}
                        onClick={() => {
                          if (index < breadcrumbs.length - 1) {
                            const catId = findCategoryIdByName(categories, crumb);
                            if (catId) setSelectedCategory(catId);
                          }
                        }}
                        >
                          {crumb}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                );
              })()}
              
              <div style={{ marginBottom: '15px', color: '#666', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  Found {products.length} product{products.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>
              {products.length === 0 && (
                <EmptyState
                  message="No products found matching your criteria."
                  actionLabel="Clear Filters"
                  onAction={handleClearFilters}
                />
              )}
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductList;
