/**
 * Cross-app URLs from environment. Each app should set VITE_*_APP_URL in .env.
 * When bundled by Vite, import.meta.env is replaced with the app's env.
 */
const env = typeof import.meta !== 'undefined' ? import.meta.env : {};

export const appUrls = {
  get userAppUrl() {
    return env.VITE_USER_APP_URL || 'http://localhost:3000';
  },
  get adminAppUrl() {
    return env.VITE_ADMIN_APP_URL || 'http://localhost:3001';
  },
  get sellerAppUrl() {
    return env.VITE_SELLER_APP_URL || 'http://localhost:3002';
  },
};

export default appUrls;
