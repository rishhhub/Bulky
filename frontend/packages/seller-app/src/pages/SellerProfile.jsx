import React, { useState, useEffect } from 'react';
import { sellerService } from '@shared/services';
import { FormField } from '@shared/components/forms';
import { Button, Card, LoadingSpinner, Badge } from '@shared/components/ui';

function SellerProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState(null);

  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [gstin, setGstin] = useState('');

  useEffect(() => {
    loadProfile();
    
    // Set up periodic refresh to check for approval status updates
    const refreshInterval = setInterval(() => {
      loadProfile(false); // Background refresh, don't show loading spinner
    }, 30000); // Refresh every 30 seconds
    
    // Also refresh when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadProfile(false); // Background refresh when tab becomes visible
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadProfile = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const data = await sellerService.getSellerProfile();
      setProfile(data);
      setCompanyName(data.companyName || '');
      setCompanyAddress(data.companyAddress || '');
      setPanNumber(data.panNumber || '');
      setGstin(data.gstin || '');
      // Clear any previous errors on successful load
      if (data) {
        setError('');
      }
    } catch (err) {
      // Only show error if it's a manual refresh, not background refresh
      if (showLoading) {
        setError(err.response?.data?.message || err.message || 'Failed to load profile');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const validatePAN = (pan) => {
    if (!pan) return true; // Optional field
    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panPattern.test(pan.toUpperCase());
  };

  const validateGSTIN = (gstin) => {
    if (!gstin) return true; // Optional field
    const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinPattern.test(gstin.toUpperCase());
  };

  const handlePANChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 10) {
      setPanNumber(value);
    }
  };

  const handleGSTINChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 15) {
      setGstin(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!companyName.trim()) {
      setError('Company name is required');
      return;
    }

    if (panNumber && !validatePAN(panNumber)) {
      setError('PAN must be in format: ABCDE1234F (5 letters, 4 digits, 1 letter)');
      return;
    }

    if (gstin && !validateGSTIN(gstin)) {
      setError('GSTIN must be in format: 22AAAAA0000A1Z5 (2 digits, 5 letters, 4 digits, 1 letter, 1 char, Z, 1 char)');
      return;
    }

    // Check if profile is already approved
    if (profile && profile.profileStatus === 'APPROVED') {
      setError('Cannot update approved seller profile. Contact admin for changes.');
      return;
    }

    setSaving(true);
    try {
      const profileData = {
        companyName: companyName.trim(),
        companyAddress: companyAddress.trim() || null,
        panNumber: panNumber.trim() || null,
        gstin: gstin.trim() || null
      };

      await sellerService.updateSellerProfile(profileData);
      setSuccess('Profile updated successfully');
      await loadProfile();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
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

  const isProfileComplete = () => {
    return companyName && panNumber && gstin && 
           companyName.trim() && panNumber.trim() && gstin.trim();
  };

  if (loading) {
    return (
      <div className="container" style={{ marginTop: '30px', textAlign: 'center' }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '800px', marginTop: '30px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Seller Profile</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {profile && (
              <>
                <Badge 
                  style={{ 
                    backgroundColor: getStatusColor(profile.profileStatus),
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  {profile.profileStatus}
                </Badge>
                {isProfileComplete() && (
                  <Badge 
                    style={{ 
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    Complete
                  </Badge>
                )}
              </>
            )}
            <Button 
              variant="secondary" 
              onClick={() => loadProfile(true)}
              disabled={loading}
              style={{ minWidth: '100px' }}
              title="Refresh profile to check for approval status updates"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {profile && profile.profileStatus === 'REJECTED' && profile.rejectionReason && (
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#fee', 
            border: '1px solid #fcc',
            borderRadius: '6px',
            marginBottom: '20px',
            color: '#c33'
          }}>
            <strong>Rejection Reason:</strong> {profile.rejectionReason}
          </div>
        )}

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
          <h3 style={{ marginTop: '24px', marginBottom: '16px', color: '#374151' }}>Company Details</h3>
          
          <div className="form-group">
            <label>Company Name *</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              maxLength={200}
              disabled={profile && profile.profileStatus === 'APPROVED'}
            />
          </div>

          <div className="form-group">
            <label>Company Address</label>
            <textarea
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              rows={4}
              disabled={profile && profile.profileStatus === 'APPROVED'}
            />
          </div>

          <h3 style={{ marginTop: '32px', marginBottom: '16px', color: '#374151' }}>PAN Registration</h3>
          
          <div className="form-group">
            <label>PAN Number *</label>
            <input
              type="text"
              value={panNumber}
              onChange={handlePANChange}
              placeholder="ABCDE1234F"
              maxLength={10}
              required
              disabled={profile && profile.profileStatus === 'APPROVED'}
              style={{ 
                textTransform: 'uppercase',
                fontFamily: 'monospace',
                letterSpacing: '2px'
              }}
            />
            <small style={{ display: 'block', marginTop: '4px', color: '#6b7280' }}>
              Format: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)
            </small>
            {panNumber && !validatePAN(panNumber) && (
              <small style={{ display: 'block', marginTop: '4px', color: '#dc3545' }}>
                Invalid PAN format
              </small>
            )}
          </div>

          <h3 style={{ marginTop: '32px', marginBottom: '16px', color: '#374151' }}>GSTIN Registration</h3>
          
          <div className="form-group">
            <label>GSTIN *</label>
            <input
              type="text"
              value={gstin}
              onChange={handleGSTINChange}
              placeholder="22AAAAA0000A1Z5"
              maxLength={15}
              required
              disabled={profile && profile.profileStatus === 'APPROVED'}
              style={{ 
                textTransform: 'uppercase',
                fontFamily: 'monospace',
                letterSpacing: '1px'
              }}
            />
            <small style={{ display: 'block', marginTop: '4px', color: '#6b7280' }}>
              Format: 2 digits, 5 letters, 4 digits, 1 letter, 1 char, Z, 1 char (e.g., 22AAAAA0000A1Z5)
            </small>
            {gstin && !validateGSTIN(gstin) && (
              <small style={{ display: 'block', marginTop: '4px', color: '#dc3545' }}>
                Invalid GSTIN format
              </small>
            )}
          </div>

          {profile && profile.profileStatus !== 'APPROVED' && (
            <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
              <Button 
                type="submit" 
                variant="primary" 
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Update Profile'}
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={loadProfile}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          )}

          {profile && profile.profileStatus === 'APPROVED' && (
            <div style={{ 
              marginTop: '24px', 
              padding: '12px', 
              backgroundColor: '#e7f3ff', 
              borderRadius: '6px',
              color: '#0066cc'
            }}>
              <strong>Note:</strong> Your profile has been approved. Contact admin to make changes.
            </div>
          )}
        </form>

        {profile && (
          <div style={{ marginTop: '32px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
            <h4 style={{ marginBottom: '12px', color: '#374151' }}>Profile Information</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
              <div>
                <strong>Created:</strong> {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
              </div>
              {profile.approvedAt && (
                <div>
                  <strong>Approved:</strong> {new Date(profile.approvedAt).toLocaleDateString()}
                </div>
              )}
              {profile.rejectedAt && (
                <div>
                  <strong>Rejected:</strong> {new Date(profile.rejectedAt).toLocaleDateString()}
                </div>
              )}
              {profile.updatedAt && (
                <div>
                  <strong>Last Updated:</strong> {new Date(profile.updatedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default SellerProfile;
