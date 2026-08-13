import React, { useState, useEffect } from 'react';
import { Modal, Button, LoadingSpinner } from '../ui';
import { FormField, FormSelect } from '../forms';
import { orderService, warehouseService, profileService, paymentService } from '@shared/services';
import { formatCurrency, formatDate } from '@shared/utils/formatters';
import { logger } from '@shared/utils';

export const InterestDetailModal = ({ isOpen, onClose, interest, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  
  // Form state
  const [quantity, setQuantity] = useState(interest?.quantity || 1);
  const [periodDays, setPeriodDays] = useState(interest?.periodDays || 7);
  const [logisticsPreference, setLogisticsPreference] = useState(interest?.logisticsPreference || 'DELIVERY');
  const [deliveryAddress, setDeliveryAddress] = useState(interest?.deliveryAddress || '');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [warehouseId, setWarehouseId] = useState(interest?.warehouseId?.toString() || '');
  const [deliveryCost, setDeliveryCost] = useState(interest?.deliveryCost || 0);

  useEffect(() => {
    if (isOpen && interest) {
      // Reset form to interest values
      setQuantity(interest.quantity || 1);
      setPeriodDays(interest.periodDays || 7);
      setLogisticsPreference(interest.logisticsPreference || 'DELIVERY');
      setDeliveryAddress(interest.deliveryAddress || '');
      setWarehouseId(interest.warehouseId?.toString() || '');
      setDeliveryCost(interest.deliveryCost || 0);
      setIsEditing(false);
      setError('');
      
      // Load warehouses and addresses when modal opens
      const loadData = async () => {
        setLoadingData(true);
        try {
          await Promise.all([loadWarehouses(), loadAddresses()]);
        } finally {
          setLoadingData(false);
        }
      };
      loadData();
    }
  }, [isOpen, interest]);

  useEffect(() => {
    if (logisticsPreference === 'DELIVERY' && deliveryAddress && quantity) {
      calculateDeliveryCost();
    } else if (logisticsPreference === 'PICKUP') {
      setDeliveryCost(0);
    }
  }, [logisticsPreference, deliveryAddress, quantity]);

  const loadWarehouses = async () => {
    try {
      const data = await warehouseService.getAllActive();
      setWarehouses(data || []);
    } catch (err) {
      logger.error('Failed to load warehouses:', err);
      setWarehouses([]);
    }
  };

  const loadAddresses = async () => {
    try {
      const data = await profileService.getAddresses();
      setAddresses(data || []);
      
      // If we have an existing delivery address from interest, try to match it
      if (interest?.deliveryAddress && data.length > 0) {
        // Try to find matching address
        const matchingAddress = data.find(addr => {
          const addrString = formatAddressString(addr);
          return addrString === interest.deliveryAddress;
        });
        
        if (matchingAddress) {
          setSelectedAddressId(matchingAddress.id.toString());
          setDeliveryAddress(formatAddressString(matchingAddress));
        } else {
          // If no match, pre-select default or first address
          const defaultAddress = data.find(addr => addr.isDefault);
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id.toString());
            setDeliveryAddress(formatAddressString(defaultAddress));
          } else {
            setSelectedAddressId(data[0].id.toString());
            setDeliveryAddress(formatAddressString(data[0]));
          }
        }
      } else if (data.length > 0) {
        // Pre-select default address or first address
        const defaultAddress = data.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id.toString());
          setDeliveryAddress(formatAddressString(defaultAddress));
        } else {
          setSelectedAddressId(data[0].id.toString());
          setDeliveryAddress(formatAddressString(data[0]));
        }
      } else {
        // No saved addresses - keep the existing delivery address if any
        if (interest?.deliveryAddress) {
          setDeliveryAddress(interest.deliveryAddress);
        }
      }
    } catch (err) {
      logger.error('Failed to load addresses:', err);
      setAddresses([]);
      // Keep existing address if available
      if (interest?.deliveryAddress) {
        setDeliveryAddress(interest.deliveryAddress);
      }
    }
  };

  const formatAddressString = (address) => {
    const parts = [
      address.street,
      address.city,
      address.state,
      address.postalCode,
      address.country
    ].filter(Boolean);
    return parts.join(', ');
  };

  const calculateDeliveryCost = async () => {
    if (!interest?.productId || !deliveryAddress) return;
    
    try {
      const response = await warehouseService.calculateDeliveryCost({
        productId: interest.productId,
        quantity: quantity,
        deliveryAddress: deliveryAddress,
      });
      setDeliveryCost(response.deliveryCost || 0);
    } catch (err) {
      logger.error('Failed to calculate delivery cost:', err);
      setDeliveryCost(0);
    }
  };

  const handleAddressChange = (addressId) => {
    setSelectedAddressId(addressId);
    const selectedAddress = addresses.find(addr => addr.id.toString() === addressId);
    if (selectedAddress) {
      setDeliveryAddress(formatAddressString(selectedAddress));
    }
  };

  const handleSave = async () => {
    setError('');
    setLoading(true);

    try {
      // Validate
      if (logisticsPreference === 'DELIVERY') {
        if (addresses.length === 0) {
          setError('Please add an address in your profile before saving');
          setLoading(false);
          return;
        }
        if (!selectedAddressId || !deliveryAddress.trim()) {
          setError('Please select a delivery address');
          setLoading(false);
          return;
        }
      }

      if (logisticsPreference === 'PICKUP' && !warehouseId) {
        setError('Warehouse selection is required for pickup');
        setLoading(false);
        return;
      }

      const updateData = {
        quantity,
        periodDays,
        logisticsPreference,
        ...(logisticsPreference === 'DELIVERY' ? { deliveryAddress } : {}),
        ...(logisticsPreference === 'PICKUP' ? { warehouseId: parseInt(warehouseId) } : {})
      };

      const response = await orderService.updateInterest(interest.id, updateData);
      
      // Check if additional payment is required
      if (response.requiresPayment && response.additionalDepositRequired > 0) {
        setPaymentInfo({
          amount: response.additionalDepositRequired,
          message: response.message,
          interestId: interest.id
        });
        setShowPaymentPrompt(true);
        // Don't close modal yet - wait for payment
        return;
      }
      
      // If refund was processed, show success message
      if (response.requiresRefund && response.refundAmount > 0) {
        alert(response.message || `Refund of ₹${response.refundAmount.toFixed(2)} has been processed.`);
      }
      
      if (onUpdate) {
        onUpdate();
      }
      
      setIsEditing(false);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update interest');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setQuantity(interest?.quantity || 1);
    setPeriodDays(interest?.periodDays || 7);
    setLogisticsPreference(interest?.logisticsPreference || 'DELIVERY');
    setDeliveryAddress(interest?.deliveryAddress || '');
    setWarehouseId(interest?.warehouseId?.toString() || '');
    setDeliveryCost(interest?.deliveryCost || 0);
    setError('');
    setIsEditing(false);
  };

  if (!interest) return null;

  const canEdit = interest.status === 'PENDING' || 
                  interest.status === 'EXPIRING' || 
                  interest.status === 'EXPIRED';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Interest' : 'Interest Details'}
    >
      <div style={{ padding: '20px' }}>
        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            color: '#c33',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {!isEditing ? (
          // View Mode
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
                {interest.productName}
              </h3>
              <div style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: '#e3f2fd',
                color: '#1976d2'
              }}>
                {interest.status.replace(/_/g, ' ')}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <strong style={{ color: '#6b7280', fontSize: '14px' }}>Quantity</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '16px' }}>{interest.quantity} units</p>
              </div>
              <div>
                <strong style={{ color: '#6b7280', fontSize: '14px' }}>Period</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '16px' }}>{interest.periodDays} days</p>
              </div>
              <div>
                <strong style={{ color: '#6b7280', fontSize: '14px' }}>Start Date</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '16px' }}>{formatDate(interest.startDate)}</p>
              </div>
              <div>
                <strong style={{ color: '#6b7280', fontSize: '14px' }}>End Date</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '16px' }}>{formatDate(interest.endDate)}</p>
              </div>
              <div>
                <strong style={{ color: '#6b7280', fontSize: '14px' }}>Logistics</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '16px' }}>{interest.logisticsPreference}</p>
              </div>
              {interest.depositPaid > 0 && (
                <div>
                  <strong style={{ color: '#6b7280', fontSize: '14px' }}>Deposit Paid</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '16px' }}>{formatCurrency(interest.depositPaid)}</p>
                </div>
              )}
            </div>

            {interest.logisticsPreference === 'DELIVERY' && interest.deliveryAddress && (
              <div style={{ marginBottom: '20px' }}>
                <strong style={{ color: '#6b7280', fontSize: '14px' }}>Delivery Address</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '16px' }}>{interest.deliveryAddress}</p>
              </div>
            )}

            {interest.logisticsPreference === 'PICKUP' && interest.warehouseName && (
              <div style={{ marginBottom: '20px' }}>
                <strong style={{ color: '#6b7280', fontSize: '14px' }}>Pickup Warehouse</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '16px' }}>{interest.warehouseName}</p>
              </div>
            )}

            {interest.deliveryCost > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <strong style={{ color: '#6b7280', fontSize: '14px' }}>Delivery Cost</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '16px' }}>{formatCurrency(interest.deliveryCost)}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
              {canEdit && (
                <Button variant="primary" onClick={() => setIsEditing(true)}>
                  ✏️ Edit
                </Button>
              )}
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          // Edit Mode
          <div>
            <FormField
              label="Quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              min={1}
              required
            />

            <FormField
              label="Period (Days)"
              type="number"
              value={periodDays}
              onChange={(e) => setPeriodDays(parseInt(e.target.value) || 7)}
              min={7}
              required
            />

            <FormSelect
              label="Logistics Preference"
              value={logisticsPreference}
              onChange={(e) => setLogisticsPreference(e.target.value)}
              options={[
                { value: 'DELIVERY', label: 'Delivery' },
                { value: 'PICKUP', label: 'Pickup' }
              ]}
              required
            />

            {logisticsPreference === 'DELIVERY' && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                  Delivery Address
                </label>
                {loadingData ? (
                  <p style={{ padding: '12px', fontSize: '14px', color: '#6b7280', fontStyle: 'italic' }}>
                    Loading saved addresses...
                  </p>
                ) : addresses.length > 0 ? (
                  <>
                    <FormSelect
                      value={selectedAddressId}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      options={addresses.map(addr => ({
                        value: addr.id.toString(),
                        label: formatAddressString(addr)
                      }))}
                      required
                    />
                    {selectedAddressId && (
                      <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f9fafb', borderRadius: '4px', fontSize: '14px', color: '#6b7280' }}>
                        Selected: {deliveryAddress}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: '#fff3cd', 
                    border: '1px solid #ffc107', 
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#856404', fontWeight: '600' }}>
                      No saved addresses found
                    </p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#856404' }}>
                      Please add an address in your profile before editing this interest.
                    </p>
                  </div>
                )}
                {deliveryCost > 0 && (
                  <p style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>
                    Estimated delivery cost: {formatCurrency(deliveryCost)}
                  </p>
                )}
              </div>
            )}

            {logisticsPreference === 'PICKUP' && (
              <div>
                <FormSelect
                  label="Pickup Warehouse"
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  options={warehouses.length > 0 ? warehouses.map(wh => ({
                    value: wh.id.toString(),
                    label: `${wh.name} - ${wh.city}, ${wh.state}`
                  })) : [{ value: '', label: 'Loading warehouses...' }]}
                  required
                />
                {warehouses.length === 0 && (
                  <p style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280', fontStyle: 'italic' }}>
                    Loading warehouses...
                  </p>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <Button variant="secondary" onClick={handleCancel} disabled={loading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={loading}>
                {loading ? <LoadingSpinner /> : '💾 Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Prompt Modal */}
      {showPaymentPrompt && paymentInfo && (
        <Modal
          isOpen={showPaymentPrompt}
          onClose={() => {
            setShowPaymentPrompt(false);
            setPaymentInfo(null);
            setIsEditing(false);
            onClose();
          }}
          title="Additional Payment Required"
        >
          <div style={{ padding: '20px' }}>
            <p style={{ marginBottom: '20px', fontSize: '16px', color: '#374151' }}>
              {paymentInfo.message}
            </p>
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#eff6ff', 
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', color: '#1e40af', marginBottom: '4px', fontWeight: '600' }}>
                ADDITIONAL DEPOSIT REQUIRED
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e40af' }}>
                {formatCurrency(paymentInfo.amount)}
              </div>
            </div>
            {error && (
              <div style={{
                padding: '12px',
                backgroundColor: '#fee',
                border: '1px solid #fcc',
                borderRadius: '8px',
                color: '#c33',
                marginBottom: '20px'
              }}>
                {error}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowPaymentPrompt(false);
                  setPaymentInfo(null);
                  setIsEditing(false);
                  onClose();
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={async () => {
                  try {
                    setLoading(true);
                    setError('');
                    await paymentService.processAdditionalDepositPayment(
                      paymentInfo.interestId,
                      paymentInfo.amount
                    );
                    alert('Payment successful!');
                    setShowPaymentPrompt(false);
                    setPaymentInfo(null);
                    if (onUpdate) {
                      onUpdate();
                    }
                    setIsEditing(false);
                    onClose();
                  } catch (err) {
                    setError(err.response?.data?.message || err.message || 'Payment failed');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                {loading ? <LoadingSpinner /> : '💳 Pay Now'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
};

export default InterestDetailModal;
