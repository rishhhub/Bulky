import React, { useState, useCallback, useEffect } from 'react';
import { Modal } from '@shared/components/ui';
import { FormField, FormCheckbox, PincodeInput } from '@shared/components/forms';
import { Button } from '@shared/components/ui';
import { useToast } from '@shared/context';
import { warehouseService, pincodeService } from '@shared/services';
import { getErrorMessage } from '@shared/utils';

export const WarehouseForm = ({ isOpen, onClose, warehouse, onSave }) => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    street: '',
    pincode: '',
    city: '',
    state: '',
    cityId: null,
    stateId: null,
    phone: '',
    hoursOfOperation: '',
    active: true,
  });
  const [pincodeInfo, setPincodeInfo] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Memoize the pincode lookup callback to prevent unnecessary re-renders
  const handlePincodeLookup = useCallback(async (pincodeValue) => {
    try {
      const info = await pincodeService.lookup(pincodeValue);
      if (info) {
        setPincodeInfo(info);
        setFormData(prev => ({
          ...prev,
          city: info.cityName || prev.city,
          state: info.stateName || prev.state,
          cityId: info.cityId || null,
          stateId: info.stateId || null
        }));
        return info;
      }
      return null;
    } catch (err) {
      setPincodeInfo(null);
      throw err;
    }
  }, []);

  // Initialize form data when warehouse changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const initialData = {
        name: warehouse?.name || '',
        street: warehouse?.street || warehouse?.address || '',
        pincode: warehouse?.pincode || warehouse?.zipCode || '',
        city: warehouse?.city || '',
        state: warehouse?.state || '',
        cityId: warehouse?.cityId || null,
        stateId: warehouse?.stateId || null,
        phone: warehouse?.phone || '',
        hoursOfOperation: warehouse?.hoursOfOperation || '',
        active: warehouse?.active !== undefined ? warehouse.active : true,
      };
      setFormData(initialData);
      setErrors({});
      setPincodeInfo(null);
      
      // If warehouse has a pincode, trigger lookup to populate city/state
      if (initialData.pincode && initialData.pincode.length === 6) {
        handlePincodeLookup(initialData.pincode).catch(() => {
          // Silently fail if lookup fails on load
        });
      }
    }
  }, [isOpen, warehouse?.id, handlePincodeLookup]);

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
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Warehouse name is required';
    }
    if (!formData.street || !formData.street.trim()) {
      newErrors.street = 'Street address is required';
    }
    if (!formData.pincode || formData.pincode.length !== 6) {
      newErrors.pincode = 'Valid 6-digit pincode is required';
    } else if (!pincodeInfo || !pincodeInfo.serviceable) {
      newErrors.pincode = 'Pincode must be serviceable';
    } else if (!formData.cityId || !formData.stateId) {
      newErrors.pincode = 'City and state information is required. Please wait for pincode lookup to complete.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const warehouseData = {
        name: formData.name.trim(),
        street: formData.street.trim(),
        pincode: formData.pincode.trim(),
        cityId: formData.cityId, // Required for location-based grouping
        stateId: formData.stateId, // Required for location-based grouping
        // city and state are fetched from pincode lookup for display only
        city: formData.city.trim(),
        state: formData.state.trim(),
        phone: formData.phone?.trim() || null,
        hoursOfOperation: formData.hoursOfOperation?.trim() || null,
        active: formData.active !== undefined ? formData.active : true,
      };

      if (warehouse) {
        await warehouseService.update(warehouse.id, warehouseData);
      } else {
        await warehouseService.create(warehouseData);
      }
      
      onSave();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save warehouse'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={warehouse ? 'Edit Warehouse' : 'Create Warehouse'}
    >
      <form onSubmit={handleSubmit}>
        <FormField
          label="Warehouse Name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
          error={errors.name}
        />
        <FormField
          label="Street Address"
          value={formData.street}
          onChange={(e) => handleChange('street', e.target.value)}
          required
          error={errors.street}
          placeholder="Building name, street, area"
        />
        <PincodeInput
          value={formData.pincode}
          onChange={(value) => {
            handleChange('pincode', value);
            // Clear pincode info when pincode changes
            if (value.length < 6) {
              setPincodeInfo(null);
              setFormData(prev => ({
                ...prev,
                cityId: null,
                stateId: null
              }));
            }
          }}
          onPincodeLookup={handlePincodeLookup}
          required={true}
          error={errors.pincode}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <FormField
            label="City (Auto-filled from pincode)"
            value={formData.city}
            readOnly
            disabled
          />
          <FormField
            label="State/Province (Auto-filled from pincode)"
            value={formData.state}
            readOnly
            disabled
          />
        </div>
        <FormField
          label="Country"
          value="India"
          readOnly
          disabled
          style={{ backgroundColor: '#f5f5f5' }}
        />
        <FormField
          label="Phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
        />
        <FormField
          label="Hours of Operation"
          value={formData.hoursOfOperation}
          onChange={(e) => handleChange('hoursOfOperation', e.target.value)}
          placeholder="e.g., Mon-Fri 9AM-5PM"
        />
        <FormCheckbox
          label="Active"
          checked={formData.active}
          onChange={(e) => handleChange('active', e.target.checked)}
        />
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving...' : (warehouse ? 'Update' : 'Create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default WarehouseForm;
