import pool from '../config/database.js';

/**
 * EmailCampaign Model
 * Handles email marketing campaigns, templates, and recipient tracking
 */

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

/**
 * Get all templates for an agency
 * @param {number} agencyId - Agency ID
 * @param {object} filters - Optional filters {categoria, activo}
 * @returns {Promise<Array>} List of templates
 */
export const getTemplates = async (agencyId, filters = {}) => {
  let query = `
    SELECT *
    FROM email_templates
    WHERE agency_id = $1 AND deleted_at IS NULL
  `;

  const params = [agencyId];
  let paramIndex = 2;

  if (filters.categoria) {
    query += ` AND categoria = $${paramIndex}`;
    params.push(filters.categoria);
    paramIndex++;
  }

  if (filters.activo !== undefined) {
    query += ` AND activo = $${paramIndex}`;
    params.push(filters.activo);
    paramIndex++;
  }

  query += ` ORDER BY created_at DESC`;

  const result = await pool.query(query, params);
  return result.rows;
};

/**
 * Get template by ID
 * @param {number} templateId - Template ID
 * @param {number} agencyId - Agency ID
 * @returns {Promise<object|null>} Template or null
 */
export const getTemplateById = async (templateId, agencyId) => {
  const result = await pool.query(
    `SELECT * FROM email_templates
     WHERE id = $1 AND agency_id = $2 AND deleted_at IS NULL`,
    [templateId, agencyId]
  );
  return result.rows[0] || null;
};

/**
 * Create email template
 * @param {object} templateData - Template data
 * @returns {Promise<object>} Created template
 */
export const createTemplate = async (templateData) => {
  const {
    agencyId,
    nombre,
    descripcion,
    categoria,
    asunto,
    contenidoHtml,
    contenidoTexto,
    variablesDisponibles
  } = templateData;

  const result = await pool.query(
    `INSERT INTO email_templates
     (agency_id, nombre, descripcion, categoria, asunto, contenido_html, contenido_texto, variables_disponibles)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [agencyId, nombre, descripcion, categoria, asunto, contenidoHtml, contenidoTexto, variablesDisponibles]
  );

  return result.rows[0];
};

/**
 * Update email template
 * @param {number} templateId - Template ID
 * @param {number} agencyId - Agency ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object|null>} Updated template or null
 */
export const updateTemplate = async (templateId, agencyId, updates) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  const allowedFields = {
    nombre: 'nombre',
    descripcion: 'descripcion',
    categoria: 'categoria',
    asunto: 'asunto',
    contenidoHtml: 'contenido_html',
    contenidoTexto: 'contenido_texto',
    variablesDisponibles: 'variables_disponibles',
    activo: 'activo'
  };

  Object.keys(updates).forEach(key => {
    if (allowedFields[key]) {
      fields.push(`${allowedFields[key]} = $${paramIndex}`);
      values.push(updates[key]);
      paramIndex++;
    }
  });

  if (fields.length === 0) {
    throw new Error('No valid fields to update');
  }

  values.push(templateId, agencyId);

  const result = await pool.query(
    `UPDATE email_templates
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex} AND agency_id = $${paramIndex + 1} AND deleted_at IS NULL
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

/**
 * Delete template (soft delete)
 * @param {number} templateId - Template ID
 * @param {number} agencyId - Agency ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteTemplate = async (templateId, agencyId) => {
  const result = await pool.query(
    `UPDATE email_templates
     SET deleted_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND agency_id = $2 AND deleted_at IS NULL
     RETURNING id`,
    [templateId, agencyId]
  );

  return result.rows.length > 0;
};

// ============================================================================
// EMAIL CAMPAIGNS
// ============================================================================

/**
 * Get all campaigns for an agency
 * @param {number} agencyId - Agency ID
 * @param {object} filters - Optional filters {estado}
 * @returns {Promise<Array>} List of campaigns
 */
export const getCampaigns = async (agencyId, filters = {}) => {
  let query = `
    SELECT c.*, t.nombre as template_nombre, u.email as creado_por_email
    FROM email_campaigns c
    LEFT JOIN email_templates t ON c.template_id = t.id
    LEFT JOIN users u ON c.creado_por = u.id
    WHERE c.agency_id = $1 AND c.deleted_at IS NULL
  `;

  const params = [agencyId];
  let paramIndex = 2;

  if (filters.estado) {
    query += ` AND c.estado = $${paramIndex}`;
    params.push(filters.estado);
    paramIndex++;
  }

  query += ` ORDER BY c.created_at DESC`;

  const result = await pool.query(query, params);
  return result.rows;
};

/**
 * Get campaign by ID with stats
 * @param {number} campaignId - Campaign ID
 * @param {number} agencyId - Agency ID
 * @returns {Promise<object|null>} Campaign with stats or null
 */
export const getCampaignById = async (campaignId, agencyId) => {
  const result = await pool.query(
    `SELECT c.*, t.nombre as template_nombre, u.email as creado_por_email,
            s.total_destinatarios, s.enviados, s.entregados, s.abiertos, s.clicados,
            s.rebotados, s.fallidos, s.tasa_entrega, s.tasa_apertura, s.tasa_click
     FROM email_campaigns c
     LEFT JOIN email_templates t ON c.template_id = t.id
     LEFT JOIN users u ON c.creado_por = u.id
     LEFT JOIN vw_campaign_stats s ON c.id = s.campaign_id
     WHERE c.id = $1 AND c.agency_id = $2 AND c.deleted_at IS NULL`,
    [campaignId, agencyId]
  );

  return result.rows[0] || null;
};

/**
 * Create email campaign
 * @param {object} campaignData - Campaign data
 * @returns {Promise<object>} Created campaign
 */
export const createCampaign = async (campaignData) => {
  const {
    agencyId,
    templateId,
    nombre,
    descripcion,
    asunto,
    contenidoHtml,
    contenidoTexto,
    tipoDestinatarios,
    filtros,
    destinatariosPersonalizados,
    fechaEnvioProgramada,
    creadoPor
  } = campaignData;

  const result = await pool.query(
    `INSERT INTO email_campaigns
     (agency_id, template_id, nombre, descripcion, asunto, contenido_html, contenido_texto,
      tipo_destinatarios, filtros, destinatarios_personalizados, fecha_envio_programada, creado_por)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      agencyId,
      templateId || null,
      nombre,
      descripcion || null,
      asunto,
      contenidoHtml,
      contenidoTexto || null,
      tipoDestinatarios,
      filtros ? JSON.stringify(filtros) : null,
      destinatariosPersonalizados || null,
      fechaEnvioProgramada || null,
      creadoPor
    ]
  );

  return result.rows[0];
};

/**
 * Update campaign
 * @param {number} campaignId - Campaign ID
 * @param {number} agencyId - Agency ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object|null>} Updated campaign or null
 */
export const updateCampaign = async (campaignId, agencyId, updates) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  const allowedFields = {
    nombre: 'nombre',
    descripcion: 'descripcion',
    asunto: 'asunto',
    contenidoHtml: 'contenido_html',
    contenidoTexto: 'contenido_texto',
    tipoDestinatarios: 'tipo_destinatarios',
    filtros: 'filtros',
    destinatariosPersonalizados: 'destinatarios_personalizados',
    fechaEnvioProgramada: 'fecha_envio_programada',
    estado: 'estado'
  };

  Object.keys(updates).forEach(key => {
    if (allowedFields[key]) {
      let value = updates[key];

      // Handle JSON fields
      if (key === 'filtros' && value !== null) {
        value = JSON.stringify(value);
      }

      fields.push(`${allowedFields[key]} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  });

  if (fields.length === 0) {
    throw new Error('No valid fields to update');
  }

  values.push(campaignId, agencyId);

  const result = await pool.query(
    `UPDATE email_campaigns
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex} AND agency_id = $${paramIndex + 1} AND deleted_at IS NULL
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

/**
 * Delete campaign (soft delete)
 * @param {number} campaignId - Campaign ID
 * @param {number} agencyId - Agency ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteCampaign = async (campaignId, agencyId) => {
  const result = await pool.query(
    `UPDATE email_campaigns
     SET deleted_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND agency_id = $2 AND deleted_at IS NULL
     RETURNING id`,
    [campaignId, agencyId]
  );

  return result.rows.length > 0;
};

// ============================================================================
// CAMPAIGN RECIPIENTS
// ============================================================================

/**
 * Get recipients for a campaign
 * @param {number} campaignId - Campaign ID
 * @param {object} filters - Optional filters {estado}
 * @returns {Promise<Array>} List of recipients
 */
export const getCampaignRecipients = async (campaignId, filters = {}) => {
  let query = `
    SELECT *
    FROM email_campaign_recipients
    WHERE campaign_id = $1
  `;

  const params = [campaignId];
  let paramIndex = 2;

  if (filters.estado) {
    query += ` AND estado = $${paramIndex}`;
    params.push(filters.estado);
    paramIndex++;
  }

  query += ` ORDER BY created_at DESC`;

  const result = await pool.query(query, params);
  return result.rows;
};

/**
 * Add recipients to campaign
 * @param {number} campaignId - Campaign ID
 * @param {Array} recipients - Array of recipient objects
 * @returns {Promise<Array>} Created recipients
 */
export const addCampaignRecipients = async (campaignId, recipients) => {
  const values = [];
  const placeholders = [];

  recipients.forEach((recipient, index) => {
    const baseIndex = index * 6;
    placeholders.push(
      `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6})`
    );
    values.push(
      campaignId,
      recipient.email,
      recipient.nombre || null,
      recipient.tipoDestinatario || null,
      recipient.destinatarioId || null,
      recipient.variablesPersonalizacion ? JSON.stringify(recipient.variablesPersonalizacion) : null
    );
  });

  const result = await pool.query(
    `INSERT INTO email_campaign_recipients
     (campaign_id, email, nombre, tipo_destinatario, destinatario_id, variables_personalizacion)
     VALUES ${placeholders.join(', ')}
     RETURNING *`,
    values
  );

  // Update total_destinatarios in campaign
  await pool.query(
    `UPDATE email_campaigns
     SET total_destinatarios = (SELECT COUNT(*) FROM email_campaign_recipients WHERE campaign_id = $1)
     WHERE id = $1`,
    [campaignId]
  );

  return result.rows;
};

/**
 * Update recipient status
 * @param {number} recipientId - Recipient ID
 * @param {string} estado - New status
 * @param {object} metadata - Optional metadata (error_mensaje, etc.)
 * @returns {Promise<object|null>} Updated recipient or null
 */
export const updateRecipientStatus = async (recipientId, estado, metadata = {}) => {
  const updates = ['estado = $1'];
  const values = [estado];
  let paramIndex = 2;

  // Update timestamps based on status
  if (estado === 'sent') {
    updates.push(`fecha_envio = CURRENT_TIMESTAMP`);
  } else if (estado === 'delivered') {
    updates.push(`fecha_entrega = CURRENT_TIMESTAMP`);
  } else if (estado === 'opened') {
    updates.push(`fecha_apertura = COALESCE(fecha_apertura, CURRENT_TIMESTAMP)`);
    updates.push(`veces_abierto = veces_abierto + 1`);
  } else if (estado === 'clicked') {
    updates.push(`fecha_primer_click = COALESCE(fecha_primer_click, CURRENT_TIMESTAMP)`);
    updates.push(`veces_clicado = veces_clicado + 1`);
  }

  // Add optional metadata
  if (metadata.errorMensaje) {
    updates.push(`error_mensaje = $${paramIndex}`);
    values.push(metadata.errorMensaje);
    paramIndex++;
  }

  if (metadata.linkClicado) {
    updates.push(`links_clicados = array_append(COALESCE(links_clicados, ARRAY[]::TEXT[]), $${paramIndex})`);
    values.push(metadata.linkClicado);
    paramIndex++;
  }

  updates.push(`intentos_envio = intentos_envio + 1`);

  values.push(recipientId);

  const result = await pool.query(
    `UPDATE email_campaign_recipients
     SET ${updates.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

/**
 * Get campaign stats
 * @param {number} campaignId - Campaign ID
 * @returns {Promise<object>} Campaign statistics
 */
export const getCampaignStats = async (campaignId) => {
  const result = await pool.query(
    `SELECT * FROM vw_campaign_stats WHERE campaign_id = $1`,
    [campaignId]
  );

  return result.rows[0] || {
    total_destinatarios: 0,
    enviados: 0,
    entregados: 0,
    abiertos: 0,
    clicados: 0,
    rebotados: 0,
    fallidos: 0,
    tasa_entrega: 0,
    tasa_apertura: 0,
    tasa_click: 0
  };
};

/**
 * Get potential recipients count
 * @param {number} agencyId - Agency ID
 * @param {string} tipoDestinatarios - Recipient type
 * @param {object} filtros - Filters
 * @returns {Promise<number>} Count of potential recipients
 */
export const getPotentialRecipientsCount = async (agencyId, tipoDestinatarios, filtros = {}) => {
  let query = '';
  const params = [agencyId];

  switch (tipoDestinatarios) {
    case 'leads':
      query = `SELECT COUNT(*) as count FROM leads WHERE deleted_at IS NULL`;
      break;
    case 'clientes':
      query = `SELECT COUNT(*) as count FROM clients WHERE deleted_at IS NULL`;
      break;
    case 'djs':
      query = `SELECT COUNT(*) as count FROM djs WHERE deleted_at IS NULL`;
      break;
    case 'todos':
      query = `
        SELECT (
          (SELECT COUNT(*) FROM leads WHERE deleted_at IS NULL) +
          (SELECT COUNT(*) FROM clients WHERE deleted_at IS NULL) +
          (SELECT COUNT(*) FROM djs WHERE deleted_at IS NULL)
        ) as count
      `;
      break;
    default:
      return 0;
  }

  const result = await pool.query(query, params);
  return parseInt(result.rows[0].count);
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

  // Recipients
  getCampaignRecipients,
  addCampaignRecipients,
  updateRecipientStatus,
  getCampaignStats,
  getPotentialRecipientsCount
};
