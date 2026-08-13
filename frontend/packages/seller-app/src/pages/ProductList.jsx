import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sellerProductService } from '@shared/services';
import { Card, Button, Badge, LoadingSpinner } from '@shared/components/ui';
import { formatCurrency } from '@shared/utils/formatters';

function ProductList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await sellerProductService.getSellerProducts();
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
      alert(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(productId);
      await sellerProductService.deleteProduct(productId);
      alert('Product deleted successfully');
      loadProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return '#28a745';
      case 'REJECTED':
        return '#dc3545';
      case 'PENDING':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  const filteredProducts = filterStatus === 'ALL' 
    ? products 
    : products.filter(p => (p.approvalStatus || 'PENDING') === filterStatus);

  if (loading) {
    return (
      <div className="container" style={{ marginTop: '30px', textAlign: 'center' }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: '30px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px'
      }}>
        <h1>My Products</h1>
        <Button variant="primary" onClick={() => navigate('/products/new')}>
          + Add New Product
        </Button>
      </div>

      {/* Filter */}
      <Card style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <strong>Filter by Status:</strong>
          <Button
            variant={filterStatus === 'ALL' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterStatus('ALL')}
          >
            All ({products.length})
          </Button>
          <Button
            variant={filterStatus === 'PENDING' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterStatus('PENDING')}
          >
            Pending ({products.filter(p => !p.approvalStatus || p.approvalStatus === 'PENDING').length})
          </Button>
          <Button
            variant={filterStatus === 'APPROVED' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterStatus('APPROVED')}
          >
            Approved ({products.filter(p => p.approvalStatus === 'APPROVED').length})
          </Button>
          <Button
            variant={filterStatus === 'REJECTED' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterStatus('REJECTED')}
          >
            Rejected ({products.filter(p => p.approvalStatus === 'REJECTED').length})
          </Button>
        </div>
      </Card>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
          <h3>No products found</h3>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            {filterStatus === 'ALL' 
              ? 'Get started by adding your first product!' 
              : `No products with status: ${filterStatus}`}
          </p>
          {filterStatus === 'ALL' && (
            <Button variant="primary" onClick={() => navigate('/products/new')}>
              Add Your First Product
            </Button>
          )}
        </Card>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '20px'
        }}>
          {filteredProducts.map(product => {
            const status = product.approvalStatus || 'PENDING';
            const canEdit = status === 'PENDING' || status === 'REJECTED';
            
            return (
              <Card key={product.id} style={{ padding: '20px' }}>
                {/* Product Image */}
                {product.imageUrl && (
                  <div style={{ 
                    width: '100%', 
                    height: '200px', 
                    marginBottom: '16px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#f3f4f6'
                  }}>
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #9ca3af;">📦</div>';
                      }}
                    />
                  </div>
                )}

                {/* Product Info */}
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
                    {product.name}
                  </h3>
                  
                  {product.description && (
                    <p style={{ 
                      margin: '0 0 12px 0', 
                      color: '#6b7280', 
                      fontSize: '14px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {product.description}
                    </p>
                  )}

                  {/* Status Badge */}
                  <div style={{ marginBottom: '12px' }}>
                    <Badge 
                      style={{ 
                        backgroundColor: getStatusColor(status),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      {status}
                    </Badge>
                  </div>

                  {/* Price Breakdown */}
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#f9fafb', 
                    borderRadius: '6px',
                    marginBottom: '12px',
                    fontSize: '13px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#6b7280' }}>Cost per unit:</span>
                      <strong>{formatCurrency(product.costPerUnit || 0)}</strong>
                    </div>
                    {product.listedPrice && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#6b7280' }}>Listed price:</span>
                        <strong style={{ color: '#28a745' }}>{formatCurrency(product.listedPrice)}</strong>
                      </div>
                    )}
                    {product.platformFee && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#6b7280' }}>Platform fee:</span>
                        <span>{formatCurrency(product.platformFee)}</span>
                      </div>
                    )}
                    {product.minOrderQuantity && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Min order:</span>
                        <span>{product.minOrderQuantity} units</span>
                      </div>
                    )}
                  </div>

                  {/* Rejection Reason */}
                  {status === 'REJECTED' && product.rejectionReason && (
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: '#fee', 
                      border: '1px solid #fcc',
                      borderRadius: '4px',
                      marginBottom: '12px',
                      fontSize: '12px',
                      color: '#c33'
                    }}>
                      <strong>Rejection Reason:</strong> {product.rejectionReason}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {canEdit && (
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => navigate(`/products/${product.id}/edit`)}
                        style={{ flex: 1 }}
                      >
                        Edit
                      </Button>
                    )}
                    {canEdit && (
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        disabled={deletingId === product.id}
                        style={{ flex: 1 }}
                      >
                        {deletingId === product.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    )}
                    {!canEdit && (
                      <div style={{ 
                        padding: '8px', 
                        textAlign: 'center', 
                        color: '#6b7280',
                        fontSize: '12px',
                        flex: 1
                      }}>
                        Cannot edit approved products
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProductList;
