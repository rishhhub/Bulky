import React, { useState, useEffect } from 'react';
import { Card, Button, Modal } from '@shared/components/ui';
import { FormField, FormSelect, FormTextarea } from '@shared/components/forms';
import { formatCurrency, formatDateTime } from '@shared/utils/formatters';

/** Amount to pay seller: totalQuantity × (costPerUnit + deliveryCostPerMinOrder / minOrderQuantity) */
function getAmountToPaySeller(orderDetail) {
  if (!orderDetail?.productInfo || orderDetail?.totalQuantity == null || orderDetail.totalQuantity <= 0) return null;
  const { costPerUnit, deliveryCostPerMinOrder, minOrderQuantity, amountToPaySeller: apiAmount } = orderDetail.productInfo;
  const totalQuantity = Number(orderDetail.totalQuantity);
  // Prefer API value only when it's a positive number; otherwise calculate from product info
  const numApi = apiAmount != null && apiAmount !== '' ? parseFloat(apiAmount) : NaN;
  if (Number.isFinite(numApi) && numApi > 0) return numApi;
  if (costPerUnit == null || costPerUnit === '') return null;
  const minQty = minOrderQuantity && minOrderQuantity > 0 ? Number(minOrderQuantity) : 1;
  const deliveryPerUnit = (parseFloat(deliveryCostPerMinOrder) || 0) / minQty;
  return totalQuantity * (parseFloat(costPerUnit) + deliveryPerUnit);
}

export const SellerOrderView = ({
  sellerOrder,
  orderDetail,
  warehouses,
  showPlaceOrderForm,
  showTrackingForm,
  placeOrderForm,
  trackingForm,
  onPlaceOrder,
  onUpdateTracking,
  onMarkArrived,
  onClosePlaceOrderForm,
  onCloseTrackingForm,
  onPlaceOrderFormChange,
  onTrackingFormChange
}) => {
  const [orderAmountEditable, setOrderAmountEditable] = useState(false);

  useEffect(() => {
    if (showPlaceOrderForm) setOrderAmountEditable(false);
  }, [showPlaceOrderForm]);

  if (!sellerOrder) {
    const amountToPaySeller = getAmountToPaySeller(orderDetail);

    return (
      <div>
        {/* Seller Product Information Card */}
        {orderDetail?.productInfo && (
          <Card style={{ marginBottom: '20px', padding: '20px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#374151' }}>Seller Product Information</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '16px',
              fontSize: '15px'
            }}>
              <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>Total Units Ordered</div>
                <div style={{ fontSize: '20px', fontWeight: '600', color: '#111827' }}>
                  {orderDetail.totalQuantity || 0} units
                </div>
              </div>
              
              {orderDetail.productInfo.costPerUnit && (
              <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>Seller's Cost per Unit</div>
                <div style={{ fontSize: '20px', fontWeight: '600', color: '#111827' }}>
                  {formatCurrency(orderDetail.productInfo.costPerUnit)}
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                  Amount seller needs per unit
                </div>
              </div>
              )}
              
              {orderDetail.productInfo.deliveryCostPerMinOrder && (
              <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>Seller's Delivery Cost</div>
                <div style={{ fontSize: '20px', fontWeight: '600', color: '#111827' }}>
                  {formatCurrency(orderDetail.productInfo.deliveryCostPerMinOrder)}
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                  Delivery cost for minimum order
                </div>
              </div>
              )}
              
              {amountToPaySeller != null && (
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: '#eff6ff', 
                  borderRadius: '8px',
                  border: '2px solid #3b82f6',
                  gridColumn: 'span 2'
                }}>
                  <div style={{ color: '#1e40af', fontSize: '14px', marginBottom: '6px', fontWeight: '600' }}>
                    Total Amount to Pay Seller
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#1e40af', marginBottom: '8px' }}>
                    {formatCurrency(amountToPaySeller)}
                  </div>
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#1e40af', 
                    padding: '8px',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '4px',
                    fontFamily: 'monospace'
                  }}>
                    Calculation: {orderDetail.totalQuantity} × ({formatCurrency(orderDetail.productInfo.costPerUnit)} + {formatCurrency((parseFloat(orderDetail.productInfo.deliveryCostPerMinOrder || 0) / (orderDetail.productInfo.minOrderQuantity || 1)))} delivery/unit) = {formatCurrency(amountToPaySeller)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '8px', fontStyle: 'italic' }}>
                    This is the amount that will be paid to the seller for this order
                  </div>
                </div>
              )}
            </div>
            
            {orderDetail.productInfo.seller && (
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                backgroundColor: '#f0f9ff', 
                borderRadius: '6px',
                border: '1px solid #bae6fd'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#0369a1' }}>
                  Seller Information
                </div>
                <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                  <div><strong>Name:</strong> {orderDetail.productInfo.seller.sellerName}</div>
                  {orderDetail.productInfo.seller.sellerEmail && (
                    <div><strong>Email:</strong> {orderDetail.productInfo.seller.sellerEmail}</div>
                  )}
                  {orderDetail.productInfo.seller.sellerPhone && (
                    <div><strong>Phone:</strong> {orderDetail.productInfo.seller.sellerPhone}</div>
                  )}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Payment Summary Card */}
        {amountToPaySeller != null && orderDetail?.productInfo && (
          <Card style={{ 
            marginBottom: '20px', 
            padding: '20px',
            backgroundColor: '#fef3c7',
            border: '2px solid #f59e0b'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#92400e' }}>
              💰 Payment Summary - Amount to Pay Seller
            </h3>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '16px',
              backgroundColor: 'white',
              borderRadius: '6px',
              marginBottom: '12px'
            }}>
              <div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                  Product Cost: {formatCurrency(orderDetail.productInfo.costPerUnit)} × {orderDetail.totalQuantity} units
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  Delivery: {formatCurrency(orderDetail.productInfo.deliveryCostPerMinOrder || 0)} for min order ({orderDetail.productInfo.minOrderQuantity || 0} units), prorated for {orderDetail.totalQuantity} units
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total Amount</div>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#92400e' }}>
                  {formatCurrency(amountToPaySeller)}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '13px', color: '#92400e', fontStyle: 'italic' }}>
              ⚠️ Verify this amount before placing the order. This is what will be paid to the seller.
            </div>
          </Card>
        )}

        <Card style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', marginBottom: '16px' }}>Order not placed with seller yet.</p>
          {orderDetail?.status === 'COMPLETE' && (
            <Button 
              variant="primary"
              onClick={() => {
                if (onPlaceOrderFormChange) {
                  onPlaceOrderFormChange({ show: true });
                }
              }}
              style={{ marginTop: '15px' }}
            >
              Place Order to Original Seller
            </Button>
          )}
        </Card>

        {/* Place Order Form Modal */}
        {showPlaceOrderForm && (
          <Modal
            isOpen={showPlaceOrderForm}
            onClose={onClosePlaceOrderForm}
            title="Place Order to Original Seller"
          >
            {orderDetail?.productInfo && (
              <div style={{ 
                marginBottom: '20px', 
                padding: '15px', 
                backgroundColor: '#f0f9ff', 
                borderRadius: '8px',
                border: '1px solid #bae6fd'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#0369a1' }}>Product & Seller Information</h4>
                <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  <p style={{ margin: '4px 0' }}>
                    <strong>Product:</strong> {orderDetail.productInfo.productName}
                  </p>
                  <p style={{ margin: '4px 0' }}>
                    <strong>Total Quantity:</strong> {orderDetail.totalQuantity} units
                  </p>
                  {orderDetail.productInfo.seller && (
                    <>
                      <p style={{ margin: '4px 0' }}>
                        <strong>Seller:</strong> {orderDetail.productInfo.seller.sellerName}
                      </p>
                      {orderDetail.productInfo.seller.sellerEmail && (
                        <p style={{ margin: '4px 0' }}>
                          <strong>Email:</strong> {orderDetail.productInfo.seller.sellerEmail}
                        </p>
                      )}
                      {orderDetail.productInfo.seller.sellerPhone && (
                        <p style={{ margin: '4px 0' }}>
                          <strong>Phone:</strong> {orderDetail.productInfo.seller.sellerPhone}
                        </p>
                      )}
                    </>
                  )}
                  {orderDetail.productInfo.costPerUnit && (
                    <p style={{ margin: '4px 0' }}>
                      <strong>Cost per Unit:</strong> {formatCurrency(orderDetail.productInfo.costPerUnit)}
                    </p>
                  )}
                  {orderDetail.productInfo.deliveryCostPerMinOrder && (
                    <p style={{ margin: '4px 0' }}>
                      <strong>Delivery Cost:</strong> {formatCurrency(orderDetail.productInfo.deliveryCostPerMinOrder)}
                    </p>
                  )}
                  {amountToPaySeller != null && (
                    <p style={{ margin: '8px 0 0 0', paddingTop: '8px', borderTop: '1px solid #bae6fd', fontWeight: 'bold', color: '#0369a1' }}>
                      <strong>Amount to Pay Seller:</strong> {formatCurrency(amountToPaySeller)}
                    </p>
                  )}
                </div>
              </div>
            )}
            <form onSubmit={onPlaceOrder}>
              <FormField
                label="Product ID *"
                name="productId"
                value={orderDetail?.productId || ''}
                disabled
                required
                helperText="Product ID (read-only)"
              />
              <FormField
                label="No. of Units *"
                name="totalQuantity"
                type="number"
                value={orderDetail?.totalQuantity || ''}
                disabled
                required
                helperText="Total quantity for this order (read-only)"
              />
              <FormField
                label="Seller Order Number *"
                name="sellerOrderNumber"
                value={placeOrderForm.sellerOrderNumber || ''}
                onChange={(e) => onPlaceOrderFormChange && onPlaceOrderFormChange({ sellerOrderNumber: e.target.value })}
                required
                placeholder="e.g., SO-12345"
              />
              <FormField
                label="Seller Transaction ID"
                name="sellerTransactionId"
                value={placeOrderForm.sellerTransactionId || ''}
                onChange={(e) => onPlaceOrderFormChange && onPlaceOrderFormChange({ sellerTransactionId: e.target.value })}
                placeholder="Optional transaction ID from seller"
              />
              {orderAmountEditable ? (
                <FormField
                  label="Order Amount (Amount being paid to seller) *"
                  name="orderAmount"
                  type="number"
                  step="0.01"
                  value={placeOrderForm.orderAmount || ''}
                  onChange={(e) => onPlaceOrderFormChange && onPlaceOrderFormChange({ orderAmount: e.target.value })}
                  required
                  min="0.01"
                  placeholder="0.00"
                  helperText="Editing the calculated amount. Click to lock and use calculated value again."
                />
              ) : (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>
                    Order Amount (Amount being paid to seller) *
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', backgroundColor: '#f3f4f6', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                      {formatCurrency(placeOrderForm.orderAmount || amountToPaySeller)}
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setOrderAmountEditable(true)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              )}
              <FormSelect
                label="Delivery Warehouse *"
                name="deliveryWarehouseId"
                value={placeOrderForm.deliveryWarehouseId || ''}
                onChange={(e) => onPlaceOrderFormChange && onPlaceOrderFormChange({ deliveryWarehouseId: e.target.value })}
                options={(() => {
                  // Filter warehouses by city if cityId is available
                  let filteredWarehouses = warehouses;
                  if (orderDetail?.cityId) {
                    filteredWarehouses = warehouses.filter(w => w.cityId === orderDetail.cityId);
                  }
                  // If no warehouses found for the city, show all warehouses with a note
                  if (filteredWarehouses.length === 0 && warehouses.length > 0) {
                    filteredWarehouses = warehouses;
                  }
                  return filteredWarehouses.map(w => ({ 
                    value: w.id.toString(), 
                    label: `${w.name} - ${w.city}, ${w.state}` 
                  }));
                })()}
                placeholder={orderDetail?.cityId ? `Select Warehouse in ${orderDetail.cityName || 'this city'}` : "Select Warehouse"}
                required
                helperText={orderDetail?.cityId ? `Showing warehouses in ${orderDetail.cityName || 'the order group city'}` : 'Select delivery warehouse'}
              />
              <FormTextarea
                label="Notes"
                name="notes"
                value={placeOrderForm.notes || ''}
                onChange={(e) => onPlaceOrderFormChange && onPlaceOrderFormChange({ notes: e.target.value })}
                placeholder="Additional notes about this order"
                rows={3}
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <Button type="submit" variant="primary">Place Order</Button>
                <Button type="button" variant="secondary" onClick={onClosePlaceOrderForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Seller Order Information</h2>
        <Button 
          variant="primary"
          onClick={() => {
            if (onTrackingFormChange) {
              onTrackingFormChange({ show: true });
            }
          }}
        >
          Update Tracking
        </Button>
      </div>
      
      <Card style={{ marginBottom: '20px' }}>
        <h3>Order Details</h3>
        <p><strong>Seller Order Number:</strong> {sellerOrder.sellerOrderNumber}</p>
        <p><strong>Seller Transaction ID:</strong> {sellerOrder.sellerTransactionId || 'N/A'}</p>
        <p><strong>Order Amount (paid to seller):</strong> {formatCurrency(sellerOrder.orderAmount)}</p>
        {orderDetail && getAmountToPaySeller(orderDetail) != null && (
          <p style={{ fontSize: '13px', color: '#6b7280' }}>
            <strong>Expected from product cost:</strong> {formatCurrency(getAmountToPaySeller(orderDetail))}
          </p>
        )}
        <p><strong>Status:</strong> 
          <span style={{ 
            color: sellerOrder.status === 'COMPLETED' ? 'green' : 
                   sellerOrder.status === 'ARRIVED' ? 'blue' : 'orange',
            fontWeight: 'bold',
            marginLeft: '10px'
          }}>
            {sellerOrder.status}
          </span>
        </p>
        {sellerOrder.deliveryWarehouse && (
          <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <p><strong>Delivery Warehouse:</strong> {sellerOrder.deliveryWarehouse.name}</p>
            <p>{sellerOrder.deliveryWarehouse.address}, {sellerOrder.deliveryWarehouse.city}, {sellerOrder.deliveryWarehouse.state}</p>
            <p>Phone: {sellerOrder.deliveryWarehouse.phone} | Hours: {sellerOrder.deliveryWarehouse.hoursOfOperation}</p>
          </div>
        )}
        {sellerOrder.trackingId && (
          <p style={{ marginTop: '10px' }}><strong>Tracking ID:</strong> {sellerOrder.trackingId}</p>
        )}
        {sellerOrder.placedAt && (
          <p><strong>Placed At:</strong> {formatDateTime(sellerOrder.placedAt)}</p>
        )}
        {sellerOrder.shippedAt && (
          <p><strong>Shipped At:</strong> {formatDateTime(sellerOrder.shippedAt)}</p>
        )}
        {sellerOrder.estimatedArrival && (
          <p><strong>Estimated Arrival:</strong> {formatDateTime(sellerOrder.estimatedArrival)}</p>
        )}
        {sellerOrder.arrivedAt && (
          <p><strong>Arrived At:</strong> {formatDateTime(sellerOrder.arrivedAt)}</p>
        )}
        {sellerOrder.notes && (
          <p><strong>Notes:</strong> {sellerOrder.notes}</p>
        )}
        {(sellerOrder.status === 'SHIPPED' || sellerOrder.status === 'IN_TRANSIT') && (
          <div style={{ marginTop: '15px' }}>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
              Confirm that the order has been received at the warehouse. This will notify users.
            </p>
            <Button 
              variant="success"
              onClick={onMarkArrived}
            >
              Verify received at warehouse
            </Button>
          </div>
        )}
        {sellerOrder.status === 'ARRIVED' && (
          <p style={{ marginTop: '10px', color: 'green', fontWeight: 600 }}>
            ✓ Received at warehouse (verified {sellerOrder.arrivedAt && formatDateTime(sellerOrder.arrivedAt)})
          </p>
        )}
      </Card>

      {/* Update Tracking Form Modal */}
      {showTrackingForm && (
        <Modal
          isOpen={showTrackingForm}
          onClose={onCloseTrackingForm}
          title="Update Tracking"
        >
          <form onSubmit={onUpdateTracking}>
            <FormField
              label="Tracking ID"
              name="trackingId"
              value={trackingForm.trackingId || ''}
              onChange={(e) => onTrackingFormChange && onTrackingFormChange({ trackingId: e.target.value })}
              placeholder={sellerOrder?.trackingId || 'Enter tracking ID'}
            />
            <FormSelect
              label="Status *"
              name="status"
              value={trackingForm.status || 'SHIPPED'}
              onChange={(e) => onTrackingFormChange && onTrackingFormChange({ status: e.target.value })}
              options={[
                { value: 'SHIPPED', label: 'Shipped' },
                { value: 'IN_TRANSIT', label: 'In Transit' },
                { value: 'ARRIVED', label: 'Arrived at Warehouse' }
              ]}
              required
            />
            <FormTextarea
              label="Notes"
              name="notes"
              value={trackingForm.notes || ''}
              onChange={(e) => onTrackingFormChange && onTrackingFormChange({ notes: e.target.value })}
              rows={3}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <Button type="submit" variant="primary">Update</Button>
              <Button type="button" variant="secondary" onClick={onCloseTrackingForm}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default SellerOrderView;
