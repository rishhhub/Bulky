import React, { useState, useEffect } from 'react';
import { categoryRequestService } from '@shared/services';
import { Card, Button, Badge, LoadingSpinner } from '@shared/components/ui';
import { FormField } from '@shared/components/forms';

function CategoryRequests() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    categoryName: '',
    description: ''
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await categoryRequestService.getSellerRequests();
      setRequests(data || []);
    } catch (err) {
      console.error('Failed to load category requests:', err);
      alert(err.response?.data?.message || 'Failed to load category requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.categoryName.trim()) {
      setError('Category name is required');
      return;
    }

    setSubmitting(true);
    try {
      await categoryRequestService.requestCategory(
        formData.categoryName.trim(),
        formData.description.trim() || null
      );
      setSuccess('Category request submitted successfully');
      setFormData({ categoryName: '', description: '' });
      loadRequests();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <div className="container" style={{ marginTop: '30px', textAlign: 'center' }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '900px', marginTop: '30px' }}>
      <h1 style={{ marginBottom: '24px' }}>Category Requests</h1>

      {/* Request Form */}
      <Card style={{ marginBottom: '32px' }}>
        <h2 style={{ marginBottom: '20px' }}>Request New Category</h2>
        
        {error && (
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#fee', 
            border: '1px solid #fcc',
            borderRadius: '6px',
            marginBottom: '20px',
            color: '#c33'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#efe', 
            border: '1px solid #cfc',
            borderRadius: '6px',
            marginBottom: '20px',
            color: '#3c3'
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <FormField
            label="Category Name *"
            value={formData.categoryName}
            onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
            required
            placeholder="e.g., Electronics, Clothing, Food"
          />

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="Optional: Describe what products would be in this category"
            />
          </div>

          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </form>
      </Card>

      {/* Existing Requests */}
      <Card>
        <h2 style={{ marginBottom: '20px' }}>My Category Requests</h2>

        {requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <p>No category requests yet. Submit a request above to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {requests.map(request => (
              <div
                key={request.id}
                style={{
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
                      {request.categoryName}
                    </h3>
                    {request.description && (
                      <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>
                        {request.description}
                      </p>
                    )}
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      <div>Requested: {new Date(request.createdAt).toLocaleDateString()}</div>
                      {request.reviewedAt && (
                        <div>Reviewed: {new Date(request.reviewedAt).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                  <Badge 
                    style={{ 
                      backgroundColor: getStatusColor(request.status),
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    {request.status}
                  </Badge>
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
                    ✓ Category has been approved and is now available for use
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default CategoryRequests;
