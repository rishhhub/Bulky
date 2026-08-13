import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService, warehouseService } from '@shared/services';
import { Button, Card, LoadingSpinner } from '@shared/components/ui';
import { useToast } from '@shared/context';
import { 
  OrderOverview, 
  OrderItemsView, 
  WarehouseGroupsView, 
  CityGroupsView, 
  TransactionsView, 
  SellerOrderView, 
  InventoryView 
} from '../components/views';
import { OrderGroupFinancialPanel } from '@shared/components/features';
import { financialService } from '@shared/services';
import { getErrorMessage } from '@shared/utils';

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [orderDetail, setOrderDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [sellerOrder, setSellerOrder] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [loadingFinancial, setLoadingFinancial] = useState(false);
  const [showPlaceOrderForm, setShowPlaceOrderForm] = useState(false);
  const [showTrackingForm, setShowTrackingForm] = useState(false);
  const [placeOrderForm, setPlaceOrderForm] = useState({
    sellerOrderNumber: '',
    sellerTransactionId: '',
    orderAmount: '',
    deliveryWarehouseId: '',
    notes: ''
  });
  const [trackingForm, setTrackingForm] = useState({
    trackingId: '',
    status: 'SHIPPED',
    notes: ''
  });

  const loadOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrderGroupDetails(parseInt(id));
      setOrderDetail(data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load order details'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadSellerOrder = useCallback(async () => {
    try {
      const data = await orderService.getSellerOrdersByOrderGroup(parseInt(id));
      setSellerOrder(data);
    } catch (err) {
      setSellerOrder(null);
    }
  }, [id]);

  const loadWarehouses = useCallback(async () => {
    try {
      const data = await warehouseService.getAll();
      setWarehouses((data || []).filter(w => w.active));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load warehouses'));
    }
  }, []);

  const loadFinancialSummary = useCallback(async () => {
    try {
      setLoadingFinancial(true);
      const data = await financialService.getOrderGroupFinancials(parseInt(id));
      setFinancialSummary(data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load financial summary'));
    } finally {
      setLoadingFinancial(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrderDetails();
    loadSellerOrder();
    loadWarehouses();
    loadFinancialSummary();
  }, [id, loadOrderDetails, loadSellerOrder, loadWarehouses, loadFinancialSummary]);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    try {
      await orderService.placeOrderWithSeller(parseInt(id), {
        sellerOrderNumber: placeOrderForm.sellerOrderNumber,
        sellerTransactionId: placeOrderForm.sellerTransactionId,
        orderAmount: parseFloat(placeOrderForm.orderAmount),
        deliveryWarehouseId: placeOrderForm.deliveryWarehouseId ? parseInt(placeOrderForm.deliveryWarehouseId) : null,
        notes: placeOrderForm.notes
      });
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await loadSellerOrder();
      await loadFinancialSummary(); // Refresh financial summary to include seller payment
      setShowPlaceOrderForm(false);
      toast.success('Order placed with seller. You can track status here and verify receipt when it arrives.');
      loadOrderDetails();
      setActiveTab('seller-order');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to place order'));
    }
  };

  const handleUpdateTracking = async (e) => {
    e.preventDefault();
    if (!sellerOrder) return;
    try {
      const response = await orderService.updateSellerOrderTracking(sellerOrder.id, {
        trackingId: trackingForm.trackingId,
        status: trackingForm.status,
        notes: trackingForm.notes
      });
      setSellerOrder(response.data);
      setShowTrackingForm(false);
      toast.success('Tracking updated successfully!');
      loadOrderDetails();
      loadFinancialSummary(); // Refresh financial summary
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update tracking'));
    }
  };

  const handleMarkArrived = async () => {
    if (!window.confirm('Verify that this order has been received at the warehouse? This will notify all buyers.')) {
      return;
    }
    try {
      await orderService.markOrderArrived(sellerOrder.id);
      toast.success('Order marked as arrived! Users have been notified.');
      loadSellerOrder();
      loadOrderDetails();
      loadFinancialSummary(); // Refresh financial summary
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to mark order as arrived'));
    }
  };

  const handleMarkPickedUp = async (interestId) => {
    if (!window.confirm('Mark this order as picked up?')) {
      return;
    }
    try {
      await orderService.markPickedUp(interestId);
      toast.success('Order marked as picked up!');
      loadOrderDetails();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to mark as picked up'));
    }
  };

  const handleMarkDelivered = async (interestId) => {
    const trackingId = window.prompt('Enter delivery tracking ID (optional):');
    try {
      await orderService.markDelivered(interestId, trackingId || null);
      toast.success('Order marked as delivered!');
      loadOrderDetails();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to mark as delivered'));
    }
  };

  const handlePlaceOrderFormChange = (updates) => {
    if (updates.show !== undefined) {
      setShowPlaceOrderForm(updates.show);
      // Auto-fill form when opening
      if (updates.show && orderDetail?.productInfo) {
        const productInfo = orderDetail.productInfo;
        const totalQuantity = Number(orderDetail.totalQuantity) || 0;
        // Amount to pay seller: totalQuantity × (costPerUnit + deliveryCostPerMinOrder / minOrderQuantity)
        let calculatedAmount = 0;
        if (productInfo.costPerUnit != null && productInfo.costPerUnit !== '' && totalQuantity > 0) {
          const minQty = productInfo.minOrderQuantity && productInfo.minOrderQuantity > 0 ? Number(productInfo.minOrderQuantity) : 1;
          const deliveryPerUnit = (parseFloat(productInfo.deliveryCostPerMinOrder) || 0) / minQty;
          calculatedAmount = totalQuantity * (parseFloat(productInfo.costPerUnit) + deliveryPerUnit);
        } else if (productInfo.amountToPaySeller != null && productInfo.amountToPaySeller !== '') {
          const apiVal = parseFloat(productInfo.amountToPaySeller);
          if (Number.isFinite(apiVal) && apiVal > 0) calculatedAmount = apiVal;
        }
        
        // Pre-select first warehouse in the city if available
        let defaultWarehouseId = '';
        if (orderDetail?.cityId) {
          const cityWarehouses = warehouses.filter(w => w.active && w.cityId === orderDetail.cityId);
          if (cityWarehouses.length > 0) {
            defaultWarehouseId = cityWarehouses[0].id.toString();
          }
        }
        // If no warehouse in city, use first available warehouse
        if (!defaultWarehouseId && warehouses.length > 0) {
          const activeWarehouses = warehouses.filter(w => w.active);
          if (activeWarehouses.length > 0) {
            defaultWarehouseId = activeWarehouses[0].id.toString();
          }
        }
        
        setPlaceOrderForm(prev => ({
          ...prev,
          orderAmount: calculatedAmount > 0 ? calculatedAmount.toFixed(2) : '',
          sellerOrderNumber: prev.sellerOrderNumber || `SO-${Date.now()}`,
          deliveryWarehouseId: prev.deliveryWarehouseId || defaultWarehouseId,
          notes: prev.notes || `Order for ${productInfo.productName} - ${totalQuantity} units`
        }));
      }
    } else {
      setPlaceOrderForm(prev => ({ ...prev, ...updates }));
    }
  };

  const handleTrackingFormChange = (updates) => {
    if (updates.show !== undefined) {
      setShowTrackingForm(updates.show);
    } else {
      setTrackingForm(prev => ({ ...prev, ...updates }));
    }
  };

  const handlePlaceOrderFormFieldChange = (field, value) => {
    setPlaceOrderForm(prev => ({ ...prev, [field]: value }));
  };

  const handleTrackingFormFieldChange = (field, value) => {
    setTrackingForm(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '50px', 
        textAlign: 'center',
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!orderDetail) {
    return (
      <div style={{ 
        padding: '50px', 
        textAlign: 'center',
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Card>
          <h2 style={{ color: '#111827' }}>Order not found</h2>
          <Button onClick={() => navigate('/admin')} variant="primary" style={{ marginTop: '16px' }}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'All Orders', icon: '📋', count: orderDetail.orderItems?.length || 0 },
    { id: 'warehouses', label: 'By Warehouse', icon: '🏭', count: orderDetail.warehouseGroups?.length || 0 },
    { id: 'cities', label: 'By City', icon: '🏙️', count: orderDetail.cityGroups?.length || 0 },
    { id: 'financial', label: 'Financial', icon: '💰', count: null },
    { id: 'transactions', label: 'Transactions', icon: '💳', count: null },
    { id: 'seller-order', label: 'Seller Order', icon: '📦', count: sellerOrder ? '✓' : null },
    { id: 'inventory', label: 'Inventory', icon: '📊', count: null }
  ];

  return (
    <div style={{ 
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: '24px',
      minHeight: 'calc(100vh - 60px)'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <Button 
          variant="secondary"
          onClick={() => navigate('/admin')}
          style={{ marginBottom: '20px' }}
        >
          ← Back to Dashboard
        </Button>
        <OrderOverview orderDetail={orderDetail} />
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '280px 1fr', 
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Sidebar */}
        <Card style={{ 
          padding: '0',
          position: 'sticky',
          top: '84px',
          maxHeight: 'calc(100vh - 108px)',
          overflowY: 'auto'
        }}>
          <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '18px', 
              fontWeight: '700',
              color: '#111827',
              marginBottom: '4px'
            }}>
              Order Details
            </h3>
            <p style={{ 
              margin: 0, 
              fontSize: '13px', 
              color: '#6b7280'
            }}>
              Order #{id}
            </p>
          </div>
          
          <nav style={{ padding: '8px' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  backgroundColor: activeTab === tab.id ? '#eff6ff' : 'transparent',
                  color: activeTab === tab.id ? '#007bff' : '#374151',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: activeTab === tab.id ? '600' : '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  marginBottom: '4px'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '18px' }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
                {tab.count !== null && (
                  <span style={{ 
                    fontSize: '13px',
                    backgroundColor: activeTab === tab.id ? '#007bff' : '#e5e7eb',
                    color: activeTab === tab.id ? 'white' : '#6b7280',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: '600'
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </Card>

        {/* Main Content */}
        <div>

          {activeTab === 'overview' && (
            <OrderItemsView
              orderItems={orderDetail.orderItems}
              sellerOrder={sellerOrder}
              onMarkPickedUp={handleMarkPickedUp}
              onMarkDelivered={handleMarkDelivered}
            />
          )}

          {activeTab === 'warehouses' && (
            <WarehouseGroupsView warehouseGroups={orderDetail.warehouseGroups} />
          )}

          {activeTab === 'cities' && (
            <CityGroupsView cityGroups={orderDetail.cityGroups} />
          )}

          {activeTab === 'financial' && (
            <OrderGroupFinancialPanel 
              financialSummary={financialSummary} 
              loading={loadingFinancial}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView orderItems={orderDetail.orderItems} orderGroupId={parseInt(id)} />
          )}

          {activeTab === 'seller-order' && (
            <SellerOrderView
              sellerOrder={sellerOrder}
              orderDetail={orderDetail}
              warehouses={warehouses}
              showPlaceOrderForm={showPlaceOrderForm}
              showTrackingForm={showTrackingForm}
              placeOrderForm={placeOrderForm}
              trackingForm={trackingForm}
              onPlaceOrder={handlePlaceOrder}
              onUpdateTracking={handleUpdateTracking}
              onMarkArrived={handleMarkArrived}
              onClosePlaceOrderForm={() => setShowPlaceOrderForm(false)}
              onCloseTrackingForm={() => setShowTrackingForm(false)}
              onPlaceOrderFormChange={handlePlaceOrderFormChange}
              onTrackingFormChange={handleTrackingFormChange}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              orderDetail={orderDetail}
              onMarkPickedUp={handleMarkPickedUp}
              onMarkDelivered={handleMarkDelivered}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;
