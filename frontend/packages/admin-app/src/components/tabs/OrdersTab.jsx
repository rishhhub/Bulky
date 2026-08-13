import React from 'react';
import { Card, Button, LoadingSpinner } from '@shared/components/ui';
import { OrderGroupCard } from '../OrderGroupCard';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@shared/context';
import { getErrorMessage } from '@shared/utils';
import { useOrderGroups } from '../../hooks';

export const OrdersTab = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { orderGroups, loading, refresh } = useOrderGroups(true);

  const handleCheckCompletion = async () => {
    try {
      // This endpoint doesn't exist in the service yet, but we can add it
      const response = await fetch('/api/admin/order-groups/check-completion', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        toast.success('Payment completion check completed. Refreshing...');
        refresh();
      } else {
        throw new Error('Failed to check payment completion');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to check payment completion'));
    }
  };

  const handleCheckThresholds = async () => {
    try {
      const response = await fetch('/api/admin/order-groups/check-thresholds', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        toast.success('Threshold check completed. Refreshing...');
        refresh();
      } else {
        throw new Error('Failed to check thresholds');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to check thresholds'));
    }
  };

  const handleViewDetails = (orderGroupId) => {
    navigate(`/admin/order-groups/${orderGroupId}`);
  };

  const handlePlaceOrder = (orderGroupId) => {
    navigate(`/admin/order-groups/${orderGroupId}`);
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
        <h2>Order Groups</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="success" onClick={handleCheckCompletion}>
            Check Payment Completion
          </Button>
          <Button variant="primary" onClick={handleCheckThresholds}>
            Check Thresholds Now
          </Button>
        </div>
      </div>
      {orderGroups.length === 0 ? (
        <Card>
          <p>No order groups found</p>
          <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
            Order groups are created automatically when:
            <ul style={{ marginTop: '5px' }}>
              <li>Threshold is met (total quantity ≥ minimum order quantity)</li>
              <li>All users have paid their remaining balance</li>
            </ul>
            Click "Check Payment Completion" to manually check for completed payments.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {orderGroups.map((group) => (
            <OrderGroupCard
              key={group.id}
              orderGroup={group}
              onViewDetails={handleViewDetails}
              onPlaceOrder={handlePlaceOrder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersTab;
