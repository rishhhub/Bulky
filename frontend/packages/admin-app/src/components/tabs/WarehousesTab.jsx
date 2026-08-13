import React, { useState } from 'react';
import { Card, Button, Badge, LoadingSpinner } from '@shared/components/ui';
import { WarehouseForm } from '../WarehouseForm';
import { useToast } from '@shared/context';
import { warehouseService } from '@shared/services';
import { getErrorMessage } from '@shared/utils';
import { useWarehouses } from '../../hooks';

export const WarehousesTab = () => {
  const toast = useToast();
  const { warehouses, warehouseSellerOrders, loading, refresh } = useWarehouses(true);
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleCreateWarehouse = () => {
    setEditingWarehouse(null);
    setShowWarehouseForm(true);
  };

  const handleEditWarehouse = (warehouse) => {
    setEditingWarehouse(warehouse);
    setShowWarehouseForm(true);
  };

  const handleDeleteWarehouse = async (id) => {
    if (!window.confirm('Are you sure you want to delete this warehouse?')) {
      return;
    }
    setDeletingId(id);
    try {
      await warehouseService.delete(id);
      toast.success('Warehouse deleted successfully');
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete warehouse'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = () => {
    setShowWarehouseForm(false);
    setEditingWarehouse(null);
    refresh();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Warehouse Management</h2>
        <Button variant="primary" onClick={handleCreateWarehouse}>
          + Add New Warehouse
        </Button>
      </div>

      <WarehouseForm
        isOpen={showWarehouseForm}
        onClose={() => {
          setShowWarehouseForm(false);
          setEditingWarehouse(null);
        }}
        warehouse={editingWarehouse}
        onSave={handleSave}
      />

      {warehouses.length === 0 ? (
        <Card>
          <p>No warehouses found</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {warehouses.map((warehouse) => (
            <Card key={warehouse.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0 }}>{warehouse.name}</h3>
                    <Badge status={warehouse.active ? 'ACTIVE' : 'INACTIVE'} variant="solid">
                      {warehouse.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p><strong>Address:</strong> {warehouse.street || 'N/A'}</p>
                  <p><strong>City:</strong> {warehouse.city ? `${warehouse.city}, ${warehouse.state || ''} ${warehouse.pincode || ''}`.trim() : 'N/A'}</p>
                  {warehouse.phone && <p><strong>Phone:</strong> {warehouse.phone}</p>}
                  {warehouse.hoursOfOperation && <p><strong>Hours:</strong> {warehouse.hoursOfOperation}</p>}
                  
                  {/* Seller Orders for this Warehouse */}
                  {warehouseSellerOrders[warehouse.id] && warehouseSellerOrders[warehouse.id].length > 0 && (
                    <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                      <h4>Orders at this Warehouse ({warehouseSellerOrders[warehouse.id].length})</h4>
                      {warehouseSellerOrders[warehouse.id].map((order) => (
                        <div key={order.id} style={{ marginTop: '10px', padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
                          <p><strong>Order #:</strong> {order.sellerOrderNumber}</p>
                          <p><strong>Status:</strong> 
                            <Badge status={order.status} variant="solid" style={{ marginLeft: '10px' }}>
                              {order.status}
                            </Badge>
                          </p>
                          {order.trackingId && <p><strong>Tracking ID:</strong> {order.trackingId}</p>}
                          {order.arrivedAt && (
                            <p><strong>Arrived:</strong> {new Date(order.arrivedAt).toLocaleString()}</p>
                          )}
                          <Button
                            variant="info"
                            size="sm"
                            onClick={() => window.location.href = `/admin/order-groups/${order.orderGroupId}`}
                            style={{ marginTop: '5px' }}
                          >
                            View Order Details
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleEditWarehouse(warehouse)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDeleteWarehouse(warehouse.id)}
                    disabled={deletingId === warehouse.id}
                  >
                    {deletingId === warehouse.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WarehousesTab;
