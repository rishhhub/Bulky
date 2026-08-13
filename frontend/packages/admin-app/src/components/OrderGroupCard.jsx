import React from 'react';
import { Card, Badge, Button } from '@shared/components/ui';
import { formatCurrency, formatDateTime } from '@shared/utils/formatters';
import { ORDER_GROUP_STATUS } from '@shared/utils/constants';

export const OrderGroupCard = ({ orderGroup, onViewDetails, onPlaceOrder }) => {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
        <div>
          <h3 style={{ margin: '0 0 10px 0' }}>{orderGroup.productName || 'Unknown Product'}</h3>
          <Badge status={orderGroup.status} variant="solid">
            {orderGroup.status?.replace(/_/g, ' ') || 'Unknown'}
          </Badge>
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <p><strong>Product ID:</strong> {orderGroup.productId}</p>
        <p><strong>Total Quantity:</strong> {orderGroup.totalQuantity || 0} units</p>
        <p><strong>Required Quantity:</strong> {orderGroup.requiredQuantity || 0} units</p>
        {orderGroup.totalAmountCollected && (
          <p><strong>Amount Collected:</strong> {formatCurrency(orderGroup.totalAmountCollected)}</p>
        )}
        {orderGroup.createdAt && (
          <p><strong>Created:</strong> {formatDateTime(orderGroup.createdAt)}</p>
        )}
        {orderGroup.completedAt && (
          <p><strong>Completed:</strong> {formatDateTime(orderGroup.completedAt)}</p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onViewDetails(orderGroup.id)}
        >
          View Details
        </Button>
        {orderGroup.status === ORDER_GROUP_STATUS.COMPLETE && onPlaceOrder && (
          <Button
            variant="success"
            size="sm"
            onClick={() => onPlaceOrder(orderGroup.id)}
          >
            Place Order
          </Button>
        )}
      </div>
    </Card>
  );
};

export default OrderGroupCard;
