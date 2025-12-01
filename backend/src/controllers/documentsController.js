import Document from '../models/Document.js';
import logger from '../utils/logger.js';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

/**
 * Documents Controller
 * Sprint 4.3 - Document Management System
 *
 * Endpoints para gestión completa de documentos:
 * - Upload y almacenamiento
 * - Versionado con historial
 * - Permisos y sharing
 * - Búsqueda full-text
 * - Auditoría y logs
 */

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CRUD BÁSICO
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/**
 * Upload y crear documento
 * POST /api/documents
 */
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }

    const {
      title,
      description,
      category,
      tags,
      related_to_type,
      related_to_id,
      access_level
    } = req.body;

    const file = req.file;
    const userId = req.user.id;
    const agencyId = req.user.agency_id || req.agency?.id;

    // Generar hash del archivo
    const fileBuffer = await fs.readFile(file.path);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Datos del documento
    const documentData = {
      filename: file.filename,
      original_filename: file.originalname,
      title: title || file.originalname,
      description,
      category: category || 'other',
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',')) : [],
      file_path: file.path,
      file_url: `/uploads/${file.filename}`,
      mime_type: file.mimetype,
      file_size: file.size,
      file_hash: fileHash,
      storage_provider: 'local',
      metadata: {
        upload_ip: req.ip,
        user_agent: req.get('user-agent')
      },
      related_to_type,
      related_to_id,
      agency_id: agencyId,
      access_level: access_level || 'private',
      owner_id: userId,
      uploaded_by: userId
    };

    const document = await Document.create(documentData);

    // Log de creación
    await Document.logAccess(document.id, {
      accessed_by: userId,
      access_type: 'create',
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    logger.info('Document uploaded:', { documentId: document.id, userId });

    res.status(201).json({
      success: true,
      message: 'Documento subido exitosamente',
      data: document
    });
  } catch (error) {
    logger.error('Error uploading document:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir documento',
      error: error.message
    });
  }
};

/**
 * Obtener todos los documentos
 * GET /api/documents
 */
export const getAllDocuments = async (req, res) => {
  try {
    const filters = {
      ...req.query,
      agency_id: req.agency?.id || req.query.agency_id
    };

    const result = await Document.findAll(filters);

    res.json({
      success: true,
      data: result.documents,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Error getting documents:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener documentos',
      error: error.message
    });
  }
};

/**
 * Obtener documento por ID
 * GET /api/documents/:id
 */
export const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    // Verificar acceso
    const hasAccess = await Document.checkAccess(id, userId, 'view');

    if (!hasAccess) {
      await Document.logAccess(id, {
        accessed_by: userId,
        access_type: 'view',
        access_granted: false,
        denial_reason: 'Insufficient permissions'
      });

      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver este documento'
      });
    }

    // Log de acceso
    await Document.logAccess(id, {
      accessed_by: userId,
      access_type: 'view',
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    logger.error('Error getting document:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener documento',
      error: error.message
    });
  }
};

/**
 * Actualizar documento
 * PUT /api/documents/:id
 */
export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    // Verificar acceso de edición
    const hasAccess = await Document.checkAccess(id, userId, 'edit');

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar este documento'
      });
    }

    const document = await Document.update(id, updates);

    logger.info('Document updated:', { documentId: id, userId });

    res.json({
      success: true,
      message: 'Documento actualizado exitosamente',
      data: document
    });
  } catch (error) {
    logger.error('Error updating document:', error);

    if (error.message === 'Document not found') {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar documento',
      error: error.message
    });
  }
};

/**
 * Eliminar documento
 * DELETE /api/documents/:id
 */
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar acceso de eliminación (solo owner puede eliminar)
    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    if (document.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Solo el propietario puede eliminar este documento'
      });
    }

    const deleted = await Document.delete(id, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    logger.info('Document deleted:', { documentId: id, userId });

    res.json({
      success: true,
      message: 'Documento eliminado exitosamente'
    });
  } catch (error) {
    logger.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar documento',
      error: error.message
    });
  }
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * DOWNLOAD
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/**
 * Descargar documento
 * GET /api/documents/:id/download
 */
export const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    // Verificar acceso
    const hasAccess = await Document.checkAccess(id, userId, 'download');

    if (!hasAccess) {
      await Document.logAccess(id, {
        accessed_by: userId,
        access_type: 'download',
        access_granted: false,
        denial_reason: 'Insufficient permissions'
      });

      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para descargar este documento'
      });
    }

    // Log de descarga
    await Document.logAccess(id, {
      accessed_by: userId,
      access_type: 'download',
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    // Enviar archivo
    res.download(document.file_path, document.original_filename);
  } catch (error) {
    logger.error('Error downloading document:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descargar documento',
      error: error.message
    });
  }
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * VERSIONADO
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/**
 * Crear nueva versión de documento
 * POST /api/documents/:id/versions
 */
export const createDocumentVersion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }

    // Verificar acceso de edición
    const hasAccess = await Document.checkAccess(id, userId, 'edit');

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para crear versiones de este documento'
      });
    }

    const file = req.file;
    const { change_description } = req.body;

    const newVersion = await Document.createVersion(id, {
      file_path: file.path,
      file_size: file.size,
      change_description: change_description || 'Actualización del archivo'
    }, userId);

    logger.info('Document version created:', { documentId: id, version: newVersion, userId });

    res.status(201).json({
      success: true,
      message: 'Nueva versión creada exitosamente',
      data: { version: newVersion }
    });
  } catch (error) {
    logger.error('Error creating document version:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear versión',
      error: error.message
    });
  }
};

/**
 * Obtener historial de versiones
 * GET /api/documents/:id/versions
 */
export const getVersionHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar acceso
    const hasAccess = await Document.checkAccess(id, userId, 'view');

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver el historial de versiones'
      });
    }

    const versions = await Document.getVersionHistory(id);

    res.json({
      success: true,
      data: versions
    });
  } catch (error) {
    logger.error('Error getting version history:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de versiones',
      error: error.message
    });
  }
};

/**
 * Rollback a versión anterior
 * POST /api/documents/:id/versions/:version/rollback
 */
export const rollbackVersion = async (req, res) => {
  try {
    const { id, version } = req.params;
    const userId = req.user.id;

    // Verificar acceso de edición
    const hasAccess = await Document.checkAccess(id, userId, 'edit');

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para hacer rollback de versiones'
      });
    }

    const success = await Document.rollbackVersion(id, parseInt(version), userId);

    logger.info('Document rolled back:', { documentId: id, targetVersion: version, userId });

    res.json({
      success: true,
      message: `Documento revertido a versión ${version}`,
      data: { success }
    });
  } catch (error) {
    logger.error('Error rolling back version:', error);
    res.status(500).json({
      success: false,
      message: 'Error al revertir versión',
      error: error.message
    });
  }
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * PERMISOS Y SHARING
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/**
 * Compartir documento
 * POST /api/documents/:id/share
 */
export const shareDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const shareData = req.body;

    // Verificar acceso de compartir
    const hasAccess = await Document.checkAccess(id, userId, 'share');

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para compartir este documento'
      });
    }

    const share = await Document.share(id, shareData, userId);

    logger.info('Document shared:', { documentId: id, shareId: share.id, userId });

    res.status(201).json({
      success: true,
      message: 'Documento compartido exitosamente',
      data: share
    });
  } catch (error) {
    logger.error('Error sharing document:', error);
    res.status(500).json({
      success: false,
      message: 'Error al compartir documento',
      error: error.message
    });
  }
};

/**
 * Remover acceso compartido
 * DELETE /api/documents/shares/:shareId
 */
export const unshareDocument = async (req, res) => {
  try {
    const { shareId } = req.params;
    const userId = req.user.id;

    const success = await Document.unshare(shareId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Share no encontrado'
      });
    }

    logger.info('Document unshared:', { shareId, userId });

    res.json({
      success: true,
      message: 'Acceso removido exitosamente'
    });
  } catch (error) {
    logger.error('Error unsharing document:', error);
    res.status(500).json({
      success: false,
      message: 'Error al remover acceso',
      error: error.message
    });
  }
};

/**
 * Obtener shares de un documento
 * GET /api/documents/:id/shares
 */
export const getDocumentShares = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar acceso
    const hasAccess = await Document.checkAccess(id, userId, 'view');

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver los shares'
      });
    }

    const shares = await Document.getShares(id);

    res.json({
      success: true,
      data: shares
    });
  } catch (error) {
    logger.error('Error getting document shares:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener shares',
      error: error.message
    });
  }
};

/**
 * Generar link público compartible
 * POST /api/documents/:id/share-link
 */
export const generateShareLink = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { expires_in_days, password } = req.body;

    // Verificar que sea el owner
    const document = await Document.findById(id);

    if (!document || document.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Solo el propietario puede generar links públicos'
      });
    }

    const shareLink = await Document.generateShareLink(id, {
      expires_in_days,
      password
    });

    logger.info('Share link generated:', { documentId: id, userId });

    res.status(201).json({
      success: true,
      message: 'Link compartible generado',
      data: shareLink
    });
  } catch (error) {
    logger.error('Error generating share link:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar link',
      error: error.message
    });
  }
};

/**
 * Acceder a documento vía share link
 * GET /api/documents/shared/:token
 */
export const getSharedDocument = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.query;

    const document = await Document.getByShareToken(token, password);

    // Log de acceso público
    await Document.logAccess(document.id, {
      accessed_by: null,
      access_type: 'view',
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      share_token: token
    });

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    logger.error('Error accessing shared document:', error);

    if (error.message.includes('Invalid') || error.message.includes('expired')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message === 'Password required' || error.message === 'Invalid password') {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al acceder a documento compartido',
      error: error.message
    });
  }
};

/**
 * Revocar link compartible
 * DELETE /api/documents/:id/share-link
 */
export const revokeShareLink = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar que sea el owner
    const document = await Document.findById(id);

    if (!document || document.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Solo el propietario puede revocar links públicos'
      });
    }

    const success = await Document.revokeShareLink(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'No hay link activo para revocar'
      });
    }

    logger.info('Share link revoked:', { documentId: id, userId });

    res.json({
      success: true,
      message: 'Link compartible revocado'
    });
  } catch (error) {
    logger.error('Error revoking share link:', error);
    res.status(500).json({
      success: false,
      message: 'Error al revocar link',
      error: error.message
    });
  }
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * BÚSQUEDA
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/**
 * Búsqueda full-text
 * GET /api/documents/search
 */
export const searchDocuments = async (req, res) => {
  try {
    const { q, category, page, limit } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Parámetro de búsqueda "q" requerido'
      });
    }

    const agencyId = req.agency?.id;

    const results = await Document.search(q, {
      category,
      agency_id: agencyId,
      page,
      limit
    });

    res.json({
      success: true,
      data: results,
      query: q
    });
  } catch (error) {
    logger.error('Error searching documents:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar documentos',
      error: error.message
    });
  }
};

/**
 * Obtener tags populares
 * GET /api/documents/tags
 */
export const getPopularTags = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const agencyId = req.agency?.id;

    const tags = await Document.getPopularTags(parseInt(limit), agencyId);

    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    logger.error('Error getting popular tags:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tags',
      error: error.message
    });
  }
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ESTADÍSTICAS Y LOGS
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/**
 * Obtener estadísticas generales
 * GET /api/documents/stats
 */
export const getStats = async (req, res) => {
  try {
    const agencyId = req.agency?.id;
    const stats = await Document.getStats(agencyId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting document stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

/**
 * Obtener logs de acceso
 * GET /api/documents/:id/logs
 */
export const getAccessLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { limit, offset } = req.query;

    // Verificar que sea el owner o admin
    const document = await Document.findById(id);

    if (!document || document.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Solo el propietario puede ver los logs'
      });
    }

    const logs = await Document.getAccessLogs(id, { limit, offset });

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    logger.error('Error getting access logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener logs',
      error: error.message
    });
  }
};

/**
 * Obtener documentos recientes
 * GET /api/documents/recent
 */
export const getRecentDocuments = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const agencyId = req.agency?.id;

    const documents = await Document.getRecent(parseInt(limit), agencyId);

    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    logger.error('Error getting recent documents:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener documentos recientes',
      error: error.message
    });
  }
};

export default {
  uploadDocument,
  getAllDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  downloadDocument,
  createDocumentVersion,
  getVersionHistory,
  rollbackVersion,
  shareDocument,
  unshareDocument,
  getDocumentShares,
  generateShareLink,
  getSharedDocument,
  revokeShareLink,
  searchDocuments,
  getPopularTags,
  getStats,
  getAccessLogs,
  getRecentDocuments
};
