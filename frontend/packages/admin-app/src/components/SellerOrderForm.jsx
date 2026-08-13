import React, { useState } from 'react';
import { Modal } from '@shared/components/ui';
import { FormField, FormSelect, FormTextarea } from '@shared/components/forms';
import { Button } from '@shared/components/ui';
import { useToast } from '@shared/context';
import { orderService } from '@shared/services';
import { getErrorMessage } from '@shared/utils';

export const SellerOrderForm = ({ isOpen, onClose, orderGroupId, warehouses, onSave }) => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    sellerOrderNumber: '',
    trackingId: '',
    sellerTransactionId: '',
    orderAmount: '',
    deliveryWarehouseId: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.sellerOrderNumber || !formData.sellerOrderNumber.trim()) {
      newErrors.sellerOrderNumber = 'Seller order number is required';
    }
    if (!formData.deliveryWarehouseId) {
      newErrors.deliveryWarehouseId = 'Delivery warehouse is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const orderData = {
        sellerOrderNumber: formData.sellerOrderNumber.trim(),
        trackingId: formData.trackingId?.trim() || null,
        sellerTransactionId: formData.sellerTransactionId?.trim() || null,
        orderAmount: formData.orderAmount ? parseFloat(formData.orderAmount) : null,
        deliveryWarehouseId: parseInt(formData.deliveryWarehouseId),
        notes: formData.notes?.trim() || null,
      };

      await orderService.placeOrderWithSeller(orderGroupId, orderData);
      
      onSave();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to place order'));
    } finally {
      setSaving(false);
    }
  };

  const warehouseOptions = warehouses
    .filter(w => w.active)
    .map(w => ({
      value: w.id.toString(),
      label: `${w.name} - ${w.city}, ${w.state}`
    }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Place Order with Seller"
    >
      <form onSubmit={handleSubmit}>
        <FormField
          label="Seller Order Number"
          value={formData.sellerOrderNumber}
          onChange={(e) => handleChange('sellerOrderNumber', e.target.value)}
          required
          error={errors.sellerOrderNumber}
        />
        <FormField
          label="Tracking ID"
          value={formData.trackingId}
          onChange={(e) => handleChange('trackingId', e.target.value)}
        />
        <FormField
          label="Seller Transaction ID"
          value={formData.sellerTransactionId}
          onChange={(e) => handleChange('sellerTransactionId', e.target.value)}
        />
        <FormField
          label="Order Amount"
          type="number"
          step="0.01"
          value={formData.orderAmount}
          onChange={(e) => handleChange('orderAmount', e.target.value)}
        />
        <FormSelect
          label="Delivery Warehouse"
          value={formData.deliveryWarehouseId}
          onChange={(e) => handleChange('deliveryWarehouseId', e.target.value)}
          options={[{ value: '', label: 'Select Warehouse' }, ...warehouseOptions]}
          required
          error={errors.deliveryWarehouseId}
        />
        <FormTextarea
          label="Notes"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={3}
        />
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Placing Order...' : 'Place Order'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SellerOrderForm;
