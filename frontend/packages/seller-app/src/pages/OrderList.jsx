import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '@shared/services';
import { Card, Button, Badge, LoadingSpinner } from '@shared/components/ui';
import { formatCurrency } from '@shared/utils/formatters';

function OrderList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      // Get seller orders from the seller-specific endpoint
      const sellerOrders = await orderService.getMySellerOrders();
      setOrders(sellerOrders || []);
    } catch (err) {
      console.error('Failed to load seller orders:', err);
      // Show empty state if endpoint doesn't exist or error occurs
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ARRIVED':
      case 'COMPLETED':
        return '#28a745';
      case 'SHIPPED':
      case 'IN_TRANSIT':
        return '#17a2b8';
      case 'PLACED':
      case 'CONFIRMED':
        return '#007bff';
      case 'PENDING':
        return '#ffc107';
      case 'CANCELLED':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const filteredOrders = filterStatus === 'ALL' 
    ? orders 
    : orders.filter(o => o.status === filterStatus);

  if (loading) {
    return (
      <div className="container" style={{ marginTop: '30px', textAlign: 'center' }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: '30px' }}>
      <h1 style={{ marginBottom: '24px' }}>My Orders</h1>

      {/* Filter */}
      <Card style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <strong>Filter by Status:</strong>
          <Button
            variant={filterStatus === 'ALL' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterStatus('ALL')}
          >
            All ({orders.length})
          </Button>
          <Button
            variant={filterStatus === 'PLACED' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterStatus('PLACED')}
          >
            Placed ({orders.filter(o => o.status === 'PLACED').length})
          </Button>
          <Button
            variant={filterStatus === 'CONFIRMED' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterStatus('CONFIRMED')}
          >
            Confirmed ({orders.filter(o => o.status === 'CONFIRMED').length})
          </Button>
          <Button
            variant={filterStatus === 'SHIPPED' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterStatus('SHIPPED')}
          >
            Shipped ({orders.filter(o => o.status === 'SHIPPED').length})
          </Button>
          <Button
            variant={filterStatus === 'IN_TRANSIT' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterStatus('IN_TRANSIT')}
          >
            In Transit ({orders.filter(o => o.status === 'IN_TRANSIT').length})
          </Button>
          <Button
            variant={filterStatus === 'ARRIVED' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterStatus('ARRIVED')}
          >
            Arrived ({orders.filter(o => o.status === 'ARRIVED').length})
          </Button>
        </div>
      </Card>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
          <h3>No orders found</h3>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            {filterStatus === 'ALL' 
              ? 'You haven\'t received any orders yet.' 
              : `No orders with status: ${filterStatus}`}
          </p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredOrders.map(order => (
            <Card 
              key={order.id}
              style={{ 
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => navigate(`/orders/${order.id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                      Order #{order.sellerOrderNumber || order.id}
                    </h3>
                    <Badge 
                      style={{ 
                        backgroundColor: getStatusColor(order.status),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      {order.status}
                    </Badge>
                  </div>

                  {order.productName && (
                    <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>
                      <strong>Product:</strong> {order.productName} {order.productId && `(ID: ${order.productId})`}
                    </p>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '14px' }}>
                    {order.totalQuantity && (
                      <div>
                        <strong>Units:</strong> {order.totalQuantity}
                      </div>
                    )}
                    {order.orderAmount && (
                      <div>
                        <strong>Order Amount:</strong> {formatCurrency(order.orderAmount)}
                      </div>
                    )}
                    {order.placedAt && (
                      <div>
                        <strong>Placed Date:</strong> {new Date(order.placedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  
                  {order.deliveryWarehouse && (
                    <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', fontSize: '13px' }}>
                      <strong>Delivery Warehouse:</strong>
                      <p style={{ margin: '4px 0 0 0', color: '#6b7280' }}>
                        {order.deliveryWarehouse.name} - {order.deliveryWarehouse.city}, {order.deliveryWarehouse.state}
                      </p>
                    </div>
                  )}
                  
                  {order.trackingId && (
                    <div style={{ marginTop: '8px', fontSize: '13px' }}>
                      <strong>Tracking ID:</strong> {order.trackingId}
                    </div>
                  )}

                  {order.deliveryAddress && (
                    <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', fontSize: '13px' }}>
                      <strong>Delivery Address:</strong>
                      <p style={{ margin: '4px 0 0 0', color: '#6b7280' }}>
                        {order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.postalCode}
                      </p>
                    </div>
                  )}
                </div>

                <Button variant="secondary" size="sm" onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/orders/${order.id}`);
                }}>
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrderList;
