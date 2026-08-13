import { useState, useCallback } from 'react';
import { logger } from '../utils/logger.js';

/**
 * Hook for form state management
 * @param {Object} initialValues - Initial form values
 * @param {Function} onSubmit - Submit handler
 * @param {Object} validationRules - Validation rules object
 */
export const useForm = (initialValues = {}, onSubmit, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }, [errors]);

  const handleBlur = useCallback((name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    
    // Validate on blur
    if (validationRules[name]) {
      const error = validationRules[name](values[name], values);
      if (error) {
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    }
  }, [values, validationRules]);

  const validate = useCallback(() => {
    const newErrors = {};
    
    Object.keys(validationRules).forEach((name) => {
      const error = validationRules[name](values[name], values);
      if (error) {
        newErrors[name] = error;
      }
    });

    setErrors(newErrors);
    setTouched(
      Object.keys(validationRules).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {})
    );

    return Object.keys(newErrors).length === 0;
  }, [values, validationRules]);

  const handleSubmit = useCallback(async (e) => {
    if (e) {
      e.preventDefault();
    }

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      logger.error('Form submission error:', err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const setValue = useCallback((name, value) => {
    handleChange(name, value);
  }, [handleChange]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    validate,
    reset,
    setValue,
    setValues
  };
};

export default useForm;
