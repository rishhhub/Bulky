import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sellerService, sellerProductService, orderService } from '@shared/services';
import { Card, Button, LoadingSpinner, Badge } from '@shared/components/ui';

function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load seller status
      const status = await sellerService.getSellerStatus();
      setProfileStatus(status);
      setProfileComplete(status.profileComplete);

      // Load products
      const productsData = await sellerProductService.getSellerProducts();
      setProducts(productsData || []);

      // Load seller orders
      const ordersData = await orderService.getMySellerOrders();
      setOrders(ordersData || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
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

  const getApprovalStatusCounts = () => {
    const counts = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      total: products.length
    };
    
    products.forEach(product => {
      if (product.approvalStatus) {
        counts[product.approvalStatus] = (counts[product.approvalStatus] || 0) + 1;
      } else {
        counts.PENDING = (counts.PENDING || 0) + 1;
      }
    });
    
    return counts;
  };

  const getProductsNeedingAttention = () => {
    return products.filter(p => 
      !p.approvalStatus || 
      p.approvalStatus === 'PENDING' || 
      p.approvalStatus === 'REJECTED'
    ).slice(0, 5);
  };

  if (loading) {
    return (
      <div className="container" style={{ marginTop: '30px', textAlign: 'center' }}>
        <LoadingSpinner />
      </div>
    );
  }

  const statusCounts = getApprovalStatusCounts();
  const productsNeedingAttention = getProductsNeedingAttention();

  return (
    <div className="container" style={{ marginTop: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Seller Dashboard</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="primary" onClick={() => navigate('/products/new')}>
            + Add Product
          </Button>
          {!profileComplete && (
            <Button variant="secondary" onClick={() => navigate('/profile')}>
              Complete Profile
            </Button>
          )}
        </div>
      </div>

      {/* Profile Status Alert */}
      {profileStatus && profileStatus.profileStatus === 'PENDING' && (
        <Card style={{ marginBottom: '24px', backgroundColor: '#fff3cd', border: '1px solid #ffc107' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>⏳</span>
            <div>
              <strong>Profile Pending Approval</strong>
              <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                Your seller profile is pending admin approval. You can add products, but they won't be visible until your profile is approved.
              </p>
            </div>
          </div>
        </Card>
      )}

      {profileStatus && profileStatus.profileStatus === 'REJECTED' && (
        <Card style={{ marginBottom: '24px', backgroundColor: '#f8d7da', border: '1px solid #dc3545' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>❌</span>
            <div>
              <strong>Profile Rejected</strong>
              <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                Your seller profile has been rejected. Please update your profile and resubmit for approval.
              </p>
            </div>
            <Button variant="primary" onClick={() => navigate('/profile')} style={{ marginLeft: 'auto' }}>
              Update Profile
            </Button>
          </div>
        </Card>
      )}

      {/* Overview Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginBottom: '32px'
      }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Total Products</p>
              <h2 style={{ margin: '8px 0 0 0', fontSize: '32px', fontWeight: '700' }}>
                {statusCounts.total}
              </h2>
            </div>
            <div style={{ fontSize: '40px' }}>📦</div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Badge style={{ backgroundColor: '#ffc107', color: 'white', fontSize: '12px' }}>
              {statusCounts.PENDING} Pending
            </Badge>
            <Badge style={{ backgroundColor: '#28a745', color: 'white', fontSize: '12px' }}>
              {statusCounts.APPROVED} Approved
            </Badge>
            {statusCounts.REJECTED > 0 && (
              <Badge style={{ backgroundColor: '#dc3545', color: 'white', fontSize: '12px' }}>
                {statusCounts.REJECTED} Rejected
              </Badge>
            )}
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Total Orders</p>
              <h2 style={{ margin: '8px 0 0 0', fontSize: '32px', fontWeight: '700' }}>
                {orders.length}
              </h2>
            </div>
            <div style={{ fontSize: '40px' }}>🛒</div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <Button variant="secondary" size="sm" onClick={() => navigate('/orders')}>
              View Orders
            </Button>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Profile Status</p>
              <h2 style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: '700' }}>
                {profileStatus?.profileStatus || 'N/A'}
              </h2>
            </div>
            <div style={{ fontSize: '40px' }}>👤</div>
          </div>
          <div style={{ marginTop: '16px' }}>
            {profileComplete ? (
              <Badge style={{ backgroundColor: '#17a2b8', color: 'white', fontSize: '12px' }}>
                Complete
              </Badge>
            ) : (
              <Badge style={{ backgroundColor: '#ffc107', color: 'white', fontSize: '12px' }}>
                Incomplete
              </Badge>
            )}
          </div>
        </Card>
      </div>

      {/* Products Needing Attention */}
      {productsNeedingAttention.length > 0 && (
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>Products Needing Attention</h3>
            <Button variant="secondary" size="sm" onClick={() => navigate('/products')}>
              View All
            </Button>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {productsNeedingAttention.map(product => (
              <div 
                key={product.id}
                style={{
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => navigate(`/products/${product.id}/edit`)}
              >
                <div style={{ flex: 1 }}>
                  <strong>{product.name}</strong>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                    {product.approvalStatus || 'PENDING'}
                  </p>
                </div>
                <Badge 
                  style={{ 
                    backgroundColor: getStatusColor(product.approvalStatus || 'PENDING'),
                    color: 'white',
                    fontSize: '12px'
                  }}
                >
                  {product.approvalStatus || 'PENDING'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <h3 style={{ marginBottom: '16px' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <Button variant="primary" onClick={() => navigate('/products/new')} style={{ width: '100%' }}>
            + Add New Product
          </Button>
          <Button variant="secondary" onClick={() => navigate('/products')} style={{ width: '100%' }}>
            Manage Products
          </Button>
          <Button variant="secondary" onClick={() => navigate('/orders')} style={{ width: '100%' }}>
            View Orders
          </Button>
          <Button variant="secondary" onClick={() => navigate('/profile')} style={{ width: '100%' }}>
            Edit Profile
          </Button>
          <Button variant="secondary" onClick={() => navigate('/category-requests')} style={{ width: '100%' }}>
            Category Requests
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default Dashboard;
