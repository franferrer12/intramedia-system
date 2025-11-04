const API_BASE_URL = 'http://localhost:3001/api/social-media';

/**
 * Social Media API Client
 */

/**
 * Get all social media metrics for a DJ
 * @param {number} djId
 * @param {boolean} refresh - If true, fetches fresh data from platforms
 * @returns {Promise<Object>}
 */
export const getSocialMetrics = async (djId, refresh = false) => {
  const url = `${API_BASE_URL}/${djId}/metrics${refresh ? '?refresh=true' : ''}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch social metrics');
  }

  return data.data;
};

/**
 * Get linked social media accounts for a DJ
 * @param {number} djId
 * @returns {Promise<Array>}
 */
export const getLinkedAccounts = async (djId) => {
  const response = await fetch(`${API_BASE_URL}/${djId}/linked`);
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch linked accounts');
  }

  return data.data;
};

/**
 * Link a social media account
 * @param {number} djId
 * @param {string} platform
 * @param {string} username
 * @returns {Promise<Object>}
 */
export const linkAccount = async (djId, platform, username) => {
  const response = await fetch(`${API_BASE_URL}/${djId}/link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      platform,
      platform_username: username
    })
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to link account');
  }

  return data;
};

/**
 * Unlink a social media account
 * @param {number} djId
 * @param {string} platform
 * @returns {Promise<Object>}
 */
export const unlinkAccount = async (djId, platform) => {
  const response = await fetch(`${API_BASE_URL}/${djId}/unlink/${platform}`, {
    method: 'DELETE',
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to unlink account');
  }

  return data;
};

/**
 * Force refresh metrics for all or specific platform
 * @param {number} djId
 * @param {string} platform - Optional, refresh specific platform only
 * @returns {Promise<Object>}
 */
export const refreshMetrics = async (djId, platform = null) => {
  const response = await fetch(`${API_BASE_URL}/${djId}/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ platform })
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to refresh metrics');
  }

  return data.data;
};

/**
 * Get historical data for a platform
 * @param {number} djId
 * @param {string} platform
 * @param {number} days - Number of days of history (default 30)
 * @returns {Promise<Array>}
 */
export const getPlatformHistory = async (djId, platform, days = 30) => {
  const response = await fetch(`${API_BASE_URL}/${djId}/history/${platform}?days=${days}`);
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch platform history');
  }

  return data.data;
};

/**
 * Get summary of all social media metrics
 * @param {number} djId
 * @returns {Promise<Object>}
 */
export const getSocialSummary = async (djId) => {
  const response = await fetch(`${API_BASE_URL}/${djId}/summary`);
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch social summary');
  }

  return data.data;
};

export default {
  getSocialMetrics,
  getLinkedAccounts,
  linkAccount,
  unlinkAccount,
  refreshMetrics,
  getPlatformHistory,
  getSocialSummary
};
