import React, { useState, useEffect } from 'react';
import { Card } from '@shared/components/ui';
import { formatCurrency, formatDateTime } from '@shared/utils/formatters';
import { transactionService } from '@shared/services';
import { logger } from '@shared/utils';

export const TransactionsView = ({ orderItems, orderGroupId }) => {
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [groupBy, setGroupBy] = useState('chronological'); // 'chronological' or 'interest'
  const [expandedInterests, setExpandedInterests] = useState(new Set());

  useEffect(() => {
    if (orderGroupId) {
      loadTransactionHistory();
    }
  }, [orderGroupId]);

  const loadTransactionHistory = async () => {
    if (!orderGroupId) return;
    
    try {
      setLoading(true);
      const data = await transactionService.getTransactionsByOrderGroupId(orderGroupId);
      setTransactionHistory(data || []);
    } catch (err) {
      logger.error('Failed to load transaction history:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleInterestExpansion = (interestId) => {
    const newExpanded = new Set(expandedInterests);
    if (newExpanded.has(interestId)) {
      newExpanded.delete(interestId);
    } else {
      newExpanded.add(interestId);
    }
    setExpandedInterests(newExpanded);
  };

  // Get unique transaction types for filter
  const transactionTypes = [...new Set(transactionHistory.map(t => t.transactionType))].sort();

  // Filter transactions
  const filteredTransactions = transactionHistory.filter(t => {
    if (filterType === 'all') return true;
    return t.transactionType === filterType;
  });

  // Group transactions
  const groupedTransactions = groupBy === 'interest' 
    ? groupByInterest(filteredTransactions)
    : { chronological: filteredTransactions };

  const getTransactionTypeColor = (type) => {
    const colors = {
      'CREATED': '#10b981',
      'QUANTITY_CHANGED': '#f59e0b',
      'STATUS_CHANGED': '#3b82f6',
      'PAYMENT_RECEIVED': '#10b981',
      'REFUND_ISSUED': '#ef4444',
      'EXTENDED': '#8b5cf6',
      'WITHDRAWN': '#ef4444',
      'ADDRESS_CHANGED': '#06b6d4',
      'WAREHOUSE_CHANGED': '#06b6d4',
      'LOGISTICS_CHANGED': '#06b6d4',
      'DIRECT_ORDER_PLACED': '#10b981'
    };
    return colors[type] || '#6b7280';
  };

  const getTransactionTypeIcon = (type) => {
    const icons = {
      'CREATED': '✨',
      'QUANTITY_CHANGED': '📊',
      'STATUS_CHANGED': '🔄',
      'PAYMENT_RECEIVED': '💰',
      'REFUND_ISSUED': '↩️',
      'EXTENDED': '⏰',
      'WITHDRAWN': '❌',
      'ADDRESS_CHANGED': '📍',
      'WAREHOUSE_CHANGED': '🏭',
      'LOGISTICS_CHANGED': '🚚',
      'DIRECT_ORDER_PLACED': '⚡'
    };
    return icons[type] || '📝';
  };

  if (loading) {
    return (
      <Card>
        <p>Loading transaction history...</p>
      </Card>
    );
  }

  if (!orderGroupId) {
    return (
      <Card>
        <p>Order group ID not available.</p>
      </Card>
    );
  }

  if (transactionHistory.length === 0) {
    return (
      <Card>
        <h2>Transaction History</h2>
        <p style={{ color: '#6b7280', marginTop: '10px' }}>
          No transaction history found for this order group.
        </p>
      </Card>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Transaction History</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Filter:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                fontSize: '14px'
              }}
            >
              <option value="all">All Types</option>
              {transactionTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Group By:</span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                fontSize: '14px'
              }}
            >
              <option value="chronological">Chronological</option>
              <option value="interest">By Interest</option>
            </select>
          </label>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <Card style={{ padding: '15px', backgroundColor: '#f0fdf4' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>Total Transactions</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
            {transactionHistory.length}
          </div>
        </Card>
        <Card style={{ padding: '15px', backgroundColor: '#f0fdf4' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>Total Payments</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
            {formatCurrency(
              transactionHistory
                .filter(t => t.transactionType === 'PAYMENT_RECEIVED' && t.amount)
                .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
            )}
          </div>
        </Card>
        <Card style={{ padding: '15px', backgroundColor: '#fef2f2' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>Total Refunds</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
            {formatCurrency(
              transactionHistory
                .filter(t => t.transactionType === 'REFUND_ISSUED' && t.amount)
                .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
            )}
          </div>
        </Card>
        <Card style={{ padding: '15px', backgroundColor: '#fef3c7' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>Quantity Changes</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
            {transactionHistory.filter(t => t.transactionType === 'QUANTITY_CHANGED').length}
          </div>
        </Card>
      </div>

      {/* Transactions List */}
      {groupBy === 'chronological' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {filteredTransactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              getTransactionTypeColor={getTransactionTypeColor}
              getTransactionTypeIcon={getTransactionTypeIcon}
              orderItems={orderItems}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {Object.entries(groupedTransactions).map(([interestId, transactions]) => {
            const orderItem = orderItems?.find(item => item.interestId === parseInt(interestId));
            return (
              <Card key={interestId} style={{ padding: '20px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    marginBottom: expandedInterests.has(interestId) ? '15px' : '0'
                  }}
                  onClick={() => toggleInterestExpansion(interestId)}
                >
                  <div>
                    <h3 style={{ margin: 0 }}>
                      Interest #{interestId}
                      {orderItem && (
                        <span style={{ marginLeft: '10px', fontSize: '14px', color: '#6b7280', fontWeight: 'normal' }}>
                          - {orderItem.userName} ({orderItem.userEmail})
                        </span>
                      )}
                    </h3>
                    <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                      {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span style={{ fontSize: '20px' }}>
                    {expandedInterests.has(interestId) ? '▼' : '▶'}
                  </span>
                </div>
                {expandedInterests.has(interestId) && (
                  <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {transactions.map((transaction) => (
                      <TransactionCard
                        key={transaction.id}
                        transaction={transaction}
                        getTransactionTypeColor={getTransactionTypeColor}
                        getTransactionTypeIcon={getTransactionTypeIcon}
                        orderItems={orderItems}
                        compact={true}
                      />
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

const TransactionCard = ({ transaction, getTransactionTypeColor, getTransactionTypeIcon, orderItems, compact = false }) => {
  const orderItem = orderItems?.find(item => item.interestId === transaction.interestId);
  
  return (
    <Card style={{ 
      padding: compact ? '12px' : '15px',
      borderLeft: `4px solid ${getTransactionTypeColor(transaction.transactionType)}`,
      backgroundColor: compact ? '#f9fafb' : 'white'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
            <span style={{ fontSize: '18px' }}>{getTransactionTypeIcon(transaction.transactionType)}</span>
            <span style={{ 
              fontWeight: 'bold',
              color: getTransactionTypeColor(transaction.transactionType),
              fontSize: compact ? '14px' : '16px'
            }}>
              {transaction.transactionType.replace(/_/g, ' ')}
            </span>
            {!compact && orderItem && (
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                - Interest #{transaction.interestId} ({orderItem.userName})
              </span>
            )}
          </div>
          {transaction.description && (
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#374151' }}>
              {transaction.description}
            </p>
          )}
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>
          {formatDateTime(transaction.createdAt)}
        </div>
      </div>

      {/* Old/New Values */}
      {(transaction.oldValue || transaction.newValue) && (
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          backgroundColor: '#f3f4f6', 
          borderRadius: '4px',
          fontSize: '13px'
        }}>
          {transaction.oldValue && (
            <div style={{ marginBottom: '5px' }}>
              <strong>From:</strong> <span style={{ color: '#ef4444' }}>{transaction.oldValue}</span>
            </div>
          )}
          {transaction.newValue && (
            <div>
              <strong>To:</strong> <span style={{ color: '#10b981' }}>{transaction.newValue}</span>
            </div>
          )}
        </div>
      )}

      {/* Amount and Calculation */}
      {(transaction.amount || transaction.calculation) && (
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          backgroundColor: transaction.amount && parseFloat(transaction.amount) < 0 
            ? '#fef2f2' 
            : '#f0fdf4', 
          borderRadius: '4px',
          fontSize: '13px'
        }}>
          {transaction.amount && (
            <div style={{ marginBottom: transaction.calculation ? '5px' : '0' }}>
              <strong>Amount:</strong> 
              <span style={{ 
                fontWeight: 'bold',
                color: parseFloat(transaction.amount) < 0 ? '#ef4444' : '#10b981',
                marginLeft: '8px',
                fontSize: '16px'
              }}>
                {formatCurrency(Math.abs(transaction.amount))}
                {parseFloat(transaction.amount) < 0 ? ' (Refund)' : ''}
              </span>
            </div>
          )}
          {transaction.calculation && (
            <div style={{ color: '#6b7280', fontFamily: 'monospace', fontSize: '12px' }}>
              <strong>Calculation:</strong> {transaction.calculation}
            </div>
          )}
        </div>
      )}

      {/* Metadata */}
      <div style={{ 
        marginTop: '10px', 
        paddingTop: '10px', 
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        gap: '15px',
        fontSize: '12px',
        color: '#6b7280'
      }}>
        {transaction.userId && (
          <span>User ID: {transaction.userId}</span>
        )}
        {transaction.adminId && (
          <span>Admin ID: {transaction.adminId}</span>
        )}
        {transaction.relatedPaymentId && (
          <span>Payment ID: {transaction.relatedPaymentId}</span>
        )}
      </div>
    </Card>
  );
};

// Helper function to group transactions by interest
const groupByInterest = (transactions) => {
  const grouped = {};
  transactions.forEach(transaction => {
    const interestId = transaction.interestId;
    if (!grouped[interestId]) {
      grouped[interestId] = [];
    }
    grouped[interestId].push(transaction);
  });
  return grouped;
};

export default TransactionsView;
