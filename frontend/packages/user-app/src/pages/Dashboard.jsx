import React, { useEffect, useState } from 'react';
import { authService, orderService, notificationService, paymentService, trackingService } from '@shared/services';
import { InterestCard, InterestDetailModal, NotificationPanel, TrackingDisplay } from '@shared/components/features';
import { Button, Card, LoadingSpinner } from '@shared/components/ui';
import { useNotifications, useTracking } from '@shared/hooks';
import { INTEREST_STATUS } from '@shared/utils/constants';
import { formatCurrency, formatDate, formatDateTime } from '@shared/utils/formatters';

function Dashboard() {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [expandedTracking, setExpandedTracking] = useState({}); // interestId -> boolean
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'orders', 'all'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'PENDING', 'EXPIRED', etc.
  const [selectedInterest, setSelectedInterest] = useState(null);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [allPayments, setAllPayments] = useState([]); // All user payments
  const [expandedPayments, setExpandedPayments] = useState({}); // interestId -> boolean

  // Use notifications hook
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  } = useNotifications({
    notificationService,
    autoPoll: true,
    pollInterval: 30000
  });

  // Get interest IDs that need tracking
  const trackingInterestIds = interests
    .filter(interest => 
      interest.status === 'COMPLETE' || 
      interest.status === 'THRESHOLD_MET' || 
      interest.status === 'COLLECTING' || 
      interest.status === 'DIRECT_ORDER_PLACED'
    )
    .map(interest => interest.id);

  // Use tracking hook
  const {
    trackingData,
    loading: trackingLoading,
    error: trackingError,
    loadTracking
  } = useTracking({
    trackingService,
    interestIds: trackingInterestIds
  });

  useEffect(() => {
    loadInterests();
    loadPayments();
  }, []);

  const loadInterests = async () => {
    try {
      const data = await orderService.getMyInterests();
      setInterests(data || []);
    } catch (err) {
      console.error('Failed to load interests:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    try {
      const data = await paymentService.getUserPayments();
      setAllPayments(data || []);
    } catch (err) {
      console.error('Failed to load payments:', err);
    }
  };

  const getPaymentsByInterestId = (interestId) => {
    return allPayments.filter(payment => payment.interestId === interestId);
  };

  const getTotalPaidForInterest = (interestId) => {
    const payments = getPaymentsByInterestId(interestId);
    return payments
      .filter(p => p.status === 'COMPLETED' && p.paymentType !== 'REFUND')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  };

  const getTotalRefundedForInterest = (interestId) => {
    const payments = getPaymentsByInterestId(interestId);
    return payments
      .filter(p => p.paymentType === 'REFUND' && p.status === 'COMPLETED')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  };

  const togglePayments = (interestId) => {
    setExpandedPayments(prev => ({ ...prev, [interestId]: !prev[interestId] }));
  };

  const handleExtend = async (id, periodDays) => {
    try {
      await orderService.extendInterest(id, periodDays);
      loadInterests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to extend interest');
    }
  };

  const handleWithdraw = async (id) => {
    if (!window.confirm('Are you sure you want to withdraw? Your deposit will be refunded.')) {
      return;
    }
    
    try {
      await orderService.withdrawInterest(id);
      loadInterests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to withdraw interest');
    }
  };

  const handlePayRemaining = async (interestId) => {
    try {
      await paymentService.processRemainingBalancePayment(interestId);
      loadInterests();
      loadPayments(); // Refresh payments after payment
      markAllAsRead(); // Refresh notifications after payment
      alert('Payment successful!');
    } catch (err) {
      console.error('Payment error:', err);
      const errorMessage = err.response?.data?.message || 
                           err.response?.data?.error || 
                           err.message || 
                           'Payment failed. Please try again.';
      alert(`Payment failed: ${errorMessage}`);
    }
  };

  const handlePayFullAmount = async (interestId) => {
    if (!window.confirm('Pay the full remaining amount and place order directly?')) {
      return;
    }
    try {
      await paymentService.processFullPaymentForDirectOrder(interestId);
      loadInterests();
      loadPayments(); // Refresh payments after payment
      markAllAsRead(); // Refresh notifications after payment
      alert('Payment successful! Your order has been placed.');
    } catch (err) {
      console.error('Payment error:', err);
      const errorMessage = err.response?.data?.message || 
                           err.response?.data?.error || 
                           err.message || 
                           'Payment failed. Please try again.';
      alert(`Payment failed: ${errorMessage}`);
    }
  };

  const toggleTracking = (interestId) => {
    setExpandedTracking(prev => ({ ...prev, [interestId]: !prev[interestId] }));
    if (!trackingData[interestId]) {
      loadTracking(interestId);
    }
  };

  const handleViewDetails = (interest) => {
    setSelectedInterest(interest);
    setShowInterestModal(true);
  };

  const handleInterestUpdate = () => {
    loadInterests();
  };

  // Filter and categorize interests
  const getFilteredInterests = () => {
    let filtered = interests;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(interest => interest.status === statusFilter);
    }

    // Apply tab filter
    if (activeTab === 'active') {
      filtered = filtered.filter(interest => 
        interest.status !== 'COMPLETE' && 
        interest.status !== 'WITHDRAWN' && 
        interest.status !== 'REFUNDED' &&
        interest.status !== 'EXPIRED'
      );
    } else if (activeTab === 'orders') {
      // Only show as orders if collection is complete (COMPLETE status) or direct order placed
      // COMPLETE means all payments collected and order group is complete
      filtered = filtered.filter(interest => 
        interest.status === 'COMPLETE' || 
        interest.status === 'DIRECT_ORDER_PLACED'
      );
    }
    // 'all' tab shows everything (already filtered by statusFilter)

    return filtered;
  };

  const filteredInterests = getFilteredInterests();
  const activeInterests = interests.filter(i => 
    i.status !== 'COMPLETE' && 
    i.status !== 'WITHDRAWN' && 
    i.status !== 'REFUNDED' &&
    i.status !== 'EXPIRED'
  );
  // Only interests with COMPLETE status (collection complete) or DIRECT_ORDER_PLACED are orders
  const orders = interests.filter(i => 
    i.status === 'COMPLETE' || 
    i.status === 'DIRECT_ORDER_PLACED'
  );

  if (loading) {
    return (
      <div className="container" style={{ marginTop: '30px' }}>
        <LoadingSpinner />
      </div>
    );
  }

  const user = authService.getCurrentUser();

  return (
    <div className="container" style={{ marginTop: '30px', maxWidth: '1400px', margin: '30px auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#111827' }}>My Dashboard</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Button
            variant="secondary"
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ 
              position: 'relative',
              paddingRight: unreadCount > 0 ? '30px' : undefined
            }}
          >
            Notifications
            {unreadCount > 0 && (
              <span style={{
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
                border: '2px solid white'
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      <NotificationPanel
        notifications={notifications}
        unreadCount={unreadCount}
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onMarkRead={markAsRead}
        onMarkAllRead={markAllAsRead}
      />

      {/* Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px',
        marginBottom: '24px'
      }}>
        <Card style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#007bff', marginBottom: '8px' }}>
            {activeInterests.length}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Active Interests</div>
        </Card>
        <Card style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#28a745', marginBottom: '8px' }}>
            {orders.length}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Orders</div>
        </Card>
        <Card style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#6b7280', marginBottom: '8px' }}>
            {interests.filter(i => i.status === 'EXPIRED').length}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Expired</div>
        </Card>
        <Card style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
            {interests.length}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>Total</div>
        </Card>
      </div>

      {/* Tabs */}
      <Card style={{ padding: 0, marginBottom: '24px' }}>
        <div style={{ 
          display: 'flex', 
          borderBottom: '2px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <button
            onClick={() => {
              setActiveTab('active');
              setStatusFilter('all');
            }}
            style={{
              flex: 1,
              padding: '16px 24px',
              border: 'none',
              backgroundColor: activeTab === 'active' ? 'white' : 'transparent',
              color: activeTab === 'active' ? '#007bff' : '#6b7280',
              fontWeight: activeTab === 'active' ? '600' : '500',
              fontSize: '15px',
              cursor: 'pointer',
              borderBottom: activeTab === 'active' ? '2px solid #007bff' : '2px solid transparent',
              marginBottom: activeTab === 'active' ? '-2px' : '0',
              transition: 'all 0.2s'
            }}
          >
            Active Interests ({activeInterests.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('orders');
              setStatusFilter('all');
            }}
            style={{
              flex: 1,
              padding: '16px 24px',
              border: 'none',
              backgroundColor: activeTab === 'orders' ? 'white' : 'transparent',
              color: activeTab === 'orders' ? '#007bff' : '#6b7280',
              fontWeight: activeTab === 'orders' ? '600' : '500',
              fontSize: '15px',
              cursor: 'pointer',
              borderBottom: activeTab === 'orders' ? '2px solid #007bff' : '2px solid transparent',
              marginBottom: activeTab === 'orders' ? '-2px' : '0',
              transition: 'all 0.2s'
            }}
          >
            Orders ({orders.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('all');
              setStatusFilter('all');
            }}
            style={{
              flex: 1,
              padding: '16px 24px',
              border: 'none',
              backgroundColor: activeTab === 'all' ? 'white' : 'transparent',
              color: activeTab === 'all' ? '#007bff' : '#6b7280',
              fontWeight: activeTab === 'all' ? '600' : '500',
              fontSize: '15px',
              cursor: 'pointer',
              borderBottom: activeTab === 'all' ? '2px solid #007bff' : '2px solid transparent',
              marginBottom: activeTab === 'all' ? '-2px' : '0',
              transition: 'all 0.2s'
            }}
          >
            All Interests ({interests.length})
          </button>
        </div>

        {/* Filter Section */}
        <div style={{ 
          padding: '16px 24px', 
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              Filter by Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ 
                minWidth: '180px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="EXPIRING">Expiring</option>
              <option value="EXPIRED">Expired</option>
              <option value="THRESHOLD_MET">Threshold Met</option>
              <option value="COLLECTING">Collecting</option>
              <option value="COMPLETE">Complete</option>
              <option value="DIRECT_ORDER_READY">Direct Order Ready</option>
              <option value="DIRECT_ORDER_PLACED">Direct Order Placed</option>
              <option value="WITHDRAWN">Withdrawn</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Showing {filteredInterests.length} of {interests.length} interests
          </div>
        </div>
      </Card>

      {/* Content */}
      {filteredInterests.length === 0 ? (
        <Card>
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
              {activeTab === 'active' && 'You have no active interests'}
              {activeTab === 'orders' && 'You have no orders yet'}
              {activeTab === 'all' && 'You have no interests'}
            </p>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredInterests.map((interest) => {
            // For orders tab, show as order card instead of interest card
            if (activeTab === 'orders' && (interest.status === 'COMPLETE' || interest.status === 'DIRECT_ORDER_PLACED' || interest.orderId)) {
              return (
                <InterestCard
                  key={interest.id}
                  interest={interest}
                  onViewDetails={handleViewDetails}
                >
                  {/* Enhanced Order Information */}
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #e5e7eb' }}>
                    {/* Order Details Grid */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                      gap: '12px',
                      marginBottom: '16px'
                    }}>
                      {interest.orderNumber && (
                        <div style={{ 
                          padding: '12px', 
                          backgroundColor: '#eff6ff', 
                          borderRadius: '8px',
                          border: '1px solid #bfdbfe'
                        }}>
                          <div style={{ fontSize: '12px', color: '#1e40af', marginBottom: '4px', fontWeight: '600' }}>
                            ORDER NUMBER
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e40af' }}>
                            {interest.orderNumber}
                          </div>
                        </div>
                      )}
                      {interest.startDate && (
                        <div style={{ 
                          padding: '12px', 
                          backgroundColor: '#f9fafb', 
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                            ORDER DATE
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                            {formatDate(interest.startDate)}
                          </div>
                        </div>
                      )}
                      {interest.logisticsPreference && (
                        <div style={{ 
                          padding: '12px', 
                          backgroundColor: '#f9fafb', 
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                            DELIVERY METHOD
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                            {interest.logisticsPreference === 'DELIVERY' ? '🚚 Delivery' : '📦 Pickup'}
                          </div>
                        </div>
                      )}
                      {interest.warehouseName && (
                        <div style={{ 
                          padding: '12px', 
                          backgroundColor: '#f9fafb', 
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600' }}>
                            PICKUP LOCATION
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                            {interest.warehouseName}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Address Information */}
                    {interest.deliveryAddress && (
                      <div style={{ 
                        marginBottom: '16px',
                        padding: '12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '600' }}>
                          DELIVERY ADDRESS
                        </div>
                        <div style={{ fontSize: '14px', color: '#111827' }}>
                          {interest.deliveryAddress}
                        </div>
                      </div>
                    )}

                    {/* Payment Summary & Transactions */}
                    <div style={{ 
                      marginBottom: '16px',
                      padding: '16px',
                      backgroundColor: '#f0fdf4',
                      borderRadius: '8px',
                      border: '1px solid #bbf7d0'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#166534' }}>
                          Payment Summary
                        </h4>
                        <Button
                          variant="info"
                          size="sm"
                          onClick={() => togglePayments(interest.id)}
                        >
                          {expandedPayments[interest.id] ? 'Hide' : 'Show'} All Transactions
                        </Button>
                      </div>
                      
                      {/* Summary Totals */}
                      {(() => {
                        const payments = getPaymentsByInterestId(interest.id);
                        const totalPaid = getTotalPaidForInterest(interest.id);
                        const totalRefunded = getTotalRefundedForInterest(interest.id);
                        const netPaid = totalPaid - totalRefunded;
                        
                        return (
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                            gap: '12px',
                            marginBottom: expandedPayments[interest.id] ? '16px' : '0'
                          }}>
                            <div style={{ 
                              padding: '8px',
                              backgroundColor: '#dcfce7',
                              borderRadius: '6px',
                              border: '2px solid #22c55e'
                            }}>
                              <div style={{ fontSize: '12px', color: '#166534', marginBottom: '4px', fontWeight: '600' }}>
                                Total Paid
                              </div>
                              <div style={{ fontSize: '18px', fontWeight: '700', color: '#166534' }}>
                                {formatCurrency(netPaid)}
                              </div>
                            </div>
                            {totalRefunded > 0 && (
                              <div>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Refunded</div>
                                <div style={{ fontSize: '16px', fontWeight: '600', color: '#dc3545' }}>
                                  -{formatCurrency(totalRefunded)}
                                </div>
                              </div>
                            )}
                            {payments.length > 0 && (
                              <div>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Transactions</div>
                                <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                                  {payments.length}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* All Payment Transactions */}
                      {expandedPayments[interest.id] && (() => {
                        const payments = getPaymentsByInterestId(interest.id);
                        const sortedPayments = [...payments].sort((a, b) => 
                          new Date(b.createdAt) - new Date(a.createdAt)
                        );

                        const getPaymentTypeLabel = (type) => {
                          switch (type) {
                            case 'DEPOSIT': return '💰 Deposit';
                            case 'REMAINING': return '💳 Remaining Balance';
                            case 'LOGISTICS': return '🚚 Delivery Cost';
                            case 'REFUND': return '↩️ Refund';
                            default: return type;
                          }
                        };

                        const getPaymentTypeColor = (type) => {
                          switch (type) {
                            case 'DEPOSIT': return '#3b82f6';
                            case 'REMAINING': return '#10b981';
                            case 'LOGISTICS': return '#f59e0b';
                            case 'REFUND': return '#ef4444';
                            default: return '#6b7280';
                          }
                        };

                        const getStatusColor = (status) => {
                          switch (status) {
                            case 'COMPLETED': return '#10b981';
                            case 'PENDING': return '#f59e0b';
                            case 'FAILED': return '#ef4444';
                            case 'REFUNDED': return '#6b7280';
                            default: return '#6b7280';
                          }
                        };

                        return (
                          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #bbf7d0' }}>
                            <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#166534' }}>
                              All Transactions
                            </h5>
                            {sortedPayments.length === 0 ? (
                              <p style={{ color: '#6b7280', fontSize: '14px' }}>No payment transactions found.</p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {sortedPayments.map((payment) => (
                                  <div
                                    key={payment.id}
                                    style={{
                                      padding: '12px',
                                      backgroundColor: '#ffffff',
                                      borderRadius: '6px',
                                      border: `1px solid ${getPaymentTypeColor(payment.paymentType)}`,
                                      borderLeft: `4px solid ${getPaymentTypeColor(payment.paymentType)}`
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ 
                                          fontSize: '14px', 
                                          fontWeight: '600', 
                                          color: getPaymentTypeColor(payment.paymentType),
                                          marginBottom: '4px'
                                        }}>
                                          {getPaymentTypeLabel(payment.paymentType)}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                          {formatDateTime(payment.createdAt)}
                                        </div>
                                      </div>
                                      <div style={{ textAlign: 'right' }}>
                                        <div style={{ 
                                          fontSize: '16px', 
                                          fontWeight: '700',
                                          color: payment.paymentType === 'REFUND' ? '#ef4444' : '#10b981',
                                          marginBottom: '4px'
                                        }}>
                                          {payment.paymentType === 'REFUND' ? '-' : '+'}{formatCurrency(payment.amount)}
                                        </div>
                                        <div style={{ 
                                          fontSize: '11px',
                                          padding: '2px 8px',
                                          borderRadius: '12px',
                                          backgroundColor: getStatusColor(payment.status) + '20',
                                          color: getStatusColor(payment.status),
                                          fontWeight: '600',
                                          display: 'inline-block'
                                        }}>
                                          {payment.status}
                                        </div>
                                      </div>
                                    </div>
                                    {payment.transactionId && (
                                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>
                                        Txn ID: {payment.transactionId}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Order Tracking Section */}
                    {(interest.status === 'COMPLETE' || interest.status === 'DIRECT_ORDER_PLACED') && (
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Order Tracking</h4>
                          <Button
                            variant="info"
                            size="sm"
                            onClick={() => toggleTracking(interest.id)}
                          >
                            {expandedTracking[interest.id] ? 'Hide' : 'Show'} Tracking
                          </Button>
                        </div>
                        {expandedTracking[interest.id] && (
                          <TrackingDisplay
                            trackingData={trackingData[interest.id] || []}
                            isExpanded={expandedTracking[interest.id]}
                            onToggle={() => toggleTracking(interest.id)}
                            loading={trackingLoading[interest.id] || false}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </InterestCard>
              );
            }

            // Regular interest card
            return (
              <InterestCard
                key={interest.id}
                interest={interest}
                onExtend={handleExtend}
                onWithdraw={handleWithdraw}
                onPayRemaining={handlePayRemaining}
                onPayFullAmount={handlePayFullAmount}
                onViewDetails={handleViewDetails}
              >
                {(interest.status === 'COMPLETE' || interest.status === 'THRESHOLD_MET' || 
                  interest.status === 'COLLECTING' || interest.status === 'DIRECT_ORDER_PLACED') && (
                  <div style={{ marginTop: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h4 style={{ margin: 0 }}>Order Tracking</h4>
                      <Button
                        variant="info"
                        size="sm"
                        onClick={() => toggleTracking(interest.id)}
                      >
                        {expandedTracking[interest.id] ? 'Hide' : 'Show'} Tracking
                      </Button>
                    </div>
                    {expandedTracking[interest.id] && (
                      <TrackingDisplay
                        trackingData={trackingData[interest.id] || []}
                        isExpanded={expandedTracking[interest.id]}
                        onToggle={() => toggleTracking(interest.id)}
                        loading={trackingLoading[interest.id] || false}
                      />
                    )}
                  </div>
                )}
              </InterestCard>
            );
          })}
        </div>
      )}

      {/* Interest Detail Modal */}
      <InterestDetailModal
        isOpen={showInterestModal}
        onClose={() => {
          setShowInterestModal(false);
          setSelectedInterest(null);
        }}
        interest={selectedInterest}
        onUpdate={handleInterestUpdate}
      />
    </div>
  );
}

export default Dashboard;
