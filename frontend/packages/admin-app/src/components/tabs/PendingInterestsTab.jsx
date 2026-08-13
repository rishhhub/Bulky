import React from 'react';
import { Card, LoadingSpinner } from '@shared/components/ui';
import { formatDateTime } from '@shared/utils/formatters';
import { usePendingInterests } from '../../hooks';

export const PendingInterestsTab = () => {
  const { pendingInterests, loading } = usePendingInterests(true);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <LoadingSpinner />
      </div>
    );
  }

  // Group by product
  const groupedInterests = pendingInterests.reduce((acc, interest) => {
    const key = interest.productId;
    if (!acc[key]) {
      acc[key] = {
        productName: interest.productName,
        productId: interest.productId,
        interests: [],
        totalQuantity: 0,
      };
    }
    acc[key].interests.push(interest);
    acc[key].totalQuantity += interest.quantity;
    return acc;
  }, {});

  return (
    <div>
      <h2>Pending Interests</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        These are interests that haven't reached threshold or haven't expired yet. 
        Order groups are created automatically when interests expire and threshold is met.
      </p>
      {pendingInterests.length === 0 ? (
        <Card>
          <p>No pending interests found</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {Object.entries(groupedInterests).map(([productId, group]) => (
            <Card key={productId}>
              <h3>{group.productName}</h3>
              <p><strong>Total Quantity:</strong> {group.totalQuantity} units</p>
              <p><strong>Number of Interests:</strong> {group.interests.length}</p>
              <div style={{ marginTop: '15px' }}>
                <h4>Individual Interests:</h4>
                {group.interests.map((interest) => (
                  <div key={interest.interestId} style={{ padding: '10px', backgroundColor: '#f8f9fa', marginBottom: '10px', borderRadius: '4px' }}>
                    <p><strong>User:</strong> {interest.userEmail}</p>
                    <p><strong>Quantity:</strong> {interest.quantity} units</p>
                    <p><strong>End Date:</strong> {formatDateTime(interest.endDate)}</p>
                    {interest.isExpired ? (
                      <p style={{ color: 'red', fontWeight: 'bold' }}>EXPIRED - Ready for threshold check</p>
                    ) : (
                      <p style={{ color: 'green' }}>{interest.daysRemaining} days remaining</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingInterestsTab;
