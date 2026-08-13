/**
 * Email validation
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Required field validation
 * @param {any} value - Value to validate
 * @returns {boolean} True if value exists
 */
export const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

/**
 * Minimum length validation
 * @param {string} value - Value to validate
 * @param {number} min - Minimum length
 * @returns {boolean} True if valid
 */
export const minLength = (value, min) => {
  if (!value) return false;
  return value.length >= min;
};

/**
 * Maximum length validation
 * @param {string} value - Value to validate
 * @param {number} max - Maximum length
 * @returns {boolean} True if valid
 */
export const maxLength = (value, max) => {
  if (!value) return true; // Optional field
  return value.length <= max;
};

/**
 * Minimum value validation
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value
 * @returns {boolean} True if valid
 */
export const minValue = (value, min) => {
  if (value === null || value === undefined) return false;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num >= min;
};

/**
 * Maximum value validation
 * @param {number} value - Value to validate
 * @param {number} max - Maximum value
 * @returns {boolean} True if valid
 */
export const maxValue = (value, max) => {
  if (value === null || value === undefined) return true; // Optional field
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num <= max;
};

/**
 * URL validation
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
 */
export const isValidUrl = (url) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Phone number validation (basic)
 * @param {string} phone - Phone to validate
 * @returns {boolean} True if valid
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

/**
 * ZIP code validation (US format)
 * @param {string} zip - ZIP code to validate
 * @returns {boolean} True if valid
 */
export const isValidZipCode = (zip) => {
  if (!zip) return false;
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zip);
};
