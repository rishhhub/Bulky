import React, { useState, useEffect } from 'react';
import { financialService } from '@shared/services';
import { Card, LoadingSpinner } from '@shared/components/ui';
import { logger } from '@shared/utils';
import { AccountBalanceCard, OrderGroupFinancialPanel } from '@shared/components/features';

/**
 * Financial Dashboard for admins
 * Shows overall account balance and per-order-group financials
 */
function FinancialDashboard() {
  const [accountBalance, setAccountBalance] = useState(null);
  const [orderGroupFinancials, setOrderGroupFinancials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrderGroupId, setSelectedOrderGroupId] = useState(null);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [balance, financials] = await Promise.all([
        financialService.getAccountBalance(),
        financialService.getAllOrderGroupFinancials()
      ]);
      setAccountBalance(balance);
      setOrderGroupFinancials(financials || []);
    } catch (err) {
      logger.error('Failed to load financial data:', err);
      setError('Failed to load financial data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '24px',
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '24px',
        minHeight: 'calc(100vh - 60px)'
      }}>
        <Card style={{ padding: '24px' }}>
          <div style={{ color: '#dc3545', marginBottom: '16px' }}>{error}</div>
          <button 
            onClick={loadFinancialData}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: '24px',
      minHeight: 'calc(100vh - 60px)'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#111827' }}>
          Financial Dashboard
        </h1>
        <p style={{ marginTop: '8px', color: '#6b7280', fontSize: '16px' }}>
          Complete financial overview and per-order-group breakdown
        </p>
      </div>

      {/* Account Balance Overview */}
      <AccountBalanceCard accountBalance={accountBalance} />

      {/* Order Group Financials */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>
          Order Group Financials
        </h2>
        {orderGroupFinancials.length === 0 ? (
          <Card style={{ padding: '24px' }}>
            <p style={{ color: '#6b7280' }}>No order groups found.</p>
          </Card>
        ) : (
          <div>
            {selectedOrderGroupId ? (
              <div>
                <button
                  onClick={() => setSelectedOrderGroupId(null)}
                  style={{
                    marginBottom: '16px',
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ← Back to All
                </button>
                {orderGroupFinancials
                  .filter(f => f.orderGroupId === selectedOrderGroupId)
                  .map(financial => (
                    <OrderGroupFinancialPanel key={financial.orderGroupId} financialSummary={financial} />
                  ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {orderGroupFinancials.map(financial => (
                  <Card 
                    key={financial.orderGroupId}
                    style={{ 
                      padding: '20px',
                      cursor: 'pointer',
                      transition: 'box-shadow 0.2s',
                      border: '1px solid #e5e7eb'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                    onClick={() => setSelectedOrderGroupId(financial.orderGroupId)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                          {financial.productName}
                        </h3>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
                          Order Group #{financial.orderGroupId} | {financial.totalQuantity} units
                        </div>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                          <div>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>Revenue: </span>
                            <span style={{ fontSize: '16px', fontWeight: '600', color: '#28a745' }}>
                              ₹{financial.totalRevenue?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                          <div>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>Costs: </span>
                            <span style={{ fontSize: '16px', fontWeight: '600', color: '#dc3545' }}>
                              ₹{financial.totalCosts?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                          <div>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>Profit: </span>
                            <span style={{ 
                              fontSize: '16px', 
                              fontWeight: '600',
                              color: (financial.netProfit || 0) >= 0 ? '#28a745' : '#dc3545'
                            }}>
                              ₹{financial.netProfit?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                          <div>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>Margin: </span>
                            <span style={{ fontSize: '16px', fontWeight: '600' }}>
                              {financial.profitMargin?.toFixed(2) || '0.00'}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ 
                        padding: '8px 12px',
                        backgroundColor: '#e3f2fd',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#1976d2'
                      }}>
                        Click to view details
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default FinancialDashboard;
