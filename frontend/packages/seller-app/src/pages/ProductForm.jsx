import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sellerProductService, categoryService, uploadService } from '@shared/services';
import { Card, Button, LoadingSpinner } from '@shared/components/ui';
import { FormField } from '@shared/components/forms';
import { formatCurrency } from '@shared/utils/formatters';

function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    costPerUnit: '',
    deliveryCostPerMinOrder: '',
    minOrderQuantity: '',
    weightPerUnit: '1',
    requiresApproval: true,
    imageUrls: []
  });

  const [newImageUrl, setNewImageUrl] = useState('');
  const [priceCalculation, setPriceCalculation] = useState(null);
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    loadCategories();
    if (isEditing) {
      loadProduct();
    } else {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // Calculate price when relevant fields change
    if (formData.costPerUnit && formData.deliveryCostPerMinOrder && formData.minOrderQuantity) {
      const costPerUnit = parseFloat(formData.costPerUnit);
      const deliveryCostPerMinOrder = parseFloat(formData.deliveryCostPerMinOrder);
      const minOrderQuantity = parseInt(formData.minOrderQuantity);

      if (!isNaN(costPerUnit) && !isNaN(deliveryCostPerMinOrder) && !isNaN(minOrderQuantity) && 
          costPerUnit > 0 && deliveryCostPerMinOrder >= 0 && minOrderQuantity > 0) {
        calculatePrice(costPerUnit, deliveryCostPerMinOrder, minOrderQuantity);
      } else {
        setPriceCalculation(null);
      }
    } else {
      setPriceCalculation(null);
    }
  }, [formData.costPerUnit, formData.deliveryCostPerMinOrder, formData.minOrderQuantity]);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll(true);
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadProduct = async () => {
    try {
      setLoading(true);
      const products = await sellerProductService.getSellerProducts();
      const product = products.find(p => p.id === parseInt(id));
      
      if (!product) {
        setError('Product not found');
        return;
      }

      setFormData({
        name: product.name || '',
        description: product.description || '',
        categoryId: product.categoryId?.toString() || '',
        costPerUnit: product.costPerUnit?.toString() || '',
        deliveryCostPerMinOrder: product.deliveryCostPerMinOrder?.toString() || '',
        minOrderQuantity: product.minOrderQuantity?.toString() || '',
        weightPerUnit: product.weightPerUnit?.toString() || '1',
        requiresApproval: product.requiresApproval !== undefined ? product.requiresApproval : true,
        imageUrls: product.imageUrls && product.imageUrls.length > 0 
          ? product.imageUrls 
          : (product.imageUrl ? [product.imageUrl] : [])
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = async (costPerUnit, deliveryCostPerMinOrder, minOrderQuantity) => {
    try {
      setCalculatingPrice(true);
      const result = await sellerProductService.calculatePrice(
        costPerUnit,
        deliveryCostPerMinOrder,
        minOrderQuantity
      );
      setPriceCalculation(result);
    } catch (err) {
      console.error('Failed to calculate price:', err);
      // Calculate locally as fallback
      const deliveryCostPerUnit = deliveryCostPerMinOrder / minOrderQuantity;
      const tenPercent = costPerUnit * 0.10;
      const platformFee = Math.min(tenPercent, 100);
      const listedPrice = costPerUnit + deliveryCostPerUnit + platformFee;
      
      setPriceCalculation({
        costPerUnit,
        deliveryCostPerUnit,
        platformFee,
        listedPrice
      });
    } finally {
      setCalculatingPrice(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleAddImageUrl = () => {
    if (newImageUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        imageUrls: [...prev.imageUrls, newImageUrl.trim()]
      }));
      setNewImageUrl('');
    }
  };

  const handleRemoveImageUrl = (index) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = async (files) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    setUploadingImages(true);
    try {
      const urls = await uploadService.uploadImages(imageFiles);
      setFormData(prev => ({
        ...prev,
        imageUrls: [...prev.imageUrls, ...urls]
      }));
    } catch (err) {
      alert('Failed to upload images: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }
    if (!formData.categoryId) {
      setError('Category is required');
      return;
    }
    if (!formData.costPerUnit || isNaN(parseFloat(formData.costPerUnit)) || parseFloat(formData.costPerUnit) <= 0) {
      setError('Valid cost per unit is required');
      return;
    }
    if (!formData.deliveryCostPerMinOrder || isNaN(parseFloat(formData.deliveryCostPerMinOrder)) || parseFloat(formData.deliveryCostPerMinOrder) < 0) {
      setError('Valid delivery cost is required');
      return;
    }
    if (!formData.minOrderQuantity || isNaN(parseInt(formData.minOrderQuantity)) || parseInt(formData.minOrderQuantity) < 1) {
      setError('Minimum order quantity must be at least 1');
      return;
    }
    if (!formData.weightPerUnit || isNaN(parseFloat(formData.weightPerUnit)) || parseFloat(formData.weightPerUnit) <= 0) {
      setError('Weight per unit must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        categoryId: parseInt(formData.categoryId),
        costPerUnit: parseFloat(formData.costPerUnit),
        deliveryCostPerMinOrder: parseFloat(formData.deliveryCostPerMinOrder),
        minOrderQuantity: parseInt(formData.minOrderQuantity),
        weightPerUnit: parseFloat(formData.weightPerUnit),
        requiresApproval: formData.requiresApproval,
        imageUrl: formData.imageUrls.length > 0 ? formData.imageUrls[0] : null,
        imageUrls: formData.imageUrls.length > 0 ? formData.imageUrls : null
      };

      if (isEditing) {
        await sellerProductService.updateProduct(parseInt(id), productData);
        alert('Product updated successfully');
      } else {
        await sellerProductService.createProduct(productData);
        alert('Product created successfully');
      }
      
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save product');
    } finally {
      setSaving(false);
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
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1>{isEditing ? 'Edit Product' : 'Create New Product'}</h1>
          <Button variant="secondary" onClick={() => navigate('/products')}>
            Cancel
          </Button>
        </div>

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

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Left Column */}
            <div>
              <FormField
                label="Product Name *"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => handleChange('categoryId', e.target.value)}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.path || (cat.parentName ? `${cat.parentName} > ${cat.name}` : cat.name)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <FormField
                  label="Cost Per Unit *"
                  type="number"
                  step="0.01"
                  value={formData.costPerUnit}
                  onChange={(e) => handleChange('costPerUnit', e.target.value)}
                  required
                />
                <FormField
                  label="Min Order Quantity *"
                  type="number"
                  value={formData.minOrderQuantity}
                  onChange={(e) => handleChange('minOrderQuantity', e.target.value)}
                  required
                />
              </div>

              <FormField
                label="Delivery Cost Per Min Order *"
                type="number"
                step="0.01"
                value={formData.deliveryCostPerMinOrder}
                onChange={(e) => handleChange('deliveryCostPerMinOrder', e.target.value)}
                required
              />

              <FormField
                label="Weight Per Unit (kg) *"
                type="number"
                step="0.01"
                value={formData.weightPerUnit}
                onChange={(e) => handleChange('weightPerUnit', e.target.value)}
                required
              />

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.requiresApproval}
                    onChange={(e) => handleChange('requiresApproval', e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  Requires Admin Approval
                </label>
                <small style={{ display: 'block', marginTop: '4px', color: '#6b7280' }}>
                  If checked, product will need admin approval before being visible to users
                </small>
              </div>
            </div>

            {/* Right Column - Price Calculation */}
            <div>
              <h3 style={{ marginBottom: '16px' }}>Price Calculation</h3>
              
              {priceCalculation ? (
                <Card style={{ padding: '20px', backgroundColor: '#f9fafb', marginBottom: '20px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#6b7280' }}>Base Cost per Unit:</span>
                      <strong>{formatCurrency(priceCalculation.costPerUnit)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#6b7280' }}>Delivery Cost per Unit:</span>
                      <span>{formatCurrency(priceCalculation.deliveryCostPerUnit)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#6b7280' }}>Platform Fee:</span>
                      <span>{formatCurrency(priceCalculation.platformFee)}</span>
                      <small style={{ color: '#6b7280', marginLeft: '8px' }}>
                        (10% or ₹100, whichever is lower)
                      </small>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: '2px solid #d1d5db'
                    }}>
                      <strong style={{ fontSize: '18px' }}>Final Listed Price:</strong>
                      <strong style={{ fontSize: '18px', color: '#28a745' }}>
                        {formatCurrency(priceCalculation.listedPrice)}
                      </strong>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card style={{ padding: '20px', backgroundColor: '#f9fafb', marginBottom: '20px', textAlign: 'center', color: '#6b7280' }}>
                  {calculatingPrice ? (
                    <LoadingSpinner />
                  ) : (
                    <p>Enter cost, delivery cost, and min order quantity to see price calculation</p>
                  )}
                </Card>
              )}

              {/* Image Upload Section */}
              <h3 style={{ marginBottom: '16px' }}>Product Images</h3>
              
              <div
                style={{
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  padding: '24px',
                  textAlign: 'center',
                  marginBottom: '16px',
                  backgroundColor: dragActive ? '#f0f9ff' : '#f9fafb',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(false);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(false);
                  handleImageUpload(e.dataTransfer.files);
                }}
                onClick={() => document.getElementById('image-file-input').click()}
              >
                <input
                  id="image-file-input"
                  type="file"
                  multiple
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleImageUpload(e.target.files)}
                />
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>📷</div>
                <p style={{ margin: 0, color: '#666' }}>
                  {dragActive ? 'Drop images here' : 'Drag & drop images here or click to browse'}
                </p>
                {uploadingImages && <p style={{ margin: '8px 0 0 0', color: '#007bff' }}>Uploading...</p>}
              </div>

              {/* Image URLs */}
              {formData.imageUrls.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ display: 'block', marginBottom: '8px' }}>Uploaded Images:</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
                    {formData.imageUrls.map((url, index) => (
                      <div key={index} style={{ position: 'relative' }}>
                        <img 
                          src={url} 
                          alt={`Product ${index + 1}`}
                          style={{ 
                            width: '100%', 
                            aspectRatio: '1',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImageUrl(index)}
                          style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Image URL */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Or paste image URL here"
                  style={{ flex: 1, padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                />
                <Button type="button" variant="secondary" onClick={handleAddImageUrl}>
                  Add
                </Button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : (isEditing ? 'Update Product' : 'Create Product')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/products')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default ProductForm;
