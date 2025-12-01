import pool from '../config/database.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';

/**
 * Document Model
 * Sprint 4.3 - Document Management System
 *
 * Funcionalidades:
 * - Upload múltiple con categorías y tags
 * - Versionado de archivos con historial completo
 * - Permisos granulares y sharing con links
 * - Full-text search y metadata
 * - Access logs para auditoría
 */

class Document {
  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * CRUD BÁSICO
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */

  /**
   * Crear nuevo documento
   */
  static async create(data) {
    const {
      filename,
      original_filename,
      title,
      description,
      category = 'other',
      tags = [],
      file_path,
      file_url,
      mime_type,
      file_size,
      file_hash,
      storage_provider = 'local',
      storage_bucket,
      storage_key,
      metadata = {},
      related_to_type,
      related_to_id,
      agency_id,
      access_level = 'private',
      owner_id,
      uploaded_by
    } = data;

    const query = `
      INSERT INTO documents (
        filename, original_filename, title, description, category, tags,
        file_path, file_url, mime_type, file_size, file_hash,
        storage_provider, storage_bucket, storage_key, metadata,
        related_to_type, related_to_id, agency_id, access_level,
        owner_id, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *, pg_size_pretty(file_size) as file_size_human
    `;

    const values = [
      filename,
      original_filename,
      title || original_filename,
      description,
      category,
      tags,
      file_path,
      file_url,
      mime_type,
      file_size,
      file_hash,
      storage_provider,
      storage_bucket,
      storage_key,
      JSON.stringify(metadata),
      related_to_type,
      related_to_id,
      agency_id,
      access_level,
      owner_id,
      uploaded_by
    ];

    const result = await pool.query(query, values);

    // Actualizar contador de tags
    if (tags && tags.length > 0) {
      await this.updateTagUsageCount(tags);
    }

    logger.info('Document created:', { documentId: result.rows[0].id });
    return result.rows[0];
  }

  /**
   * Obtener todos los documentos con filtros y paginación
   */
  static async findAll(filters = {}) {
    const {
      page = 1,
      limit = 20,
      category,
      status = 'active',
      owner_id,
      agency_id,
      related_to_type,
      related_to_id,
      tags,
      search,
      sort_by = 'uploaded_at',
      sort_order = 'DESC'
    } = filters;

    const offset = (page - 1) * limit;
    const conditions = ['d.deleted_at IS NULL'];
    const values = [];
    let paramIndex = 1;

    // Filtros
    if (category) {
      conditions.push(`d.category = $${paramIndex++}`);
      values.push(category);
    }

    if (status) {
      conditions.push(`d.status = $${paramIndex++}`);
      values.push(status);
    }

    if (owner_id) {
      conditions.push(`d.owner_id = $${paramIndex++}`);
      values.push(owner_id);
    }

    if (agency_id) {
      conditions.push(`d.agency_id = $${paramIndex++}`);
      values.push(agency_id);
    }

    if (related_to_type && related_to_id) {
      conditions.push(`d.related_to_type = $${paramIndex++}`);
      values.push(related_to_type);
      conditions.push(`d.related_to_id = $${paramIndex++}`);
      values.push(related_to_id);
    }

    if (tags && tags.length > 0) {
      conditions.push(`d.tags && $${paramIndex++}`);
      values.push(tags);
    }

    // Full-text search
    if (search) {
      conditions.push(`d.search_vector @@ plainto_tsquery('spanish', $${paramIndex++})`);
      values.push(search);
    }

    // Query principal
    const query = `
      SELECT
        d.*,
        pg_size_pretty(d.file_size) as file_size_human,
        u.name as owner_name,
        (SELECT COUNT(*) FROM document_versions dv WHERE dv.document_id = d.id) as version_count,
        (SELECT MAX(accessed_at) FROM document_access_logs WHERE document_id = d.id AND access_type = 'view') as last_accessed_at
      FROM documents d
      LEFT JOIN users u ON d.owner_id = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY d.${sort_by} ${sort_order}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(limit, offset);

    // Count total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM documents d
      WHERE ${conditions.join(' AND ')}
    `;

    const [documentsResult, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, values.slice(0, -2))
    ]);

    return {
      documents: documentsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    };
  }

  /**
   * Obtener documento por ID
   */
  static async findById(id) {
    const query = `
      SELECT
        d.*,
        pg_size_pretty(d.file_size) as file_size_human,
        u.name as owner_name,
        u.email as owner_email,
        a.nombre as agency_name,
        (SELECT COUNT(*) FROM document_versions dv WHERE dv.document_id = d.id) as version_count,
        (SELECT MAX(accessed_at) FROM document_access_logs WHERE document_id = d.id AND access_type = 'view') as last_accessed_at,
        (SELECT COUNT(DISTINCT accessed_by) FROM document_access_logs WHERE document_id = d.id AND accessed_at > NOW() - INTERVAL '30 days') as views_last_30_days
      FROM documents d
      LEFT JOIN users u ON d.owner_id = u.id
      LEFT JOIN agencies a ON d.agency_id = a.id
      WHERE d.id = $1 AND d.deleted_at IS NULL
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Actualizar documento
   */
  static async update(id, updates) {
    const allowedFields = [
      'title',
      'description',
      'category',
      'tags',
      'metadata',
      'access_level',
      'status'
    ];

    const setClause = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        if (key === 'metadata') {
          setClause.push(`${key} = $${paramIndex++}::jsonb`);
          values.push(JSON.stringify(updates[key]));
        } else {
          setClause.push(`${key} = $${paramIndex++}`);
          values.push(updates[key]);
        }
      }
    });

    if (setClause.length === 0) {
      throw new Error('No valid fields to update');
    }

    setClause.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE documents
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      throw new Error('Document not found');
    }

    // Actualizar contador de tags si cambiaron
    if (updates.tags) {
      await this.updateTagUsageCount(updates.tags);
    }

    logger.info('Document updated:', { documentId: id });
    return result.rows[0];
  }

  /**
   * Eliminar documento (soft delete)
   */
  static async delete(id, userId) {
    const query = `
      UPDATE documents
      SET deleted_at = NOW(), deleted_by = $2
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `;

    const result = await pool.query(query, [id, userId]);

    if (result.rowCount === 0) {
      return false;
    }

    logger.info('Document deleted:', { documentId: id, userId });
    return true;
  }

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * VERSIONADO
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */

  /**
   * Crear nueva versión de un documento
   */
  static async createVersion(documentId, newFileData, userId) {
    const {
      file_path,
      file_size,
      change_description = 'Actualización del archivo'
    } = newFileData;

    const query = `
      SELECT create_document_version($1, $2, $3, $4, $5) as new_version
    `;

    const result = await pool.query(query, [
      documentId,
      file_path,
      file_size,
      change_description,
      userId
    ]);

    logger.info('Document version created:', { documentId, version: result.rows[0].new_version });
    return result.rows[0].new_version;
  }

  /**
   * Obtener historial de versiones
   */
  static async getVersionHistory(documentId) {
    const query = `
      SELECT
        dv.*,
        pg_size_pretty(dv.file_size) as file_size_human,
        u.name as changed_by_name
      FROM document_versions dv
      LEFT JOIN users u ON dv.changed_by = u.id
      WHERE dv.document_id = $1
      ORDER BY dv.version DESC
    `;

    const result = await pool.query(query, [documentId]);
    return result.rows;
  }

  /**
   * Rollback a versión anterior
   */
  static async rollbackVersion(documentId, targetVersion, userId) {
    const query = `
      SELECT rollback_document_version($1, $2, $3) as success
    `;

    const result = await pool.query(query, [documentId, targetVersion, userId]);

    logger.info('Document rolled back:', { documentId, targetVersion, userId });
    return result.rows[0].success;
  }

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * PERMISOS Y SHARING
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */

  /**
   * Verificar si usuario tiene acceso al documento
   */
  static async checkAccess(documentId, userId, accessType = 'view') {
    const query = `
      SELECT can_access_document($1, $2, $3) as has_access
    `;

    const result = await pool.query(query, [documentId, userId, accessType]);
    return result.rows[0].has_access;
  }

  /**
   * Compartir documento con usuario o rol
   */
  static async share(documentId, shareData, sharedBy) {
    const {
      shared_with_user_id,
      shared_with_role_id,
      shared_with_email,
      can_view = true,
      can_download = true,
      can_edit = false,
      can_share = false,
      expires_at
    } = shareData;

    const query = `
      INSERT INTO document_shares (
        document_id, shared_with_user_id, shared_with_role_id, shared_with_email,
        can_view, can_download, can_edit, can_share, expires_at, shared_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      documentId,
      shared_with_user_id || null,
      shared_with_role_id || null,
      shared_with_email || null,
      can_view,
      can_download,
      can_edit,
      can_share,
      expires_at || null,
      sharedBy
    ];

    const result = await pool.query(query, values);

    logger.info('Document shared:', { documentId, shareId: result.rows[0].id, sharedBy });
    return result.rows[0];
  }

  /**
   * Remover acceso compartido
   */
  static async unshare(shareId) {
    const query = `
      UPDATE document_shares
      SET is_active = false
      WHERE id = $1
      RETURNING id
    `;

    const result = await pool.query(query, [shareId]);
    return result.rowCount > 0;
  }

  /**
   * Obtener lista de shares de un documento
   */
  static async getShares(documentId) {
    const query = `
      SELECT
        ds.*,
        u_shared_with.name as shared_with_user_name,
        u_shared_by.name as shared_by_name,
        r.name as shared_with_role_name
      FROM document_shares ds
      LEFT JOIN users u_shared_with ON ds.shared_with_user_id = u_shared_with.id
      LEFT JOIN users u_shared_by ON ds.shared_by = u_shared_by.id
      LEFT JOIN roles r ON ds.shared_with_role_id = r.id
      WHERE ds.document_id = $1 AND ds.is_active = true
      ORDER BY ds.shared_at DESC
    `;

    const result = await pool.query(query, [documentId]);
    return result.rows;
  }

  /**
   * Generar link compartible público
   */
  static async generateShareLink(documentId, options = {}) {
    const {
      expires_in_days = 30,
      password
    } = options;

    // Generar token único
    const shareToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expires_in_days);

    // Hash de contraseña si se proporciona
    const passwordHash = password
      ? crypto.createHash('sha256').update(password).digest('hex')
      : null;

    const query = `
      UPDATE documents
      SET
        share_token = $2,
        share_token_expires_at = $3,
        share_password_hash = $4
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING share_token, share_token_expires_at
    `;

    const result = await pool.query(query, [
      documentId,
      shareToken,
      expiresAt,
      passwordHash
    ]);

    if (result.rowCount === 0) {
      throw new Error('Document not found');
    }

    logger.info('Share link generated:', { documentId, shareToken });

    return {
      share_token: result.rows[0].share_token,
      expires_at: result.rows[0].share_token_expires_at,
      share_url: `/api/documents/shared/${shareToken}`
    };
  }

  /**
   * Validar y obtener documento por share token
   */
  static async getByShareToken(shareToken, password = null) {
    const query = `
      SELECT *
      FROM documents
      WHERE share_token = $1
        AND deleted_at IS NULL
        AND status = 'active'
        AND (share_token_expires_at IS NULL OR share_token_expires_at > NOW())
    `;

    const result = await pool.query(query, [shareToken]);

    if (result.rowCount === 0) {
      throw new Error('Invalid or expired share link');
    }

    const document = result.rows[0];

    // Verificar contraseña si está protegido
    if (document.share_password_hash) {
      if (!password) {
        throw new Error('Password required');
      }

      const providedHash = crypto.createHash('sha256').update(password).digest('hex');

      if (providedHash !== document.share_password_hash) {
        throw new Error('Invalid password');
      }
    }

    return document;
  }

  /**
   * Revocar link compartible
   */
  static async revokeShareLink(documentId) {
    const query = `
      UPDATE documents
      SET share_token = NULL, share_token_expires_at = NULL, share_password_hash = NULL
      WHERE id = $1
      RETURNING id
    `;

    const result = await pool.query(query, [documentId]);
    return result.rowCount > 0;
  }

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * BÚSQUEDA Y TAGS
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */

  /**
   * Búsqueda full-text
   */
  static async search(searchQuery, filters = {}) {
    const { page = 1, limit = 20, category, agency_id } = filters;
    const offset = (page - 1) * limit;

    const conditions = ['d.deleted_at IS NULL'];
    const values = [searchQuery];
    let paramIndex = 2;

    conditions.push(`d.search_vector @@ plainto_tsquery('spanish', $1)`);

    if (category) {
      conditions.push(`d.category = $${paramIndex++}`);
      values.push(category);
    }

    if (agency_id) {
      conditions.push(`d.agency_id = $${paramIndex++}`);
      values.push(agency_id);
    }

    const query = `
      SELECT
        d.*,
        ts_rank(d.search_vector, plainto_tsquery('spanish', $1)) as rank,
        pg_size_pretty(d.file_size) as file_size_human
      FROM documents d
      WHERE ${conditions.join(' AND ')}
      ORDER BY rank DESC, d.uploaded_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Obtener tags populares
   */
  static async getPopularTags(limit = 20, agencyId = null) {
    const query = agencyId
      ? `
        SELECT name, category, usage_count
        FROM document_tags
        WHERE (agency_id = $1 OR agency_id IS NULL)
        ORDER BY usage_count DESC, name ASC
        LIMIT $2
      `
      : `
        SELECT name, category, usage_count
        FROM document_tags
        ORDER BY usage_count DESC, name ASC
        LIMIT $1
      `;

    const values = agencyId ? [agencyId, limit] : [limit];
    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Actualizar contador de uso de tags
   */
  static async updateTagUsageCount(tags) {
    if (!tags || tags.length === 0) return;

    const query = `
      INSERT INTO document_tags (name, usage_count)
      VALUES ${tags.map((_, i) => `($${i + 1}, 1)`).join(', ')}
      ON CONFLICT (name) DO UPDATE
      SET usage_count = document_tags.usage_count + 1
    `;

    await pool.query(query, tags);
  }

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * ACCESS LOGS Y AUDITORÍA
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */

  /**
   * Registrar acceso al documento
   */
  static async logAccess(documentId, accessData) {
    const {
      accessed_by,
      access_type,
      ip_address,
      user_agent,
      share_token,
      access_granted = true,
      denial_reason
    } = accessData;

    const query = `
      INSERT INTO document_access_logs (
        document_id, accessed_by, access_type, ip_address, user_agent,
        share_token, access_granted, denial_reason
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;

    const values = [
      documentId,
      accessed_by || null,
      access_type,
      ip_address || null,
      user_agent || null,
      share_token || null,
      access_granted,
      denial_reason || null
    ];

    await pool.query(query, values);
  }

  /**
   * Obtener logs de acceso
   */
  static async getAccessLogs(documentId, options = {}) {
    const { limit = 50, offset = 0 } = options;

    const query = `
      SELECT
        dal.*,
        u.name as user_name
      FROM document_access_logs dal
      LEFT JOIN users u ON dal.accessed_by = u.id
      WHERE dal.document_id = $1
      ORDER BY dal.accessed_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [documentId, limit, offset]);
    return result.rows;
  }

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * ESTADÍSTICAS
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */

  /**
   * Obtener estadísticas generales de documentos
   */
  static async getStats(agencyId = null) {
    const whereClause = agencyId ? 'AND agency_id = $1' : '';
    const values = agencyId ? [agencyId] : [];

    const query = `
      SELECT
        COUNT(*) as total_documents,
        SUM(file_size) as total_size_bytes,
        pg_size_pretty(SUM(file_size)) as total_size_human,
        COUNT(DISTINCT category) as categories_count,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
        COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_count,
        AVG(version) as avg_version,
        (
          SELECT COUNT(*)
          FROM document_access_logs dal
          JOIN documents d ON dal.document_id = d.id
          WHERE dal.accessed_at > NOW() - INTERVAL '30 days'
            AND d.deleted_at IS NULL
            ${whereClause}
        ) as accesses_last_30_days
      FROM documents
      WHERE deleted_at IS NULL ${whereClause}
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Obtener documentos recientes
   */
  static async getRecent(limit = 10, agencyId = null) {
    const whereClause = agencyId ? 'AND agency_id = $2' : '';
    const values = agencyId ? [limit, agencyId] : [limit];

    const query = `
      SELECT
        d.*,
        pg_size_pretty(d.file_size) as file_size_human,
        u.name as owner_name
      FROM documents d
      LEFT JOIN users u ON d.owner_id = u.id
      WHERE d.deleted_at IS NULL ${whereClause}
      ORDER BY d.uploaded_at DESC
      LIMIT $1
    `;

    const result = await pool.query(query, values);
    return result.rows;
  }
}

export default Document;
