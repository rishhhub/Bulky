/**
 * Logger that only outputs in development. Use instead of console.log/error
 * to avoid noise and accidental leakage of sensitive data in production.
 */
const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV === true;

export const logger = {
  log(...args) {
    if (isDev) {
      console.log(...args);
    }
  },
  warn(...args) {
    if (isDev) {
      console.warn(...args);
    }
  },
  error(...args) {
    if (isDev) {
      console.error(...args);
    }
  },
  debug(...args) {
    if (isDev) {
      console.debug(...args);
    }
  },
};

export default logger;
