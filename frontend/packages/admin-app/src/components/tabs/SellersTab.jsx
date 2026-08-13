import React, { useState, useEffect } from 'react';
import { sellerService } from '@shared/services';
import { Card, Button, Badge, LoadingSpinner, Modal } from '@shared/components/ui';
import { FormField } from '@shared/components/forms';
import { useToast } from '@shared/context';
import { getErrorMessage } from '@shared/utils';

export const SellersTab = ({ onRefresh }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [sellers, setSellers] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadSellers();
  }, []);

  const loadSellers = async () => {
    try {
      setLoading(true);
      const data = await sellerService.getAllSellers();
      setSellers(data || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load sellers'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sellerId) => {
    if (!window.confirm('Are you sure you want to approve this seller?')) {
      return;
    }

    try {
      setProcessing(true);
      const user = JSON.parse(localStorage.getItem('user'));
      await sellerService.approveSeller(sellerId, user.id);
      toast.success('Seller approved successfully');
      loadSellers();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to approve seller'));
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setProcessing(true);
      const user = JSON.parse(localStorage.getItem('user'));
      await sellerService.rejectSeller(selectedSeller.id, user.id, rejectionReason);
      toast.success('Seller rejected successfully');
      setShowRejectModal(false);
      setSelectedSeller(null);
      setRejectionReason('');
      loadSellers();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to reject seller'));
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return '#28a745';
      case 'REJECTED':
        return '#dc3545';
      case 'PENDING':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  const filteredSellers = filterStatus === 'ALL' 
    ? sellers 
    : sellers.filter(s => s.profileStatus === filterStatus);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px'
      }}>
        <h2 style={{ 
          margin: 0,
          fontSize: '24px',
          fontWeight: '700',
          color: '#111827'
        }}>
          Seller Management
        </h2>
        <Button variant="secondary" onClick={loadSellers}>
          Refresh
        </Button>
      </div>

      {/* Filter */}
      <Card style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <strong>Filter by Status:</strong>
          <Button
            variant={filterStatus === 'ALL' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterStatus('ALL')}
          >
            All ({sellers.length})
          </Button>
          <Button
            variant={filterStatus === 'PENDING' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterStatus('PENDING')}
          >
            Pending ({sellers.filter(s => s.profileStatus === 'PENDING').length})
          </Button>
          <Button
            variant={filterStatus === 'APPROVED' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterStatus('APPROVED')}
          >
            Approved ({sellers.filter(s => s.profileStatus === 'APPROVED').length})
          </Button>
          <Button
            variant={filterStatus === 'REJECTED' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterStatus('REJECTED')}
          >
            Rejected ({sellers.filter(s => s.profileStatus === 'REJECTED').length})
          </Button>
        </div>
      </Card>

      {/* Sellers List */}
      {filteredSellers.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
          <h3>No sellers found</h3>
          <p style={{ color: '#6b7280' }}>
            {filterStatus === 'ALL' 
              ? 'No sellers have registered yet.' 
              : `No sellers with status: ${filterStatus}`}
          </p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredSellers.map(seller => (
            <Card key={seller.id} style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                      {seller.companyName}
                    </h3>
                    <Badge 
                      style={{ 
                        backgroundColor: getStatusColor(seller.profileStatus),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      {seller.profileStatus}
                    </Badge>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '14px', marginBottom: '12px' }}>
                    {seller.panNumber && (
                      <div>
                        <strong>PAN:</strong> {seller.panNumber}
                      </div>
                    )}
                    {seller.gstin && (
                      <div>
                        <strong>GSTIN:</strong> {seller.gstin}
                      </div>
                    )}
                    {seller.createdAt && (
                      <div>
                        <strong>Registered:</strong> {new Date(seller.createdAt).toLocaleDateString()}
                      </div>
                    )}
                    {seller.approvedAt && (
                      <div>
                        <strong>Approved:</strong> {new Date(seller.approvedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {seller.companyAddress && (
                    <div style={{ marginBottom: '12px', fontSize: '14px', color: '#6b7280' }}>
                      <strong>Address:</strong> {seller.companyAddress}
                    </div>
                  )}

                  {seller.profileStatus === 'REJECTED' && seller.rejectionReason && (
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: '#fee', 
                      border: '1px solid #fcc',
                      borderRadius: '4px',
                      marginTop: '12px',
                      fontSize: '13px',
                      color: '#c33'
                    }}>
                      <strong>Rejection Reason:</strong> {seller.rejectionReason}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                  {seller.profileStatus === 'PENDING' && (
                    <>
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => handleApprove(seller.id)}
                        disabled={processing}
                      >
                        Approve
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => {
                          setSelectedSeller(seller);
                          setShowRejectModal(true);
                        }}
                        disabled={processing}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedSeller(null);
          setRejectionReason('');
        }}
        title="Reject Seller"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleReject(); }}>
          <div className="form-group">
            <label>Rejection Reason *</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              required
              placeholder="Please provide a reason for rejection..."
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <Button type="submit" variant="danger" disabled={processing || !rejectionReason.trim()}>
              {processing ? 'Rejecting...' : 'Reject Seller'}
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                setShowRejectModal(false);
                setSelectedSeller(null);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
