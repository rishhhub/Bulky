/**
 * Extract a user-facing error message from an API error (Axios or similar).
 * Supports ApiError JSON (message), legacy string body, and Error.message.
 * @param {unknown} err - Error object (e.g. from catch (err))
 * @param {string} fallback - Message when no message can be extracted
 * @returns {string} User-facing error message
 */
export function getErrorMessage(err, fallback = 'Something went wrong') {
  if (err == null) return fallback;
  const data = err.response?.data;
  if (data != null) {
    if (typeof data === 'string') return data.trim() || fallback;
    if (typeof data.message === 'string') return data.message.trim() || fallback;
  }
  if (typeof err.message === 'string' && err.message.trim()) return err.message.trim();
  return fallback;
}
