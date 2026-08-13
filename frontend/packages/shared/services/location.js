/**
 * Location service for getting user's current location and suggesting direct orders
 */
import { logger } from '../utils/logger.js';

const locationService = {
  /**
   * Get user's current location using browser geolocation API
   * @returns {Promise<{lat: number, lng: number}>} Coordinates
   */
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  },

  /**
   * Reverse geocode coordinates to get city information
   * Uses a geocoding service (e.g., OpenStreetMap Nominatim)
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<{city: string, state: string, country: string}>} Location info
   */
  async getCityFromCoordinates(lat, lng) {
    try {
      // Using OpenStreetMap Nominatim API (free, no key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'BulkByApp/1.0' // Required by Nominatim
          }
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const data = await response.json();
      const address = data.address || {};

      return {
        city: address.city || address.town || address.village || address.county || 'Unknown',
        state: address.state || address.region || 'Unknown',
        country: address.country || 'Unknown',
        pincode: address.postcode || null
      };
    } catch (error) {
      logger.error('Error reverse geocoding:', error);
      throw error;
    }
  },

  /**
   * Get city ID from coordinates using pincode lookup
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<{cityId: number, stateId: number, cityName: string, stateName: string}>} City info
   */
  async getCityIdFromCoordinates(lat, lng) {
    try {
      const locationInfo = await this.getCityFromCoordinates(lat, lng);
      
      if (!locationInfo.pincode) {
        throw new Error('Pincode not found for location');
      }

      // Use pincode service to get city/state IDs
      const { pincodeService } = await import('./index.js');
      const pincodeInfo = await pincodeService.lookup(locationInfo.pincode);

      if (!pincodeInfo) {
        throw new Error('Pincode not found in our system');
      }

      return {
        cityId: pincodeInfo.cityId,
        stateId: pincodeInfo.stateId,
        cityName: pincodeInfo.cityName,
        stateName: pincodeInfo.stateName,
        pincode: locationInfo.pincode
      };
    } catch (error) {
      logger.error('Error getting city ID from coordinates:', error);
      throw error;
    }
  },

  /**
   * Suggest direct orders based on user's current location
   * @returns {Promise<Array>} List of products with direct order available in user's city
   */
  async suggestDirectOrdersByLocation() {
    try {
      const coords = await this.getCurrentLocation();
      const cityInfo = await this.getCityIdFromCoordinates(coords.lat, coords.lng);
      
      // Fetch products with direct order availability for this city
      const { productService } = await import('./index.js');
      const products = await productService.getAll({ cityId: cityInfo.cityId });
      
      // Filter products with direct order available
      return products.filter(p => p.directOrderAvailable);
    } catch (error) {
      logger.error('Error suggesting direct orders by location:', error);
      return [];
    }
  }
};

export default locationService;
