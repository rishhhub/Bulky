import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { Select } from '../ui/Select.jsx';
import { formatDate, formatCurrency } from '../../utils/formatters.js';
import { INTEREST_STATUS } from '../../utils/constants.js';
import { productService } from '@shared/services';
import { logger } from '../../utils/logger.js';

/**
 * Interest card component
 * @param {Object} props
 * @param {Object} props.interest - Interest object
 * @param {Function} props.onExtend - Extend interest handler
 * @param {Function} props.onWithdraw - Withdraw interest handler
 * @param {Function} props.onPayRemaining - Pay remaining balance handler
 * @param {Function} props.onPayFullAmount - Pay full amount handler
 * @param {Function} props.onViewDetails - View details handler
 * @param {React.ReactNode} props.children - Additional content (e.g., tracking display)
 */
export const InterestCard = ({
  interest,
  onExtend,
  onWithdraw,
  onPayRemaining,
  onPayFullAmount,
  onViewDetails,
  children,
  extendingId,
  newPeriodDays,
  onPeriodDaysChange
}) => {
  const [localExtendingId, setLocalExtendingId] = useState(null);
  const [localPeriodDays, setLocalPeriodDays] = useState(7);
  const [productImage, setProductImage] = useState(null);
  const [loadingImage, setLoadingImage] = useState(true);
  
  const isExtending = extendingId === interest.id || localExtendingId === interest.id;
  const periodDaysValue = newPeriodDays || localPeriodDays;
  
  useEffect(() => {
    // Fetch product image if productId is available
    if (interest.productId) {
      productService.getById(interest.productId)
        .then(product => {
          if (product.imageUrls && product.imageUrls.length > 0) {
            setProductImage(product.imageUrls[0]);
          } else if (product.imageUrl) {
            setProductImage(product.imageUrl);
          }
          setLoadingImage(false);
        })
        .catch(err => {
          logger.error('Failed to load product image:', err);
          setLoadingImage(false);
        });
    } else {
      setLoadingImage(false);
    }
  }, [interest.productId]);
  
  const getStatusColor = (status) => {
    switch (status) {
      case INTEREST_STATUS.COMPLETE:
      case INTEREST_STATUS.DIRECT_ORDER_PLACED:
        return 'success';
      case INTEREST_STATUS.THRESHOLD_MET:
      case INTEREST_STATUS.COLLECTING:
        return 'info';
      case INTEREST_STATUS.EXPIRING:
        return 'warning';
      case INTEREST_STATUS.WITHDRAWN:
      case INTEREST_STATUS.REFUNDED:
        return 'secondary';
      default:
        return 'primary';
    }
  };

  return (
    <Card style={{ 
      overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
      ':hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }
    }}>
      <div style={{ display: 'flex', gap: '20px', padding: '20px' }}>
        {/* Product Image */}
        <Link 
          to={`/products/${interest.productId}`}
          style={{ 
            textDecoration: 'none',
            flexShrink: 0,
            width: '150px',
            height: '150px',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {loadingImage ? (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#999',
              fontSize: '14px'
            }}>
              Loading...
            </div>
          ) : productImage ? (
            <img
              src={productImage}
              alt={interest.productName}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.3s'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #999; font-size: 14px;">No Image</div>';
              }}
            />
          ) : (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#999',
              fontSize: '14px',
              backgroundColor: '#f0f0f0'
            }}>
              No Image
            </div>
          )}
        </Link>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div style={{ flex: 1 }}>
              <Link 
                to={`/products/${interest.productId}`}
                style={{ 
                  textDecoration: 'none',
                  color: 'inherit'
                }}
              >
                <h3 style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#111827',
                  cursor: 'pointer',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#007bff'}
                onMouseLeave={(e) => e.target.style.color = '#111827'}
                >
                  {interest.productName}
                </h3>
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                <Badge status={interest.status} variant="solid">
                  {interest.status.replace(/_/g, ' ')}
                </Badge>
                {interest.orderNumber && (
                  <Badge variant="success" style={{ fontSize: '11px' }}>
                    Order: {interest.orderNumber}
                  </Badge>
                )}
                {interest.orderStatus && (
                  <Badge variant="info" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                    {interest.orderStatus.replace(/_/g, ' ')}
                  </Badge>
                )}
              </div>
            </div>
            {onViewDetails && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onViewDetails(interest)}
                style={{ marginLeft: '12px', flexShrink: 0 }}
              >
                👁️ View Details
              </Button>
            )}
          </div>

          {/* Details Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '12px',
            marginTop: '8px'
          }}>
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#f9fafb', 
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                QUANTITY
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                {interest.quantity} units
              </div>
            </div>
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#f9fafb', 
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                PERIOD
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                {interest.periodDays} days
              </div>
            </div>
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#f9fafb', 
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                END DATE
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                {formatDate(interest.endDate)}
              </div>
            </div>
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#f9fafb', 
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                LOGISTICS
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                {interest.logisticsPreference}
              </div>
            </div>
            {interest.depositPaid > 0 && (
              <div style={{ 
                padding: '10px', 
                backgroundColor: '#eff6ff', 
                borderRadius: '8px',
                border: '1px solid #bfdbfe',
                gridColumn: 'span 2'
              }}>
                <div style={{ fontSize: '12px', color: '#1e40af', marginBottom: '4px', fontWeight: '600' }}>
                  DEPOSIT PAID
                </div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e40af' }}>
                  {formatCurrency(interest.depositPaid)}
                </div>
              </div>
            )}
          </div>

          {/* Threshold Progress Bar (for PENDING interests) */}
          {interest.status === INTEREST_STATUS.PENDING && interest.totalQuantity !== undefined && interest.requiredQuantity !== undefined && (
            <div style={{ 
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                  Threshold Progress
                </div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                  {interest.totalQuantity} / {interest.requiredQuantity} units
                </div>
              </div>
              <div style={{
                width: '100%',
                height: '24px',
                backgroundColor: '#e5e7eb',
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  width: `${Math.min(100, (interest.thresholdProgress || 0))}%`,
                  height: '100%',
                  backgroundColor: interest.thresholdProgress >= 100 ? '#10b981' : '#3b82f6',
                  transition: 'width 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {interest.thresholdProgress >= 100 ? '✓ Threshold Met!' : `${Math.round(interest.thresholdProgress || 0)}%`}
                </div>
              </div>
            </div>
          )}

          {/* Collection Progress Bar (for THRESHOLD_MET, COLLECTING, COMPLETE interests) */}
          {(interest.status === INTEREST_STATUS.THRESHOLD_MET || 
            interest.status === INTEREST_STATUS.COLLECTING || 
            interest.status === INTEREST_STATUS.COMPLETE) && 
            interest.totalInterestsInGroup !== undefined && (
            <div style={{ 
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#f0fdf4',
              borderRadius: '8px',
              border: '1px solid #bbf7d0'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#166534' }}>
                  Collection Progress
                </div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#15803d' }}>
                  {interest.paidInterestsCount || 0} / {interest.totalInterestsInGroup} paid
                </div>
              </div>
              <div style={{
                width: '100%',
                height: '24px',
                backgroundColor: '#dcfce7',
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  width: `${Math.min(100, (interest.collectionProgress || 0))}%`,
                  height: '100%',
                  backgroundColor: interest.collectionProgress >= 100 ? '#10b981' : '#22c55e',
                  transition: 'width 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {interest.collectionProgress >= 100 ? '✓ Collection Complete!' : `${Math.round(interest.collectionProgress || 0)}%`}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status-specific actions */}
      {interest.status === INTEREST_STATUS.EXPIRING && (
        <div style={{ 
          marginTop: '15px', 
          padding: '15px 20px', 
          backgroundColor: '#fff3cd', 
          borderRadius: '0 0 8px 8px',
          borderTop: '1px solid #ffc107'
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: '10px', color: '#856404' }}>
            Your interest period has expired!
          </p>
          {isExtending ? (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Select
                value={periodDaysValue}
                onChange={(e) => {
                  const days = parseInt(e.target.value);
                  if (onPeriodDaysChange) {
                    onPeriodDaysChange(days);
                  } else {
                    setLocalPeriodDays(days);
                  }
                }}
                options={[
                  { value: 7, label: '7 days' },
                  { value: 14, label: '14 days' },
                  { value: 30, label: '30 days' }
                ]}
                style={{ minWidth: '120px' }}
              />
              <Button variant="primary" onClick={() => {
                if (onExtend) {
                  onExtend(interest.id, periodDaysValue);
                }
                setLocalExtendingId(null);
              }}>
                Confirm Extension
              </Button>
              <Button variant="secondary" onClick={() => {
                if (extendingId === null) setLocalExtendingId(null);
              }}>
                Cancel
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Button variant="primary" onClick={() => {
                if (extendingId === null) setLocalExtendingId(interest.id);
              }}>
                Extend Period
              </Button>
              {onWithdraw && (
                <Button variant="secondary" onClick={() => onWithdraw(interest.id)}>
                  Withdraw
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {interest.status === INTEREST_STATUS.DIRECT_ORDER_READY && (
        <div style={{ 
          marginTop: '15px', 
          padding: '15px 20px', 
          backgroundColor: '#d4edda', 
          borderRadius: '0 0 8px 8px',
          borderTop: '1px solid #28a745'
        }}>
          <p style={{ fontWeight: 'bold', color: '#155724', marginBottom: '10px' }}>
            Your order quantity meets the seller's minimum! You can pay the full amount and place the order directly.
          </p>
          {onPayFullAmount && (
            <Button variant="primary" onClick={() => onPayFullAmount(interest.id)}>
              Pay Full Amount & Place Order
            </Button>
          )}
        </div>
      )}

      {interest.status === INTEREST_STATUS.THRESHOLD_MET && 
       !interest.hasRemainingPaymentCompleted && (
        <div style={{ 
          marginTop: '15px', 
          padding: '15px 20px', 
          backgroundColor: '#d1ecf1', 
          borderRadius: '0 0 8px 8px',
          borderTop: '1px solid #17a2b8'
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: '10px', color: '#0c5460' }}>
            Threshold reached! Please pay remaining balance.
          </p>
          {onPayRemaining && (
            <Button variant="primary" onClick={() => onPayRemaining(interest.id)}>
              Pay Remaining Balance
            </Button>
          )}
        </div>
      )}
      
      {interest.status === INTEREST_STATUS.THRESHOLD_MET && 
       interest.hasRemainingPaymentCompleted && (
        <div style={{ 
          marginTop: '15px', 
          padding: '15px 20px', 
          backgroundColor: '#d4edda', 
          borderRadius: '0 0 8px 8px',
          borderTop: '1px solid #28a745'
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: '10px', color: '#155724' }}>
            ✓ Remaining balance paid! Waiting for other buyers to complete payment.
          </p>
        </div>
      )}

      {interest.status === INTEREST_STATUS.DIRECT_ORDER_PLACED && (
        <div style={{ 
          marginTop: '15px', 
          padding: '15px 20px', 
          backgroundColor: '#d4edda', 
          borderRadius: '0 0 8px 8px',
          borderTop: '1px solid #28a745'
        }}>
          <p style={{ fontWeight: 'bold', color: '#155724' }}>
            Your order has been placed successfully! You will receive updates on delivery/pickup.
          </p>
        </div>
      )}

      {interest.status === INTEREST_STATUS.COMPLETE && (
        <div style={{ 
          marginTop: '15px', 
          padding: '15px 20px', 
          backgroundColor: '#d4edda', 
          borderRadius: '0 0 8px 8px',
          borderTop: '1px solid #28a745'
        }}>
          <p style={{ fontWeight: 'bold', color: '#155724' }}>
            Order complete! Your order is being processed.
          </p>
        </div>
      )}

      {children}
    </Card>
  );
};

export default InterestCard;
