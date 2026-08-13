import React from 'react';
import { Card } from '@shared/components/ui';
import { formatCurrency, formatDateTime } from '@shared/utils/formatters';

export const OrderOverview = ({ orderDetail }) => {
  if (!orderDetail) return null;

  // Calculate order fulfillment status from order items
  const orderItems = orderDetail.orderItems || [];
  const ordersPlaced = orderItems.filter(item => item.orderId).length;
  const ordersDelivered = orderItems.filter(item => 
    item.orderStatus === 'DELIVERED' || item.orderStatus === 'PICKED_UP'
  ).length;
  const ordersInTransit = orderItems.filter(item => 
    item.orderStatus && ['SHIPPED', 'IN_TRANSIT', 'ARRIVED', 'OUT_FOR_DELIVERY', 'READY_FOR_PICKUP'].includes(item.orderStatus)
  ).length;
  
  // Determine overall fulfillment status
  let fulfillmentStatus = null;
  let fulfillmentStatusLabel = null;
  if (ordersPlaced > 0) {
    if (ordersDelivered === ordersPlaced) {
      fulfillmentStatus = 'FULFILLED';
      fulfillmentStatusLabel = 'All Orders Fulfilled';
    } else if (ordersInTransit > 0) {
      fulfillmentStatus = 'IN_PROGRESS';
      fulfillmentStatusLabel = `${ordersDelivered}/${ordersPlaced} Fulfilled`;
    } else {
      fulfillmentStatus = 'PENDING';
      fulfillmentStatusLabel = 'Orders Pending Fulfillment';
    }
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <h1>Order Details: {orderDetail.productName}</h1>
      {orderDetail.cityName && (
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e0f2fe', borderRadius: '6px', display: 'inline-block' }}>
          <strong>📍 Location:</strong> {orderDetail.cityName}
          {orderDetail.groupingKey && (
            <span style={{ fontSize: '12px', color: '#666', marginLeft: '10px' }}>
              (Group: {orderDetail.groupingKey})
            </span>
          )}
        </div>
      )}
      <div style={{ display: 'flex', gap: '20px', marginTop: '15px', flexWrap: 'wrap' }}>
        <Card style={{ padding: '15px', minWidth: '200px' }}>
          <p><strong>Total Quantity:</strong> {orderDetail.totalQuantity} units</p>
          <p><strong>Required Quantity:</strong> {orderDetail.requiredQuantity} units</p>
          <p><strong>Payment Status:</strong> 
            <span style={{ 
              color: orderDetail.status === 'COMPLETE' ? 'green' : 
                     orderDetail.status === 'COLLECTING' ? 'orange' : 'blue',
              fontWeight: 'bold',
              marginLeft: '10px'
            }}>
              {orderDetail.status === 'COMPLETE' ? 'All Payments Received' : orderDetail.status}
            </span>
          </p>
          {fulfillmentStatus && (
            <p style={{ marginTop: '8px' }}>
              <strong>Fulfillment Status:</strong> 
              <span style={{ 
                color: fulfillmentStatus === 'FULFILLED' ? 'green' : 
                       fulfillmentStatus === 'IN_PROGRESS' ? 'orange' : 'blue',
                fontWeight: 'bold',
                marginLeft: '10px'
              }}>
                {fulfillmentStatusLabel}
              </span>
            </p>
          )}
          {ordersPlaced > 0 && (
            <p style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
              {ordersPlaced} order{ordersPlaced !== 1 ? 's' : ''} placed, {ordersDelivered} delivered
            </p>
          )}
        </Card>
        <Card style={{ padding: '15px', minWidth: '200px' }}>
          <p><strong>Total Amount Collected:</strong></p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'green' }}>
            {formatCurrency(orderDetail.totalAmountCollected)}
          </p>
          <p><strong>Total Orders:</strong> {orderDetail.orderItems?.length || 0}</p>
        </Card>
      </div>
    </div>
  );
};

export default OrderOverview;
