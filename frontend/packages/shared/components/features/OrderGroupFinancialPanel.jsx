import React from 'react';
import { Card } from '../ui/Card.jsx';
import { formatCurrency } from '../../utils/formatters.js';
import { CalculationBreakdown } from './CalculationBreakdown.jsx';

/**
 * Financial panel for a single OrderGroup
 * 
 * @param {Object} props
 * @param {Object} props.financialSummary - FinancialSummaryDTO
 * @param {boolean} props.loading - Loading state
 */
export const OrderGroupFinancialPanel = ({ financialSummary, loading = false }) => {
  if (loading) {
    return (
      <Card style={{ padding: '24px' }}>
        <p>Loading financial data...</p>
      </Card>
    );
  }

  if (!financialSummary) {
    return (
      <Card style={{ padding: '24px' }}>
        <p>No financial data available for this order group.</p>
      </Card>
    );
  }

  const isProfit = financialSummary.netProfit && financialSummary.netProfit >= 0;
  const profitColor = isProfit ? '#28a745' : '#dc3545';

  return (
    <Card style={{ padding: '24px', marginBottom: '24px' }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px', fontWeight: '600' }}>
        Financial Summary: {financialSummary.productName}
      </h3>
      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
        Order Group #{financialSummary.orderGroupId} | Quantity: {financialSummary.totalQuantity} units
        {financialSummary.cityName && (
          <span style={{ marginLeft: '15px', padding: '4px 8px', backgroundColor: '#e0f2fe', borderRadius: '4px' }}>
            📍 {financialSummary.cityName}
          </span>
        )}
      </div>

      {/* Revenue Section */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Revenue</h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '12px',
          marginBottom: '12px'
        }}>
          <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Deposits</div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>
              {formatCurrency(financialSummary.totalDeposits || 0)}
            </div>
          </div>
          <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Remaining</div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>
              {formatCurrency(financialSummary.totalRemaining || 0)}
            </div>
          </div>
          <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Logistics</div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>
              {formatCurrency(financialSummary.totalLogistics || 0)}
            </div>
          </div>
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#d4edda', 
            borderRadius: '6px',
            border: '2px solid #28a745'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total Revenue</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#28a745' }}>
              {formatCurrency(financialSummary.totalRevenue || 0)}
            </div>
          </div>
        </div>
        {financialSummary.revenueFormula && (
          <CalculationBreakdown
            title="Revenue Calculation"
            formula={financialSummary.revenueFormula}
            breakdown={financialSummary.revenueBreakdown}
          />
        )}
      </div>

      {/* Costs Section */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Costs</h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '12px',
          marginBottom: '12px'
        }}>
          <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Seller Payment</div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>
              {formatCurrency(financialSummary.sellerPayment || 0)}
            </div>
          </div>
          <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Delivery Costs</div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>
              {formatCurrency(financialSummary.totalDeliveryCosts || 0)}
            </div>
          </div>
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#f8d7da', 
            borderRadius: '6px',
            border: '2px solid #dc3545'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total Costs</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#dc3545' }}>
              {formatCurrency(financialSummary.totalCosts || 0)}
            </div>
          </div>
        </div>
        {financialSummary.costFormula && (
          <CalculationBreakdown
            title="Cost Calculation"
            formula={financialSummary.costFormula}
          />
        )}
      </div>

      {/* Refunds Section */}
      {financialSummary.totalRefunds && financialSummary.totalRefunds > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Refunds</h4>
          <div style={{ padding: '12px', backgroundColor: '#fff3cd', borderRadius: '6px' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Total Refunds Issued</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#856404' }}>
              {formatCurrency(financialSummary.totalRefunds)}
            </div>
          </div>
          {financialSummary.refundBreakdown && financialSummary.refundBreakdown.length > 0 && (
            <CalculationBreakdown
              title="Refund Breakdown"
              breakdown={financialSummary.refundBreakdown}
            />
          )}
        </div>
      )}

      {/* Profit Section */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Profit/Loss</h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '12px',
          marginBottom: '12px'
        }}>
          <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Gross Profit</div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>
              {formatCurrency(financialSummary.grossProfit || 0)}
            </div>
          </div>
          <div style={{ 
            padding: '12px', 
            backgroundColor: isProfit ? '#d4edda' : '#f8d7da', 
            borderRadius: '6px',
            border: `2px solid ${profitColor}`
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Net Profit</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: profitColor }}>
              {formatCurrency(financialSummary.netProfit || 0)}
            </div>
          </div>
          <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Profit Margin</div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>
              {financialSummary.profitMargin ? `${financialSummary.profitMargin}%` : '0%'}
            </div>
          </div>
        </div>
        {financialSummary.profitFormula && (
          <CalculationBreakdown
            title="Profit Calculation"
            formula={financialSummary.profitFormula}
          />
        )}
      </div>

      {/* Statistics */}
      <div style={{ 
        padding: '12px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '6px',
        fontSize: '13px'
      }}>
        <div style={{ fontWeight: '600', marginBottom: '8px' }}>Transaction Statistics:</div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span><strong>Payments:</strong> {financialSummary.paymentCount || 0}</span>
          <span><strong>Refunds:</strong> {financialSummary.refundCount || 0}</span>
        </div>
      </div>
    </Card>
  );
};

export default OrderGroupFinancialPanel;
