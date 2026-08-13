import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card.jsx';
import { Button } from '../ui/Button.jsx';
import { formatCurrency, formatDateTime } from '../../utils/formatters.js';
import { transactionService } from '@shared/services';
import { logger } from '../../utils/logger.js';

/**
 * Enhanced Transaction history panel showing all transactions for an Interest or OrderGroup
 * 
 * @param {Object} props
 * @param {number} props.interestId - Interest ID (optional)
 * @param {number} props.orderGroupId - OrderGroup ID (optional)
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.compact - Compact mode for inline display
 */
export const TransactionHistoryPanel = ({ 
  interestId, 
  orderGroupId, 
  loading: externalLoading = false,
  compact = false 
}) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (isExpanded && (interestId || orderGroupId)) {
      loadTransactions();
    }
  }, [isExpanded, interestId, orderGroupId]);

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      let data = [];
      if (interestId) {
        data = await transactionService.getTransactionsByInterestId(interestId);
      } else if (orderGroupId) {
        data = await transactionService.getTransactionsByOrderGroupId(orderGroupId);
      }
      setTransactions(data || []);
    } catch (err) {
      logger.error('Failed to load transactions:', err);
      setError('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

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

  const getTransactionIcon = (type) => {
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

  // Get unique transaction types for filter
  const transactionTypes = [...new Set(transactions.map(t => t.transactionType))].sort();

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'all') return true;
    return t.transactionType === filterType;
  });

  // Calculate summary stats
  const totalPayments = transactions
    .filter(t => t.transactionType === 'PAYMENT_RECEIVED' && t.amount)
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  
  const totalRefunds = transactions
    .filter(t => t.transactionType === 'REFUND_ISSUED' && t.amount)
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  if (externalLoading || loading) {
    return (
      <Card style={{ padding: compact ? '12px' : '16px' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Loading transaction history...</p>
      </Card>
    );
  }

  return (
    <Card style={{ 
      padding: compact ? '12px' : '16px', 
      marginBottom: compact ? '0' : '16px',
      backgroundColor: compact ? '#f9fafb' : 'white'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: isExpanded ? '12px' : '0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h4 style={{ margin: 0, fontSize: compact ? '14px' : '16px', fontWeight: '600' }}>
            Transaction History
          </h4>
          {transactions.length > 0 && (
            <span style={{
              fontSize: '12px',
              backgroundColor: '#e5e7eb',
              color: '#6b7280',
              padding: '2px 8px',
              borderRadius: '12px',
              fontWeight: '500'
            }}>
              {transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'}
            </span>
          )}
        </div>
        <Button
          variant="info"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ fontSize: compact ? '12px' : '14px', padding: compact ? '4px 8px' : '6px 12px' }}
        >
          {isExpanded ? '▼ Hide' : '▶ Show'} History
        </Button>
      </div>

      {error && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#fef2f2', 
          color: '#991b1b', 
          borderRadius: '4px', 
          marginBottom: '12px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {isExpanded && (
        <div>
          {transactions.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '10px 0' }}>
              No transaction history available.
            </p>
          ) : (
            <>
              {/* Summary Stats */}
              {!compact && (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                  gap: '10px', 
                  marginBottom: '15px' 
                }}>
                  <div style={{ 
                    padding: '10px', 
                    backgroundColor: '#f0fdf4', 
                    borderRadius: '4px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Payments</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                      {formatCurrency(totalPayments)}
                    </div>
                  </div>
                  <div style={{ 
                    padding: '10px', 
                    backgroundColor: '#fef2f2', 
                    borderRadius: '4px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Refunds</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>
                      {formatCurrency(totalRefunds)}
                    </div>
                  </div>
                  <div style={{ 
                    padding: '10px', 
                    backgroundColor: '#fef3c7', 
                    borderRadius: '4px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Net Amount</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b' }}>
                      {formatCurrency(totalPayments - totalRefunds)}
                    </div>
                  </div>
                </div>
              )}

              {/* Filter */}
              {!compact && transactionTypes.length > 1 && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '8px'
                  }}>
                    Filter by type:
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                        fontSize: '14px',
                        backgroundColor: 'white'
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
                </div>
              )}

              {/* Transactions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '8px' : '12px' }}>
                {filteredTransactions.length === 0 ? (
                  <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                    No transactions match the selected filter.
                  </p>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      getTransactionTypeColor={getTransactionTypeColor}
                      getTransactionIcon={getTransactionIcon}
                      compact={compact}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
};

const TransactionItem = ({ transaction, getTransactionTypeColor, getTransactionIcon, compact = false }) => {
  const color = getTransactionTypeColor(transaction.transactionType);
  const icon = getTransactionIcon(transaction.transactionType);
  const isRefund = transaction.amount && parseFloat(transaction.amount) < 0;
  const isPayment = transaction.amount && parseFloat(transaction.amount) > 0;

  return (
    <div
      style={{
        padding: compact ? '10px' : '12px',
        backgroundColor: compact ? '#ffffff' : '#f8f9fa',
        borderRadius: '6px',
        borderLeft: `4px solid ${color}`,
        fontSize: compact ? '13px' : '14px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
        <div style={{ fontSize: compact ? '18px' : '20px', flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontWeight: '600', 
                fontSize: compact ? '13px' : '14px',
                color: color,
                textTransform: 'capitalize',
                marginBottom: '4px'
              }}>
                {transaction.transactionType.replace(/_/g, ' ')}
              </div>
              {transaction.description && (
                <div style={{ 
                  fontSize: compact ? '12px' : '13px', 
                  color: '#6b7280', 
                  marginBottom: '4px',
                  wordBreak: 'break-word'
                }}>
                  {transaction.description}
                </div>
              )}
            </div>
            <div style={{ fontSize: compact ? '11px' : '12px', color: '#9ca3af', flexShrink: 0 }}>
              {formatDateTime(transaction.createdAt)}
            </div>
          </div>

          {/* Old/New Values */}
          {(transaction.oldValue || transaction.newValue) && (
            <div style={{ 
              fontSize: compact ? '11px' : '12px', 
              color: '#6b7280',
              marginBottom: '6px',
              padding: '8px',
              backgroundColor: '#ffffff',
              borderRadius: '4px'
            }}>
              {transaction.oldValue && (
                <div style={{ marginBottom: '4px' }}>
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
              marginTop: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              {transaction.amount && parseFloat(transaction.amount) !== 0 && (
                <div style={{ 
                  fontSize: compact ? '12px' : '13px',
                  fontWeight: '600',
                  color: isRefund ? '#ef4444' : (isPayment ? '#10b981' : '#6b7280'),
                  padding: '6px 10px',
                  backgroundColor: isRefund ? '#fef2f2' : (isPayment ? '#f0fdf4' : '#f3f4f6'),
                  borderRadius: '4px',
                  display: 'inline-block',
                  width: 'fit-content'
                }}>
                  Amount: {formatCurrency(Math.abs(transaction.amount))}
                  {isRefund ? ' (Refund)' : (isPayment ? ' (Payment)' : '')}
                </div>
              )}
              {transaction.calculation && (
                <div style={{ 
                  fontSize: compact ? '11px' : '12px',
                  fontFamily: 'monospace',
                  color: '#6b7280',
                  padding: '8px',
                  backgroundColor: '#ffffff',
                  borderRadius: '4px',
                  whiteSpace: 'pre-line',
                  wordBreak: 'break-word'
                }}>
                  <strong>Calculation:</strong><br />
                  {transaction.calculation}
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          {(transaction.userId || transaction.adminId || transaction.relatedPaymentId) && (
            <div style={{ 
              marginTop: '8px', 
              paddingTop: '8px', 
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: '12px',
              fontSize: compact ? '11px' : '12px',
              color: '#6b7280',
              flexWrap: 'wrap'
            }}>
              {transaction.userId && (
                <span>User: {transaction.userId}</span>
              )}
              {transaction.adminId && (
                <span>Admin: {transaction.adminId}</span>
              )}
              {transaction.relatedPaymentId && (
                <span>Payment ID: {transaction.relatedPaymentId}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionHistoryPanel;
