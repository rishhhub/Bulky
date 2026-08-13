import React from 'react';
import { Card } from '@shared/components/ui';
import { formatCurrency } from '@shared/utils/formatters';

export const CityGroupsView = ({ cityGroups }) => {
  if (!cityGroups || cityGroups.length === 0) {
    return <p>No deliveries for this order group.</p>;
  }

  return (
    <div>
      <h2>Orders Grouped by City</h2>
      {cityGroups.map((group, idx) => (
        <Card key={idx} style={{ marginBottom: '20px' }}>
          <h3>{group.city}, {group.state}</h3>
          <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
            <div>
              <p><strong>Total Quantity:</strong> {group.totalQuantity} units</p>
              <p><strong>Total Orders:</strong> {group.totalOrders}</p>
            </div>
            <div>
              <p><strong>Delivered:</strong> {group.deliveredCount}</p>
              <p><strong>Pending Delivery:</strong> {group.pendingDeliveryCount}</p>
            </div>
          </div>
          <div style={{ marginTop: '15px' }}>
            <h4>Orders for this City:</h4>
            {group.orders.map((item) => (
              <div key={item.interestId} style={{ padding: '10px', margin: '10px 0', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <p><strong>{item.userName}</strong> ({item.userEmail}) - {item.quantity} units</p>
                <p><strong>Address:</strong> {item.deliveryAddress}</p>
                <p>Total: {formatCurrency(item.totalPaid)} | Status: {item.delivered ? '✓ Delivered' : 'Pending Delivery'}</p>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default CityGroupsView;
