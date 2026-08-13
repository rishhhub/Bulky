import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '@shared/services';
import { Card, Button } from '@shared/components/ui';
import { NotificationPanel } from '@shared/components/features';
import { useNotifications } from '@shared/hooks';
import {
  ProductsTab,
  OrdersTab,
  PendingInterestsTab,
  WarehousesTab,
  CategoriesTab,
  EmailDomainsTab,
  SellersTab,
  SellerProductsTab,
  CategoryRequestsTab,
} from '../components/tabs';

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');
  const [showNotifications, setShowNotifications] = useState(false);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    loadNotifications,
  } = useNotifications({
    notificationService,
    autoPoll: true,
    pollInterval: 30000,
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const tabGroups = [
    {
      label: 'Catalog',
      tabs: [
        { id: 'products', label: 'Products', icon: '📦' },
        { id: 'categories', label: 'Categories', icon: '📁' },
        { id: 'seller-products', label: 'Seller Products', icon: '🛒' },
      ],
    },
    {
      label: 'Orders',
      tabs: [
        { id: 'orders', label: 'Order Groups', icon: '📋' },
        { id: 'pending', label: 'Pending Interests', icon: '⏳' },
        { id: 'warehouses', label: 'Warehouses', icon: '🏭' },
      ],
    },
    {
      label: 'Sellers & requests',
      tabs: [
        { id: 'sellers', label: 'Sellers', icon: '👥' },
        { id: 'category-requests', label: 'Category Requests', icon: '📩' },
      ],
    },
    {
      label: 'Platform',
      tabs: [
        { id: 'email-domains', label: 'Email Domains', icon: '✉️' },
      ],
    },
    {
      label: 'Financial',
      tabs: [
        { id: 'financial', label: 'Financial', icon: '💰', link: '/admin/financial' },
      ],
    },
  ];

  return (
    <div
      style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '24px',
        minHeight: 'calc(100vh - 60px)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Left Sidebar */}
        <Card
          style={{
            padding: '0',
            position: 'sticky',
            top: '84px',
            maxHeight: 'calc(100vh - 108px)',
            overflowY: 'auto',
          }}
        >
          <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
            <h2
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '8px',
              }}
            >
              Admin Panel
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                color: '#6b7280',
              }}
            >
              Manage your platform
            </p>
          </div>

          <nav style={{ padding: '8px' }}>
            {tabGroups.map((group) => (
              <div key={group.label} style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    padding: '8px 12px 6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {group.label}
                </div>
                {group.tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.link) {
                        navigate(tab.link);
                      } else {
                        setActiveTab(tab.id);
                      }
                    }}
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
                      gap: '12px',
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                      marginBottom: '4px',
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
                    <span style={{ fontSize: '18px' }}>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
            <Button
              variant="secondary"
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                width: '100%',
                position: 'relative',
                paddingRight: unreadCount > 0 ? '30px' : undefined,
              }}
            >
              🔔 Notifications
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    borderRadius: '50%',
                    minWidth: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    padding: '0 6px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    border: '2px solid white',
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          </div>
        </Card>

        {/* Main Content */}
        <div>
          <NotificationPanel
            notifications={notifications}
            unreadCount={unreadCount}
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            onMarkRead={markAsRead}
            onMarkAllRead={markAllAsRead}
          />

          {activeTab === 'products' && <ProductsTab />}
          {activeTab === 'orders' && <OrdersTab />}
          {activeTab === 'pending' && <PendingInterestsTab />}
          {activeTab === 'warehouses' && <WarehousesTab />}
          {activeTab === 'categories' && <CategoriesTab />}
          {activeTab === 'email-domains' && <EmailDomainsTab />}
          {activeTab === 'sellers' && <SellersTab />}
          {activeTab === 'seller-products' && <SellerProductsTab />}
          {activeTab === 'category-requests' && <CategoryRequestsTab />}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
