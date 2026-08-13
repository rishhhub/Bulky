import React from 'react';
import { Card } from '@shared/components/ui';
import { formatCurrency } from '@shared/utils/formatters';

export const WarehouseGroupsView = ({ warehouseGroups }) => {
  if (!warehouseGroups || warehouseGroups.length === 0) {
    return <p>No warehouse pickups for this order group.</p>;
  }

  return (
    <div>
      <h2>Orders Grouped by Warehouse</h2>
      {warehouseGroups.map((group, idx) => (
        <Card key={idx} style={{ marginBottom: '20px' }}>
          <h3>{group.warehouse.name}</h3>
          <p><strong>Address:</strong> {group.warehouse.street || 'N/A'}{group.warehouse.city ? `, ${group.warehouse.city}` : ''}{group.warehouse.state ? `, ${group.warehouse.state}` : ''} {group.warehouse.pincode || ''}</p>
          <p><strong>Phone:</strong> {group.warehouse.phone} | <strong>Hours:</strong> {group.warehouse.hoursOfOperation}</p>
          <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
            <div>
              <p><strong>Total Quantity:</strong> {group.totalQuantity} units</p>
              <p><strong>Total Orders:</strong> {group.totalOrders}</p>
            </div>
            <div>
              <p><strong>Picked Up:</strong> {group.pickedUpCount}</p>
              <p><strong>Pending Pickup:</strong> {group.pendingPickupCount}</p>
            </div>
          </div>
          <div style={{ marginTop: '15px' }}>
            <h4>Orders for this Warehouse:</h4>
            {group.orders.map((item) => (
              <div key={item.interestId} style={{ padding: '10px', margin: '10px 0', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <p><strong>{item.userName}</strong> ({item.userEmail}) - {item.quantity} units</p>
                <p>Total: {formatCurrency(item.totalPaid)} | Status: {item.pickedUp ? '✓ Picked Up' : 'Pending Pickup'}</p>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default WarehouseGroupsView;
