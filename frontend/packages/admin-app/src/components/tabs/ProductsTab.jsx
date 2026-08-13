import React, { useState } from 'react';
import { Card, Button, Badge, LoadingSpinner } from '@shared/components/ui';
import { ProductForm } from '../ProductForm';
import { useToast } from '@shared/context';
import { productService } from '@shared/services';
import { formatCurrency } from '@shared/utils/formatters';
import { getErrorMessage } from '@shared/utils';
import { useProducts } from '../../hooks';

export const ProductsTab = () => {
  const toast = useToast();
  const { products, categories, allCategoriesFlat, loading, refresh } = useProducts(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }
    setDeletingId(id);
    try {
      await productService.delete(id);
      toast.success('Product deleted successfully');
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete product'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = () => {
    setShowProductForm(false);
    setEditingProduct(null);
    refresh();
  };

  const renderStars = (rating) => {
    if (!rating || rating === 0) return <span style={{ color: '#999' }}>No ratings</span>;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    return (
      <span>
        {'★'.repeat(fullStars)}
        {hasHalfStar && '½'}
        {'☆'.repeat(emptyStars)}
        <span style={{ marginLeft: '5px' }}>({rating.toFixed(1)})</span>
      </span>
    );
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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px'
      }}>
        <h2 style={{ 
          margin: 0,
          fontSize: '24px',
          fontWeight: '700',
          color: '#111827'
        }}>
          Product Management
        </h2>
        <Button 
          variant="primary" 
          onClick={handleCreateProduct}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px'
          }}
        >
          <span style={{ fontSize: '18px' }}>➕</span>
          <span>Add New Product</span>
        </Button>
      </div>

      <ProductForm
        isOpen={showProductForm}
        onClose={() => {
          setShowProductForm(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        categories={allCategoriesFlat.length > 0 ? allCategoriesFlat : categories}
        onSave={handleSave}
      />

      {products.length === 0 ? (
        <Card>
          <p>No products found</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {products.map((product) => {
            const images = (product.imageUrls && product.imageUrls.length > 0) 
              ? product.imageUrls 
              : (product.imageUrl ? [product.imageUrl] : []);
            
            return (
              <Card key={product.id} style={{ 
                transition: 'all 0.2s ease',
                border: '1px solid rgba(0, 0, 0, 0.06)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr auto', gap: '20px', alignItems: 'start' }}>
                  {/* Product Image */}
                  <div>
                    {images.length > 0 ? (
                      <div>
                        <img
                          src={images[0]}
                          alt={product.name}
                          style={{
                            width: '100%',
                            height: '120px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            marginBottom: '5px'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                        <div style={{ display: 'none', width: '100%', height: '120px', backgroundColor: '#f0f0f0', borderRadius: '4px', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#999' }}>
                          No Image
                        </div>
                        {images.length > 1 && (
                          <small style={{ color: '#666', fontSize: '12px' }}>
                            +{images.length - 1} more image{images.length - 1 !== 1 ? 's' : ''}
                          </small>
                        )}
                      </div>
                    ) : (
                      <div style={{ width: '100%', height: '120px', backgroundColor: '#f0f0f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#999' }}>
                        No Image
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <h3 style={{ 
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#111827'
                      }}>
                        {product.name}
                      </h3>
                      {product.categoryPath && (
                        <Badge status="ACTIVE" variant="outline">
                          {product.categoryName || product.categoryPath}
                        </Badge>
                      )}
                      <Badge status={product.active ? 'ACTIVE' : 'INACTIVE'} variant="solid">
                        {product.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <p style={{ color: '#666', marginBottom: '10px', fontSize: '14px' }}>
                      {product.description || 'No description'}
                    </p>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
                      gap: '12px', 
                      marginBottom: '12px',
                      padding: '12px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontSize: '14px' }}>
                        <span style={{ fontWeight: '600', color: '#374151' }}>Price:</span>{' '}
                        <span style={{ color: '#111827', fontWeight: '600' }}>{formatCurrency(product.price)}</span>
                      </div>
                      <div style={{ fontSize: '14px' }}>
                        <span style={{ fontWeight: '600', color: '#374151' }}>Min Order:</span>{' '}
                        <span style={{ color: '#111827' }}>{product.minOrderQuantity} units</span>
                      </div>
                      <div style={{ fontSize: '14px' }}>
                        <span style={{ fontWeight: '600', color: '#374151' }}>Delivery Cost:</span>{' '}
                        <span style={{ color: '#111827' }}>{formatCurrency(product.baseDeliveryCost)}</span>
                      </div>
                      <div style={{ fontSize: '14px' }}>
                        <span style={{ fontWeight: '600', color: '#374151' }}>Weight:</span>{' '}
                        <span style={{ color: '#111827' }}>{product.weightPerUnit?.toFixed(2)} kg/unit</span>
                      </div>
                    </div>
                    
                    {/* Rating and Reviews */}
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                      {product.averageRating > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {renderStars(product.averageRating)}
                          {product.reviewCount > 0 && (
                            <span style={{ color: '#666', fontSize: '14px' }}>
                              ({product.reviewCount} review{product.reviewCount !== 1 ? 's' : ''})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#999', fontSize: '14px' }}>No reviews yet</span>
                      )}
                    </div>
                    
                    {product.sourceUrl && (
                      <div style={{ marginTop: '5px', fontSize: '12px' }}>
                        <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff' }}>
                          Source URL →
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px',
                    minWidth: '120px'
                  }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleEditProduct(product)}
                      style={{ 
                        whiteSpace: 'nowrap',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>✏️</span>
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id)}
                      disabled={deletingId === product.id}
                      style={{ 
                        whiteSpace: 'nowrap',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>🗑️</span>
                      <span>{deletingId === product.id ? 'Deleting...' : 'Delete'}</span>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductsTab;
