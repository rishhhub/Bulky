import React, { useState } from 'react';
import { Modal } from '@shared/components/ui';
import { FormField, FormSelect, FormTextarea, FormCheckbox } from '@shared/components/forms';
import { Button } from '@shared/components/ui';
import { useToast } from '@shared/context';
import { productService, categoryService, uploadService } from '@shared/services';
import { getErrorMessage } from '@shared/utils';

export const ProductForm = ({ isOpen, onClose, product, categories, onSave }) => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price?.toString() || '',
    minOrderQuantity: product?.minOrderQuantity?.toString() || '',
    sourceUrl: product?.sourceUrl || '',
    sellerInfo: product?.sellerInfo || '',
    imageUrl: product?.imageUrl || '',
    imageUrls: product?.imageUrls && product.imageUrls.length > 0 
      ? product.imageUrls 
      : (product?.imageUrl ? [product.imageUrl] : []),
    categoryId: product?.categoryId?.toString() || '',
    baseDeliveryCost: product?.baseDeliveryCost?.toString() || '0',
    weightPerUnit: product?.weightPerUnit?.toString() || '1',
    active: product?.active !== undefined ? product.active : true,
  });
  const [newImageUrl, setNewImageUrl] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
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

  const validate = () => {
    const newErrors = {};
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }
    if (!formData.minOrderQuantity || isNaN(parseInt(formData.minOrderQuantity)) || parseInt(formData.minOrderQuantity) < 1) {
      newErrors.minOrderQuantity = 'Minimum order quantity must be at least 1';
    }
    if (!formData.categoryId || formData.categoryId.trim() === '') {
      newErrors.categoryId = 'Category is required. Products cannot be created without a category.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      let imageUrls = [];
      if (formData.imageUrls && formData.imageUrls.length > 0) {
        imageUrls = formData.imageUrls.filter(url => url && url.trim());
      } else if (formData.imageUrl && formData.imageUrl.trim()) {
        imageUrls = [formData.imageUrl.trim()];
      }

      const productData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        price: parseFloat(formData.price),
        minOrderQuantity: parseInt(formData.minOrderQuantity),
        sourceUrl: formData.sourceUrl?.trim() || null,
        sellerInfo: formData.sellerInfo?.trim() || null,
        imageUrl: imageUrls.length > 0 ? imageUrls[0] : null,
        imageUrls: imageUrls.length > 0 ? imageUrls : null,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        active: formData.active !== undefined ? formData.active : true,
        baseDeliveryCost: formData.baseDeliveryCost ? parseFloat(formData.baseDeliveryCost) : 0,
        weightPerUnit: formData.weightPerUnit ? parseFloat(formData.weightPerUnit) : 1,
      };

      if (product) {
        await productService.update(product.id, productData);
      } else {
        await productService.create(productData);
      }
      
      onSave();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save product'));
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions = categories.map(cat => ({
    value: cat.id.toString(),
    label: cat.name
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Product' : 'Create Product'}
    >
      <form onSubmit={handleSubmit}>
        <FormField
          label="Product Name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
          error={errors.name}
        />
        <FormTextarea
          label="Description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={4}
        />
        <FormField
          label="Price"
          type="number"
          step="0.01"
          value={formData.price}
          onChange={(e) => handleChange('price', e.target.value)}
          required
          error={errors.price}
        />
        <FormField
          label="Minimum Order Quantity"
          type="number"
          value={formData.minOrderQuantity}
          onChange={(e) => handleChange('minOrderQuantity', e.target.value)}
          required
          error={errors.minOrderQuantity}
        />
        <FormField
          label="Source URL"
          type="url"
          value={formData.sourceUrl}
          onChange={(e) => handleChange('sourceUrl', e.target.value)}
        />
        <FormField
          label="Seller Info"
          value={formData.sellerInfo}
          onChange={(e) => handleChange('sellerInfo', e.target.value)}
        />
        <FormSelect
          label="Category"
          name="categoryId"
          value={formData.categoryId}
          onChange={(e) => handleChange('categoryId', e.target.value)}
          options={[{ value: '', label: 'Select Category (Required)' }, ...categoryOptions]}
          required
          error={errors.categoryId}
        />
        <FormField
          label="Base Delivery Cost"
          type="number"
          step="0.01"
          value={formData.baseDeliveryCost}
          onChange={(e) => handleChange('baseDeliveryCost', e.target.value)}
        />
        <FormField
          label="Weight Per Unit (kg)"
          type="number"
          step="0.01"
          value={formData.weightPerUnit}
          onChange={(e) => handleChange('weightPerUnit', e.target.value)}
        />
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Product Images
          </label>
          <small style={{ display: 'block', marginBottom: '10px', color: '#666' }}>
            Drag and drop image files here, or click to select files, or paste image URLs.
            {uploading && <span style={{ color: '#007bff', fontWeight: 'bold', marginLeft: '10px' }}>Uploading...</span>}
          </small>
          
          {/* Drag and Drop Area */}
          <div
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
            onDrop={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragActive(false);
              
              const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
              if (files.length === 0) return;
              
              setUploading(true);
              try {
                const urls = await uploadService.uploadImages(files);
                setFormData(prev => {
                  const newUrls = [...prev.imageUrls, ...urls];
                  return { ...prev, imageUrls: newUrls, imageUrl: newUrls[0] || prev.imageUrl };
                });
              } catch (err) {
                toast.error('Failed to upload images: ' + getErrorMessage(err));
              } finally {
                setUploading(false);
              }
            }}
            onClick={() => document.getElementById('product-image-file-input').click()}
            style={{
              border: `2px dashed ${dragActive ? '#007bff' : '#ddd'}`,
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: dragActive ? '#f0f8ff' : '#fafafa',
              transition: 'all 0.3s ease',
              marginBottom: '15px'
            }}
          >
            <input
              id="product-image-file-input"
              type="file"
              multiple
              accept="image/*"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
                if (files.length === 0) return;
                
                setUploading(true);
                try {
                  const urls = await uploadService.uploadImages(files);
                  setFormData(prev => {
                    const newUrls = [...prev.imageUrls, ...urls];
                    return { ...prev, imageUrls: newUrls, imageUrl: newUrls[0] || prev.imageUrl };
                  });
                } catch (err) {
                  toast.error('Failed to upload images: ' + getErrorMessage(err));
                } finally {
                  setUploading(false);
                  // Reset input so same file can be selected again
                  e.target.value = '';
                }
              }}
            />
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📷</div>
            <p style={{ margin: 0, color: '#666' }}>
              {dragActive ? 'Drop images here' : 'Drag & drop images here or click to browse'}
            </p>
            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#999' }}>
              Or paste image URLs below
            </p>
          </div>

          {/* URL Input */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>
              Add Image URL:
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddImageUrl();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={handleAddImageUrl}>
                Add URL
              </Button>
            </div>
          </div>

          {/* Image Previews */}
          {formData.imageUrls.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', marginTop: '15px' }}>
              {formData.imageUrls.map((url, index) => (
                <div key={index} style={{ position: 'relative' }}>
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '120px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      border: '2px solid #ddd'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                  <div style={{ display: 'none', width: '100%', height: '120px', backgroundColor: '#f0f0f0', borderRadius: '4px', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#999' }}>
                    Invalid
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveImageUrl(index)}
                    style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ×
                  </button>
                  {index === 0 && (
                    <div style={{
                      position: 'absolute',
                      bottom: '5px',
                      left: '5px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      Main
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <FormCheckbox
          label="Active"
          checked={formData.active}
          onChange={(e) => handleChange('active', e.target.checked)}
        />
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving...' : (product ? 'Update' : 'Create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductForm;
