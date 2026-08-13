import React from 'react';
import { Card, Button } from '@shared/components/ui';

export const InventoryView = ({ 
  orderDetail, 
  onMarkPickedUp, 
  onMarkDelivered 
}) => {
  if (!orderDetail || (!orderDetail.warehouseGroups?.length && !orderDetail.cityGroups?.length)) {
    return (
      <div>
        <h2>Inventory Management</h2>
        <p>No inventory data available. Order must be placed and have interests with warehouse/delivery information.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Inventory Management</h2>
      {orderDetail.warehouseGroups?.map((group, idx) => (
        <Card key={idx} style={{ marginBottom: '20px' }}>
          <h3>Warehouse: {group.warehouse?.name || 'Unknown Warehouse'}</h3>
          {group.warehouse && (
            <p><strong>Location:</strong> {group.warehouse.street || 'N/A'}{group.warehouse.city ? `, ${group.warehouse.city}` : ''}{group.warehouse.state ? `, ${group.warehouse.state}` : ''} {group.warehouse.pincode || ''}</p>
          )}
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <h4>Product: {orderDetail.productName}</h4>
            <p><strong>Total Quantity in Warehouse:</strong> {group.totalQuantity} units</p>
            <p><strong>Pending Pickup:</strong> {group.pendingPickupCount} orders</p>
            <p><strong>Picked Up:</strong> {group.pickedUpCount} orders</p>
            
            <div style={{ marginTop: '15px' }}>
              <h5>Pending Pickups:</h5>
              {group.orders.filter(o => !o.pickedUp).map((item) => (
                <div key={item.interestId} style={{ padding: '10px', margin: '5px 0', backgroundColor: 'white', borderRadius: '4px' }}>
                  <p><strong>{item.userName}</strong> ({item.userEmail}) - {item.quantity} units</p>
                  <Button 
                    variant="success"
                    size="sm"
                    onClick={() => onMarkPickedUp(item.interestId)}
                  >
                    Mark as Picked Up
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ))}
      
      {orderDetail.cityGroups?.map((group, idx) => (
        <Card key={idx} style={{ marginBottom: '20px' }}>
          <h3>Delivery to: {group.city}, {group.state}</h3>
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <h4>Product: {orderDetail.productName}</h4>
            <p><strong>Total Quantity:</strong> {group.totalQuantity} units</p>
            <p><strong>Pending Delivery:</strong> {group.pendingDeliveryCount} orders</p>
            <p><strong>Delivered:</strong> {group.deliveredCount} orders</p>
            
            <div style={{ marginTop: '15px' }}>
              <h5>Pending Deliveries:</h5>
              {group.orders.filter(o => !o.delivered).map((item) => (
                <div key={item.interestId} style={{ padding: '10px', margin: '5px 0', backgroundColor: 'white', borderRadius: '4px' }}>
                  <p><strong>{item.userName}</strong> ({item.userEmail}) - {item.quantity} units</p>
                  <p><strong>Address:</strong> {item.deliveryAddress}</p>
                  <Button 
                    variant="success"
                    size="sm"
                    onClick={() => onMarkDelivered(item.interestId)}
                  >
                    Mark as Delivered
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default InventoryView;
