import React, { useState, useEffect } from 'react';
import { categoryRequestService } from '@shared/services';
import { Card, Button, Badge, LoadingSpinner, Modal } from '@shared/components/ui';
import { useToast } from '@shared/context';
import { getErrorMessage } from '@shared/utils';

export const CategoryRequestsTab = ({ onRefresh }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await categoryRequestService.getAllRequests();
      setRequests(data || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load category requests'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('Are you sure you want to approve this category request? The category will be created.')) {
      return;
    }

    try {
      setProcessing(true);
      await categoryRequestService.approveRequest(requestId);
      toast.success('Category request approved and category created successfully');
      loadRequests();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to approve request'));
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
      await categoryRequestService.rejectRequest(selectedRequest.id, rejectionReason);
      toast.success('Category request rejected successfully');
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      loadRequests();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to reject request'));
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

  const filteredRequests = filterStatus === 'ALL' 
    ? requests 
    : requests.filter(r => r.status === filterStatus);

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
          Category Requests
        </h2>
        <Button variant="secondary" onClick={loadRequests}>
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
            All ({requests.length})
          </Button>
          <Button
            variant={filterStatus === 'PENDING' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterStatus('PENDING')}
          >
            Pending ({requests.filter(r => r.status === 'PENDING').length})
          </Button>
          <Button
            variant={filterStatus === 'APPROVED' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterStatus('APPROVED')}
          >
            Approved ({requests.filter(r => r.status === 'APPROVED').length})
          </Button>
          <Button
            variant={filterStatus === 'REJECTED' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterStatus('REJECTED')}
          >
            Rejected ({requests.filter(r => r.status === 'REJECTED').length})
          </Button>
        </div>
      </Card>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <h3>No category requests found</h3>
          <p style={{ color: '#6b7280' }}>
            {filterStatus === 'ALL' 
              ? 'No category requests have been submitted yet.' 
              : `No category requests with status: ${filterStatus}`}
          </p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredRequests.map(request => (
            <Card key={request.id} style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                      {request.categoryName}
                    </h3>
                    <Badge 
                      style={{ 
                        backgroundColor: getStatusColor(request.status),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      {request.status}
                    </Badge>
                  </div>

                  {request.description && (
                    <p style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '14px' }}>
                      {request.description}
                    </p>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '14px', marginBottom: '12px' }}>
                    {request.sellerName && (
                      <div>
                        <strong>Requested by:</strong> {request.sellerName}
                      </div>
                    )}
                    {request.createdAt && (
                      <div>
                        <strong>Requested:</strong> {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    )}
                    {request.reviewedAt && (
                      <div>
                        <strong>Reviewed:</strong> {new Date(request.reviewedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {request.status === 'REJECTED' && request.rejectionReason && (
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: '#fee', 
                      border: '1px solid #fcc',
                      borderRadius: '4px',
                      marginTop: '12px',
                      fontSize: '13px',
                      color: '#c33'
                    }}>
                      <strong>Rejection Reason:</strong> {request.rejectionReason}
                    </div>
                  )}

                  {request.status === 'APPROVED' && (
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: '#efe', 
                      border: '1px solid #cfc',
                      borderRadius: '4px',
                      marginTop: '12px',
                      fontSize: '13px',
                      color: '#3c3'
                    }}>
                      ✓ Category has been created and is now available
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                  {request.status === 'PENDING' && (
                    <>
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => handleApprove(request.id)}
                        disabled={processing}
                      >
                        Approve
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
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
          setSelectedRequest(null);
          setRejectionReason('');
        }}
        title="Reject Category Request"
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
              {processing ? 'Rejecting...' : 'Reject Request'}
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                setShowRejectModal(false);
                setSelectedRequest(null);
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
