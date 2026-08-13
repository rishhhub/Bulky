import React from 'react';
import { Card, Button } from '@shared/components/ui';
import { formatCurrency, formatDateTime } from '@shared/utils/formatters';
import { TransactionHistoryPanel } from '@shared/components/features';

export const OrderItemsView = ({ 
  orderItems, 
  sellerOrder, 
  onMarkPickedUp, 
  onMarkDelivered 
}) => {
  if (!orderItems || orderItems.length === 0) {
    return <p>No orders found.</p>;
  }

  return (
    <div>
      <h2>All Individual Orders</h2>
      {orderItems.map((item) => (
        <Card key={item.interestId} style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0 }}>{item.userName} ({item.userEmail})</h3>
                {item.orderNumber && (
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: '#dcfce7',
                    color: '#166534'
                  }}>
                    Order: {item.orderNumber}
                  </span>
                )}
                {item.orderStatus && (
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    textTransform: 'capitalize'
                  }}>
                    {item.orderStatus.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              <p><strong>Interest ID:</strong> #{item.interestId}</p>
              {item.orderId && <p><strong>Order ID:</strong> #{item.orderId}</p>}
              <p><strong>Quantity:</strong> {item.quantity} units</p>
              <p><strong>Unit Price:</strong> {formatCurrency(item.unitPrice)}</p>
              <p><strong>Total Price:</strong> {formatCurrency(item.totalPrice)}</p>
              <p><strong>Logistics:</strong> {item.logisticsPreference}</p>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginTop: '8px' }}>
                {item.orderStatus ? (
                  <>
                    <div>
                      <strong style={{ fontSize: '12px', color: '#6b7280' }}>Order Status:</strong>
                      <span style={{ 
                        marginLeft: '8px',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: item.orderStatus === 'DELIVERED' || item.orderStatus === 'PICKED_UP' ? '#dcfce7' :
                                         item.orderStatus === 'OUT_FOR_DELIVERY' || item.orderStatus === 'READY_FOR_PICKUP' ? '#dbeafe' :
                                         item.orderStatus === 'SHIPPED' || item.orderStatus === 'IN_TRANSIT' ? '#e0f2fe' :
                                         item.orderStatus === 'CANCELLED' ? '#fee2e2' : '#fef3c7',
                        color: item.orderStatus === 'DELIVERED' || item.orderStatus === 'PICKED_UP' ? '#166534' :
                               item.orderStatus === 'OUT_FOR_DELIVERY' || item.orderStatus === 'READY_FOR_PICKUP' ? '#1e40af' :
                               item.orderStatus === 'SHIPPED' || item.orderStatus === 'IN_TRANSIT' ? '#0369a1' :
                               item.orderStatus === 'CANCELLED' ? '#991b1b' : '#92400e',
                        textTransform: 'capitalize'
                      }}>
                        {item.orderStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div>
                      <strong style={{ fontSize: '12px', color: '#6b7280' }}>Interest Status:</strong>
                      <span style={{ 
                        marginLeft: '8px',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: '#f3f4f6',
                        color: '#6b7280'
                      }}>
                        {item.status} (Payments Complete)
                      </span>
                    </div>
                  </>
                ) : (
                  <div>
                    <strong style={{ fontSize: '12px', color: '#6b7280' }}>Interest Status:</strong>
                    <span style={{ 
                      marginLeft: '8px',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: item.status === 'COMPLETE' ? '#dcfce7' : '#fef3c7',
                      color: item.status === 'COMPLETE' ? '#166534' : '#92400e'
                    }}>
                      {item.status} {item.status === 'COMPLETE' ? '(All Payments Received - Order Not Yet Placed)' : ''}
                    </span>
                  </div>
                )}
              </div>
              {item.logisticsPreference === 'DELIVERY' && item.deliveryAddress && (
                <p><strong>Delivery Address:</strong> {item.deliveryAddress}</p>
              )}
              {item.logisticsPreference === 'PICKUP' && item.warehouse && (
                <div>
                  <p><strong>Warehouse:</strong> {item.warehouse.name}</p>
                  <p style={{ fontSize: '12px', color: '#666' }}>
                    {item.warehouse.street || 'N/A'}{item.warehouse.city ? `, ${item.warehouse.city}` : ''}{item.warehouse.state ? `, ${item.warehouse.state}` : ''} {item.warehouse.pincode || ''}
                  </p>
                  <p style={{ fontSize: '12px', color: '#666' }}>
                    Phone: {item.warehouse.phone} | Hours: {item.warehouse.hoursOfOperation}
                  </p>
                </div>
              )}
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <p><strong>Payment Summary:</strong></p>
                <p>Deposit: {formatCurrency(item.depositPaid || 0)}</p>
                <p>Remaining: {formatCurrency(item.remainingPaid || 0)}</p>
                <p>Logistics: {formatCurrency(item.logisticsPaid || 0)}</p>
                <p style={{ fontWeight: 'bold', marginTop: '5px' }}>
                  Total Paid: {formatCurrency(item.totalPaid || 0)}
                </p>
              </div>
              
              {/* Transaction History */}
              <div style={{ marginTop: '15px' }}>
                <TransactionHistoryPanel interestId={item.interestId} />
              </div>
            </div>
            <div style={{ marginLeft: '20px' }}>
              {item.logisticsPreference === 'PICKUP' && (
                <div>
                  <p><strong>Pickup Status:</strong></p>
                  {item.pickedUp ? (
                    <span style={{ color: 'green', fontWeight: 'bold' }}>✓ Picked Up</span>
                  ) : (
                    <span style={{ color: 'orange', fontWeight: 'bold' }}>Pending</span>
                  )}
                  {item.pickedUpAt && (
                    <p style={{ fontSize: '12px' }}>Picked up: {formatDateTime(item.pickedUpAt)}</p>
                  )}
                  {!item.pickedUp && sellerOrder && sellerOrder.status === 'ARRIVED' && (
                    <Button 
                      variant="success"
                      size="sm"
                      onClick={() => onMarkPickedUp(item.interestId)}
                      style={{ marginTop: '5px' }}
                    >
                      Mark as Picked Up
                    </Button>
                  )}
                </div>
              )}
              {item.logisticsPreference === 'DELIVERY' && (
                <div>
                  <p><strong>Delivery Status:</strong></p>
                  {item.delivered ? (
                    <span style={{ color: 'green', fontWeight: 'bold' }}>✓ Delivered</span>
                  ) : (
                    <span style={{ color: 'orange', fontWeight: 'bold' }}>Pending</span>
                  )}
                  {item.deliveredAt && (
                    <p style={{ fontSize: '12px' }}>Delivered: {formatDateTime(item.deliveredAt)}</p>
                  )}
                  {!item.delivered && sellerOrder && sellerOrder.status === 'ARRIVED' && (
                    <Button 
                      variant="success"
                      size="sm"
                      onClick={() => onMarkDelivered(item.interestId)}
                      style={{ marginTop: '5px' }}
                    >
                      Mark as Delivered
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default OrderItemsView;
