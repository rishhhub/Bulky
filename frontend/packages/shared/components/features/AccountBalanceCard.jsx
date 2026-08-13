import React from 'react';
import { Card } from '../ui/Card.jsx';
import { formatCurrency } from '../../utils/formatters.js';

/**
 * Account balance card showing overall financial status
 * 
 * @param {Object} props
 * @param {Object} props.accountBalance - AccountBalanceDTO
 * @param {boolean} props.loading - Loading state
 */
export const AccountBalanceCard = ({ accountBalance, loading = false }) => {
  if (loading) {
    return (
      <Card style={{ padding: '24px' }}>
        <p>Loading account balance...</p>
      </Card>
    );
  }

  if (!accountBalance) {
    return (
      <Card style={{ padding: '24px' }}>
        <p>No account balance data available.</p>
      </Card>
    );
  }

  const isProfit = accountBalance.currentBalance && accountBalance.currentBalance >= 0;
  const balanceColor = isProfit ? '#28a745' : '#dc3545';

  return (
    <Card style={{ padding: '24px', marginBottom: '24px' }}>
      <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>
        Account Overview
      </h2>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px',
        marginBottom: '20px'
      }}>
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          border: `2px solid ${balanceColor}`
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            Current Balance
          </div>
          <div style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: balanceColor 
          }}>
            {formatCurrency(accountBalance.currentBalance || 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            {isProfit ? 'Profit' : 'Loss'}
          </div>
        </div>

        <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            Total Revenue
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#111827' }}>
            {formatCurrency(accountBalance.totalRevenue || 0)}
          </div>
        </div>

        <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            Total Costs
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#111827' }}>
            {formatCurrency(accountBalance.totalCosts || 0)}
          </div>
        </div>

        <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            Total Refunds
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#dc3545' }}>
            {formatCurrency(accountBalance.totalRefunds || 0)}
          </div>
        </div>

        <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            Profit Margin
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#111827' }}>
            {accountBalance.overallProfitMargin ? `${accountBalance.overallProfitMargin}%` : '0%'}
          </div>
        </div>
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '16px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <div style={{ fontWeight: '600', marginBottom: '8px' }}>Statistics:</div>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <span><strong>Order Groups:</strong> {accountBalance.totalOrderGroups || 0}</span>
          <span><strong>Interests:</strong> {accountBalance.totalInterests || 0}</span>
          <span><strong>Payments:</strong> {accountBalance.totalPayments || 0}</span>
        </div>
      </div>

      {accountBalance.calculationFormula && (
        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          backgroundColor: '#fff3cd', 
          borderRadius: '8px',
          fontSize: '13px',
          fontFamily: 'monospace',
          whiteSpace: 'pre-line'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>Calculation:</div>
          {accountBalance.calculationFormula}
        </div>
      )}
    </Card>
  );
};

export default AccountBalanceCard;
