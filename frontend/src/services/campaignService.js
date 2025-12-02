import api from './api';

/**
 * Email Campaign Service
 * API calls para marketing automation
 */

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

/**
 * Get all templates
 * @param {object} filters - Optional filters {categoria, activo}
 * @returns {Promise} Templates list
 */
export const getTemplates = async (filters = {}) => {
  const response = await api.get('/campaigns/templates', { params: filters });
  return response.data;
};

/**
 * Get template by ID
 * @param {number} templateId - Template ID
 * @returns {Promise} Template data
 */
export const getTemplateById = async (templateId) => {
  const response = await api.get(`/campaigns/templates/${templateId}`);
  return response.data;
};

/**
 * Create template
 * @param {object} templateData - Template data
 * @returns {Promise} Created template
 */
export const createTemplate = async (templateData) => {
  const response = await api.post('/campaigns/templates', templateData);
  return response.data;
};

/**
 * Update template
 * @param {number} templateId - Template ID
 * @param {object} updates - Fields to update
 * @returns {Promise} Updated template
 */
export const updateTemplate = async (templateId, updates) => {
  const response = await api.put(`/campaigns/templates/${templateId}`, updates);
  return response.data;
};

/**
 * Delete template
 * @param {number} templateId - Template ID
 * @returns {Promise} Delete result
 */
export const deleteTemplate = async (templateId) => {
  const response = await api.delete(`/campaigns/templates/${templateId}`);
  return response.data;
};

// ============================================================================
// EMAIL CAMPAIGNS
// ============================================================================

/**
 * Get all campaigns
 * @param {object} filters - Optional filters {estado}
 * @returns {Promise} Campaigns list
 */
export const getCampaigns = async (filters = {}) => {
  const response = await api.get('/campaigns', { params: filters });
  return response.data;
};

/**
 * Get campaign by ID
 * @param {number} campaignId - Campaign ID
 * @returns {Promise} Campaign data with stats
 */
export const getCampaignById = async (campaignId) => {
  const response = await api.get(`/campaigns/${campaignId}`);
  return response.data;
};

/**
 * Create campaign
 * @param {object} campaignData - Campaign data
 * @returns {Promise} Created campaign
 */
export const createCampaign = async (campaignData) => {
  const response = await api.post('/campaigns', campaignData);
  return response.data;
};

/**
 * Update campaign
 * @param {number} campaignId - Campaign ID
 * @param {object} updates - Fields to update
 * @returns {Promise} Updated campaign
 */
export const updateCampaign = async (campaignId, updates) => {
  const response = await api.put(`/campaigns/${campaignId}`, updates);
  return response.data;
};

/**
 * Delete campaign
 * @param {number} campaignId - Campaign ID
 * @returns {Promise} Delete result
 */
export const deleteCampaign = async (campaignId) => {
  const response = await api.delete(`/campaigns/${campaignId}`);
  return response.data;
};

// ============================================================================
// RECIPIENTS & SENDING
// ============================================================================

/**
 * Get campaign recipients
 * @param {number} campaignId - Campaign ID
 * @param {object} filters - Optional filters {estado}
 * @returns {Promise} Recipients list
 */
export const getCampaignRecipients = async (campaignId, filters = {}) => {
  const response = await api.get(`/campaigns/${campaignId}/recipients`, { params: filters });
  return response.data;
};

/**
 * Preview recipients count
 * @param {object} data - {tipoDestinatarios, filtros, destinatariosPersonalizados}
 * @returns {Promise} Recipients count preview
 */
export const previewRecipientsCount = async (data) => {
  const response = await api.post('/campaigns/preview-recipients', data);
  return response.data;
};

/**
 * Send campaign
 * @param {number} campaignId - Campaign ID
 * @param {boolean} immediate - Send immediately or schedule
 * @returns {Promise} Send result
 */
export const sendCampaign = async (campaignId, immediate = false) => {
  const response = await api.post(`/campaigns/${campaignId}/send`, { immediate });
  return response.data;
};

/**
 * Cancel scheduled campaign
 * @param {number} campaignId - Campaign ID
 * @returns {Promise} Cancel result
 */
export const cancelCampaign = async (campaignId) => {
  const response = await api.post(`/campaigns/${campaignId}/cancel`);
  return response.data;
};

// ============================================================================
// STATS
// ============================================================================

/**
 * Get campaign stats
 * @param {number} campaignId - Campaign ID
 * @returns {Promise} Campaign statistics
 */
export const getCampaignStats = async (campaignId) => {
  const response = await api.get(`/campaigns/${campaignId}/stats`);
  return response.data;
};

/**
 * Get campaigns summary
 * @returns {Promise} Overall campaigns summary
 */
export const getCampaignsSummary = async () => {
  const response = await api.get('/campaigns/stats/summary');
  return response.data;
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get campaign status color
 * @param {string} estado - Campaign status
 * @returns {string} Color class
 */
export const getCampaignStatusColor = (estado) => {
  const colors = {
    draft: 'gray',
    scheduled: 'blue',
    sending: 'yellow',
    sent: 'green',
    cancelled: 'red'
  };
  return colors[estado] || 'gray';
};

/**
 * Get campaign status label
 * @param {string} estado - Campaign status
 * @returns {string} Status label in Spanish
 */
export const getCampaignStatusLabel = (estado) => {
  const labels = {
    draft: 'Borrador',
    scheduled: 'Programada',
    sending: 'Enviando',
    sent: 'Enviada',
    cancelled: 'Cancelada'
  };
  return labels[estado] || estado;
};

/**
 * Get recipient types list
 * @returns {Array} List of recipient types
 */
export const getRecipientTypes = () => [
  { value: 'leads', label: 'Leads' },
  { value: 'clientes', label: 'Clientes' },
  { value: 'djs', label: 'DJs' },
  { value: 'todos', label: 'Todos' },
  { value: 'custom', label: 'Personalizado' }
];

/**
 * Get template categories
 * @returns {Array} List of template categories
 */
export const getTemplateCategories = () => [
  { value: 'marketing', label: 'Marketing' },
  { value: 'transactional', label: 'Transaccional' },
  { value: 'notification', label: 'Notificación' }
];

/**
 * Format percentage
 * @param {number} value - Percentage value
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value) => {
  if (!value || isNaN(value)) return '0%';
  return `${parseFloat(value).toFixed(1)}%`;
};

/**
 * Get recipient status color
 * @param {string} estado - Recipient status
 * @returns {string} Color class
 */
export const getRecipientStatusColor = (estado) => {
  const colors = {
    pending: 'gray',
    sent: 'blue',
    delivered: 'green',
    opened: 'purple',
    clicked: 'indigo',
    bounced: 'red',
    failed: 'red'
  };
  return colors[estado] || 'gray';
};

/**
 * Get recipient status label
 * @param {string} estado - Recipient status
 * @returns {string} Status label in Spanish
 */
export const getRecipientStatusLabel = (estado) => {
  const labels = {
    pending: 'Pendiente',
    sent: 'Enviado',
    delivered: 'Entregado',
    opened: 'Abierto',
    clicked: 'Clicado',
    bounced: 'Rebotado',
    failed: 'Fallido'
  };
  return labels[estado] || estado;
};

/**
 * Extract variables from HTML content
 * @param {string} html - HTML content
 * @returns {Array} List of variables found
 */
export const extractVariables = (html) => {
  if (!html) return [];

  const regex = /\{\{([^}]+)\}\}/g;
  const matches = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    const variable = `{{${match[1]}}}`;
    if (!matches.includes(variable)) {
      matches.push(variable);
    }
  }

  return matches;
};

export default {
  // Templates
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,

  // Campaigns
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,

  // Recipients & Sending
  getCampaignRecipients,
  previewRecipientsCount,
  sendCampaign,
  cancelCampaign,

  // Stats
  getCampaignStats,
  getCampaignsSummary,

  // Helpers
  getCampaignStatusColor,
  getCampaignStatusLabel,
  getRecipientTypes,
  getTemplateCategories,
  formatPercentage,
  getRecipientStatusColor,
  getRecipientStatusLabel,
  extractVariables
};
