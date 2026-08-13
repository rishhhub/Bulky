import React, { useState, useEffect } from 'react';
import { sellerProductService } from '@shared/services';
import { Card, Button, Badge, LoadingSpinner, Modal } from '@shared/components/ui';
import { useToast } from '@shared/context';
import { formatCurrency } from '@shared/utils/formatters';
import { getErrorMessage } from '@shared/utils';

export const SellerProductsTab = ({ onRefresh }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await sellerProductService.getPendingProductApprovals();
      setProducts(data || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load products'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (productId) => {
    if (!window.confirm('Are you sure you want to approve this product? It will become visible to users.')) {
      return;
    }

    try {
      setProcessing(true);
      const user = JSON.parse(localStorage.getItem('user'));
      await sellerProductService.approveProduct(productId, user.id);
      toast.success('Product approved successfully');
      loadProducts();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to approve product'));
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setProcessing(true);
      const user = JSON.parse(localStorage.getItem('user'));
      await sellerProductService.rejectProduct(selectedProduct.id, user.id, rejectionReason);
      toast.success('Product rejected successfully');
      setShowRejectModal(false);
      setSelectedProduct(null);
      setRejectionReason('');
      loadProducts();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to reject product'));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
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
          Seller Product Approvals
        </h2>
        <Button variant="secondary" onClick={loadProducts}>
          Refresh
        </Button>
      </div>

      {products.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h3>No Pending Approvals</h3>
          <p style={{ color: '#6b7280' }}>
            All seller products have been reviewed.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {products.map(product => (
            <Card key={product.id} style={{ padding: '20px' }}>
              <div style={{ display: 'flex', gap: '20px' }}>
                {product.imageUrl && (
                  <div style={{ 
                    width: '150px', 
                    height: '150px', 
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#f3f4f6',
                    flexShrink: 0
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

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
                        {product.name}
                      </h3>
                      {product.sellerName && (
                        <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>
                          <strong>Seller:</strong> {product.sellerName}
                        </p>
                      )}
                    </div>
                    <Badge 
                      style={{ 
                        backgroundColor: '#ffc107',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      PENDING
                    </Badge>
                  </div>

                  {product.description && (
                    <p style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '14px' }}>
                      {product.description}
                    </p>
                  )}

                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#f9fafb', 
                    borderRadius: '6px',
                    marginBottom: '12px',
                    fontSize: '13px'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                      {product.costPerUnit && (
                        <div>
                          <strong>Cost per Unit:</strong> {formatCurrency(product.costPerUnit)}
                        </div>
                      )}
                      {product.listedPrice && (
                        <div>
                          <strong>Listed Price:</strong> {formatCurrency(product.listedPrice)}
                        </div>
                      )}
                      {product.minOrderQuantity && (
                        <div>
                          <strong>Min Order:</strong> {product.minOrderQuantity} units
                        </div>
                      )}
                      {product.weightPerUnit && (
                        <div>
                          <strong>Weight:</strong> {product.weightPerUnit} kg/unit
                        </div>
                      )}
                    </div>
                  </div>

                  {product.createdAt && (
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
                      Created: {new Date(product.createdAt).toLocaleDateString()}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => handleApprove(product.id)}
                      disabled={processing}
                    >
                      Approve
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowRejectModal(true);
                      }}
                      disabled={processing}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedProduct(null);
          setRejectionReason('');
        }}
        title="Reject Product"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleReject(); }}>
          <div className="form-group">
            <label>Rejection Reason *</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              required
              placeholder="Please provide a reason for rejection..."
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <Button type="submit" variant="danger" disabled={processing || !rejectionReason.trim()}>
              {processing ? 'Rejecting...' : 'Reject Product'}
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                setShowRejectModal(false);
                setSelectedProduct(null);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
