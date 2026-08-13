import React, { useState } from 'react';
import { Modal } from '@shared/components/ui';
import { FormField, FormSelect, FormTextarea, FormCheckbox } from '@shared/components/forms';
import { Button } from '@shared/components/ui';
import { useToast } from '@shared/context';
import { categoryService } from '@shared/services';
import { getErrorMessage } from '@shared/utils';

export const CategoryForm = ({ isOpen, onClose, category, categories, onSave }) => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    imageUrl: category?.imageUrl || '',
    parentId: category?.parentId?.toString() || '',
    active: category?.active !== undefined ? category.active : true,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

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

  const validate = () => {
    const newErrors = {};
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const categoryData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        imageUrl: formData.imageUrl?.trim() || null,
        parentId: formData.parentId ? parseInt(formData.parentId) : null,
        active: formData.active !== undefined ? formData.active : true,
      };

      if (category) {
        await categoryService.update(category.id, categoryData);
      } else {
        await categoryService.create(categoryData);
      }
      
      onSave();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save category'));
    } finally {
      setSaving(false);
    }
  };

  // Filter out the current category and its children from parent options
  const getParentOptions = () => {
    if (!category) {
      return categories.map(cat => ({
        value: cat.id.toString(),
        label: cat.name
      }));
    }
    // Exclude current category and its descendants
    const excludeIds = new Set([category.id]);
    const collectChildren = (cat) => {
      if (cat.children) {
        cat.children.forEach(child => {
          excludeIds.add(child.id);
          collectChildren(child);
        });
      }
    };
    const findCategory = (cats, id) => {
      for (const cat of cats) {
        if (cat.id === id) return cat;
        if (cat.children) {
          const found = findCategory(cat.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    const currentCat = findCategory(categories, category.id);
    if (currentCat) {
      collectChildren(currentCat);
    }
    return categories
      .filter(cat => !excludeIds.has(cat.id))
      .map(cat => ({
        value: cat.id.toString(),
        label: cat.name
      }));
  };

  const parentOptions = getParentOptions();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? 'Edit Category' : 'Create Category'}
    >
      <form onSubmit={handleSubmit}>
        <FormField
          label="Category Name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
          error={errors.name}
        />
        <FormTextarea
          label="Description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
        />
        <FormField
          label="Image URL"
          type="url"
          value={formData.imageUrl}
          onChange={(e) => handleChange('imageUrl', e.target.value)}
        />
        <FormSelect
          label="Parent Category"
          value={formData.parentId}
          onChange={(e) => handleChange('parentId', e.target.value)}
          options={[{ value: '', label: 'None (Top Level)' }, ...parentOptions]}
        />
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
            {saving ? 'Saving...' : (category ? 'Update' : 'Create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CategoryForm;
