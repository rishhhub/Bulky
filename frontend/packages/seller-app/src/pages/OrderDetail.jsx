import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { orderService } from '@shared/services';
import { Card, Button, Badge, LoadingSpinner } from '@shared/components/ui';
import { FormField, FormTextarea } from '@shared/components/forms';
import { formatCurrency } from '@shared/utils/formatters';

function OrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [showShipForm, setShowShipForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shipForm, setShipForm] = useState({
    trackingId: '',
    estimatedArrival: '',
    notes: ''
  });

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await orderService.getSellerOrderById(parseInt(id));
      setOrder(data);
    } catch (err) {
      console.error('Failed to load seller order:', err);
      alert(err.response?.data?.message || err.response?.data || 'Failed to load order');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!order || order.status !== 'PLACED') return;
    setSubmitting(true);
    try {
      const updated = await orderService.updateSellerOrderFulfillment(order.id, { status: 'CONFIRMED' });
      setOrder(updated);
      alert('Order confirmed. You can now mark it as shipped when ready.');
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data || 'Failed to confirm order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkShipped = async (e) => {
    e.preventDefault();
    if (!order || !shipForm.trackingId?.trim()) {
      alert('Tracking ID is required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        status: 'SHIPPED',
        trackingId: shipForm.trackingId.trim(),
        notes: shipForm.notes?.trim() || null
      };
      if (shipForm.estimatedArrival) {
        payload.estimatedArrival = shipForm.estimatedArrival;
      }
      const updated = await orderService.updateSellerOrderFulfillment(order.id, payload);
      setOrder(updated);
      setShowShipForm(false);
      setShipForm({ trackingId: '', estimatedArrival: '', notes: '' });
      alert('Order marked as shipped. Admin can track and verify receipt at the warehouse.');
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data || 'Failed to mark as shipped');
    } finally {
      setSubmitting(false);
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
      case 'CONFIRMED':
        return '#007bff';
      case 'PLACED':
        return '#ffc107';
      case 'DISTRIBUTING':
        return '#6f42c1';
      default:
        return '#6c757d';
    }
  };

  const formatDateTime = (dt) => {
    if (!dt) return '';
    const d = new Date(dt);
    return d.toLocaleString();
  };

  if (loading) {
    return (
      <div className="container" style={{ marginTop: '30px', textAlign: 'center' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container" style={{ marginTop: '30px', textAlign: 'center' }}>
        <h2>Order not found</h2>
        <Button variant="primary" onClick={() => navigate('/orders')}>
          Back to Orders
        </Button>
      </div>
    );
  }

  const canConfirm = order.status === 'PLACED';
  const canMarkShipped = order.status === 'PLACED' || order.status === 'CONFIRMED';

  return (
    <div className="container" style={{ maxWidth: '900px', marginTop: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Bulk Order #{order.sellerOrderNumber || order.id}</h1>
        <Button variant="secondary" onClick={() => navigate('/orders')}>
          Back to Orders
        </Button>
      </div>

      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0' }}>Order Details</h2>
            <Badge
              style={{
                backgroundColor: getStatusColor(order.status),
                color: 'white',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              {order.status}
            </Badge>
          </div>
          <div style={{ textAlign: 'right', fontSize: '14px', color: '#6b7280' }}>
            <div>Placed: {order.placedAt ? formatDateTime(order.placedAt) : '—'}</div>
            {order.shippedAt && (
              <div>Shipped: {formatDateTime(order.shippedAt)}</div>
            )}
            {order.arrivedAt && (
              <div>Arrived at warehouse: {formatDateTime(order.arrivedAt)}</div>
            )}
          </div>
        </div>

        {order.productName && (
          <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Product</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '14px' }}>
              <div><strong>Product:</strong> {order.productName}</div>
              {order.totalQuantity != null && (
                <div><strong>Total quantity:</strong> {order.totalQuantity}</div>
              )}
              {order.orderAmount != null && (
                <div><strong>Order amount:</strong> {formatCurrency(order.orderAmount)}</div>
              )}
            </div>
          </div>
        )}

        {order.deliveryWarehouse && (
          <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Delivery warehouse</h3>
            <div style={{ fontSize: '14px', color: '#374151' }}>
              <strong>{order.deliveryWarehouse.name}</strong>
              {order.deliveryWarehouse.city && (
                <div style={{ marginTop: '4px' }}>
                  {[order.deliveryWarehouse.street, order.deliveryWarehouse.city, order.deliveryWarehouse.state, order.deliveryWarehouse.pincode].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          </div>
        )}

        {order.trackingId && (
          <div style={{ marginBottom: '12px', fontSize: '14px' }}>
            <strong>Tracking ID:</strong> {order.trackingId}
          </div>
        )}
        {order.estimatedArrival && (
          <div style={{ marginBottom: '12px', fontSize: '14px' }}>
            <strong>Estimated arrival:</strong> {formatDateTime(order.estimatedArrival)}
          </div>
        )}
        {order.notes && (
          <div style={{ marginBottom: '12px', fontSize: '14px' }}>
            <strong>Notes:</strong> {order.notes}
          </div>
        )}

        {/* Fulfillment actions */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Fulfillment</h3>
          {canConfirm && (
            <div style={{ marginBottom: '12px' }}>
              <Button
                variant="primary"
                onClick={handleConfirmOrder}
                disabled={submitting}
              >
                {submitting ? 'Confirming...' : 'Confirm order'}
              </Button>
              <p style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>
                Confirm that you have received this order and will fulfill it.
              </p>
            </div>
          )}
          {canMarkShipped && (
            <div style={{ marginBottom: '12px' }}>
              {!showShipForm ? (
                <Button variant="primary" onClick={() => setShowShipForm(true)} disabled={submitting}>
                  Mark as shipped
                </Button>
              ) : (
                <form onSubmit={handleMarkShipped} style={{ maxWidth: '400px' }}>
                  <FormField
                    label="Tracking ID *"
                    name="trackingId"
                    value={shipForm.trackingId}
                    onChange={(e) => setShipForm({ ...shipForm, trackingId: e.target.value })}
                    placeholder="Carrier tracking number"
                    required
                  />
                  <FormField
                    label="Estimated arrival (optional)"
                    name="estimatedArrival"
                    type="datetime-local"
                    value={shipForm.estimatedArrival}
                    onChange={(e) => setShipForm({ ...shipForm, estimatedArrival: e.target.value })}
                  />
                  <FormTextarea
                    label="Notes (optional)"
                    name="notes"
                    value={shipForm.notes}
                    onChange={(e) => setShipForm({ ...shipForm, notes: e.target.value })}
                    rows={2}
                  />
                  <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                    <Button type="submit" variant="primary" disabled={submitting}>
                      {submitting ? 'Submitting...' : 'Mark as shipped'}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setShowShipForm(false)} disabled={submitting}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
              <p style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>
                Add tracking so admin and buyers can follow the shipment. Admin will verify when it arrives at the warehouse.
              </p>
            </div>
          )}
          {(order.status === 'SHIPPED' || order.status === 'IN_TRANSIT') && (
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              Order is shipped. Admin will verify receipt at the warehouse and notify buyers.
            </p>
          )}
          {(order.status === 'ARRIVED' || order.status === 'COMPLETED') && (
            <p style={{ fontSize: '14px', color: '#28a745', fontWeight: 600 }}>
              ✓ Order received at warehouse. Distribution to buyers is in progress or complete.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

export default OrderDetail;
