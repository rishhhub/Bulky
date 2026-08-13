import React, { useState, useEffect } from 'react';
import { Card, Button } from '@shared/components/ui';
import { useToast } from '@shared/context';
import { allowedEmailDomainService } from '@shared/services';
import { getErrorMessage } from '@shared/utils';

export const EmailDomainsTab = () => {
  const toast = useToast();
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDomain, setEditingDomain] = useState(null);
  const [formData, setFormData] = useState({
    domain: '',
    active: true,
    description: ''
  });

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    try {
      setLoading(true);
      const data = await allowedEmailDomainService.getAllAllowedDomains();
      setDomains(data || []);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load email domains'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingDomain(null);
    setFormData({
      domain: '',
      active: true,
      description: ''
    });
    setShowForm(true);
  };

  const handleEdit = (domain) => {
    setEditingDomain(domain);
    setFormData({
      domain: domain.domain || '',
      active: domain.active !== undefined ? domain.active : true,
      description: domain.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this email domain? Users with this domain will not be able to register.')) {
      return;
    }
    try {
      await allowedEmailDomainService.deleteAllowedDomain(id);
      toast.success('Email domain deleted successfully');
      loadDomains();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete email domain'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate domain format
    const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainPattern.test(formData.domain.trim())) {
      setError('Invalid domain format');
      return;
    }

    try {
      if (editingDomain) {
        await allowedEmailDomainService.updateAllowedDomain(editingDomain.id, formData);
        toast.success('Email domain updated successfully');
      } else {
        await allowedEmailDomainService.createAllowedDomain(formData);
        toast.success('Email domain created successfully');
      }
      setShowForm(false);
      setEditingDomain(null);
      loadDomains();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save email domain'));
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Allowed Email Domains</h2>
        <Button onClick={handleCreate} variant="primary">
          + Add Domain
        </Button>
      </div>

      {error && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          {error}
        </div>
      )}

      {showForm && (
        <Card style={{ marginBottom: '20px', padding: '20px' }}>
          <h3 style={{ marginTop: 0 }}>
            {editingDomain ? 'Edit Email Domain' : 'Add Email Domain'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                Domain * (e.g., gmail.com, company.com)
              </label>
              <input
                type="text"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="example.com"
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
                <span>Active</span>
              </label>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                Description (optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description for this domain"
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button type="submit" variant="primary">
                {editingDomain ? 'Update' : 'Create'}
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => {
                  setShowForm(false);
                  setEditingDomain(null);
                  setError('');
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {domains.length === 0 ? (
        <Card style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#666', margin: 0 }}>
            No email domains configured. Add a domain to allow users to register with that email domain.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {domains.map((domain) => (
            <Card key={domain.id} style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px' }}>{domain.domain}</h3>
                    <span style={{
                      padding: '3px 8px',
                      backgroundColor: domain.active ? '#28a745' : '#dc3545',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {domain.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {domain.description && (
                    <p style={{ color: '#666', marginBottom: '10px', fontSize: '14px' }}>
                      {domain.description}
                    </p>
                  )}
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    Created: {domain.createdAt ? new Date(domain.createdAt).toLocaleDateString() : 'N/A'}
                    {domain.updatedAt && domain.updatedAt !== domain.createdAt && (
                      <span> • Updated: {new Date(domain.updatedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                  <Button 
                    onClick={() => handleEdit(domain)} 
                    variant="secondary"
                    size="sm"
                  >
                    Edit
                  </Button>
                  <Button 
                    onClick={() => handleDelete(domain.id)} 
                    variant="danger"
                    size="sm"
                  >
                    Delete
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
