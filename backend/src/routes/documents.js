/**
 * Documents Routes
 * Sprint 4.3 - Document Management System
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { mkdir } from 'fs/promises';
import {
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
} from '../controllers/documentsController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission, requireAdminOrManager } from '../middleware/authorization.js';
import { validate, field } from '../middleware/validation.js';
import { createRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MULTER CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Configuración de storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // Organizar por agencia y fecha
    const agencyId = req.user?.agency_id || req.agency?.id || 'default';
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    const uploadPath = path.join(
      process.cwd(),
      'uploads',
      'documents',
      String(agencyId),
      String(year),
      month
    );

    try {
      await mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generar nombre único: timestamp-random-originalname
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50);

    const filename = `${timestamp}-${random}-${basename}${ext}`;
    cb(null, filename);
  }
});

// Filtro de tipos de archivo
const fileFilter = (req, file, cb) => {
  // Tipos permitidos
  const allowedMimes = [
    // Documentos
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    // Imágenes
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Audio
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    // Video
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    // Archivos comprimidos
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
  }
};

// Configuración de multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB máximo
    files: 1 // 1 archivo por request (para múltiples archivos usar endpoint separado)
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS PÚBLICAS (sin autenticación)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/documents/shared/:token
 * Acceder a documento compartido públicamente
 */
router.get('/shared/:token',
  validate([
    field('token', 'params').required().length(64, 64)
  ]),
  getSharedDocument
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MIDDLEWARE DE AUTENTICACIÓN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.use(authenticate);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS DE BÚSQUEDA Y ESTADÍSTICAS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/documents/search
 * Búsqueda full-text de documentos
 */
router.get('/search',
  requirePermission('documents', 'read'),
  validate([
    field('q').required().minLength(2),
    field('category').optional(),
    field('page').optional().numeric().positive(),
    field('limit').optional().numeric().positive().max(100)
  ]),
  searchDocuments
);

/**
 * GET /api/documents/stats
 * Estadísticas generales de documentos
 */
router.get('/stats',
  requirePermission('documents', 'read'),
  getStats
);

/**
 * GET /api/documents/recent
 * Documentos recientes
 */
router.get('/recent',
  requirePermission('documents', 'read'),
  validate([
    field('limit').optional().numeric().positive().max(50)
  ]),
  getRecentDocuments
);

/**
 * GET /api/documents/tags
 * Tags populares
 */
router.get('/tags',
  requirePermission('documents', 'read'),
  validate([
    field('limit').optional().numeric().positive().max(100)
  ]),
  getPopularTags
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS DE SHARES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * DELETE /api/documents/shares/:shareId
 * Remover acceso compartido
 */
router.delete('/shares/:shareId',
  requirePermission('documents', 'share'),
  validate([
    field('shareId', 'params').required().numeric().positive()
  ]),
  unshareDocument
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS CRUD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/documents
 * Obtener todos los documentos con filtros
 */
router.get('/',
  requirePermission('documents', 'read'),
  validate([
    field('page').optional().numeric().positive(),
    field('limit').optional().numeric().positive().max(100),
    field('category').optional(),
    field('status').optional().oneOf(['active', 'archived', 'deleted', 'processing']),
    field('owner_id').optional().numeric().positive(),
    field('related_to_type').optional(),
    field('related_to_id').optional().numeric().positive(),
    field('tags').optional(),
    field('search').optional()
  ]),
  getAllDocuments
);

/**
 * POST /api/documents
 * Subir nuevo documento
 */
router.post('/',
  requirePermission('documents', 'create'),
  createRateLimit,
  upload.single('file'),
  validate([
    field('title').optional().maxLength(255),
    field('description').optional(),
    field('category').optional().oneOf(['contract', 'invoice', 'receipt', 'agreement', 'legal', 'technical', 'marketing', 'rider', 'payment_proof', 'identification', 'license', 'insurance', 'other']),
    field('tags').optional(),
    field('related_to_type').optional(),
    field('related_to_id').optional().numeric().positive(),
    field('access_level').optional().oneOf(['private', 'restricted', 'team', 'public'])
  ]),
  uploadDocument
);

/**
 * GET /api/documents/:id
 * Obtener documento por ID
 */
router.get('/:id',
  requirePermission('documents', 'read'),
  validate([
    field('id', 'params').required().numeric().positive()
  ]),
  getDocumentById
);

/**
 * PUT /api/documents/:id
 * Actualizar documento
 */
router.put('/:id',
  requirePermission('documents', 'update'),
  validate([
    field('id', 'params').required().numeric().positive(),
    field('title').optional().maxLength(255),
    field('description').optional(),
    field('category').optional().oneOf(['contract', 'invoice', 'receipt', 'agreement', 'legal', 'technical', 'marketing', 'rider', 'payment_proof', 'identification', 'license', 'insurance', 'other']),
    field('tags').optional(),
    field('access_level').optional().oneOf(['private', 'restricted', 'team', 'public']),
    field('status').optional().oneOf(['active', 'archived', 'deleted', 'processing'])
  ]),
  updateDocument
);

/**
 * DELETE /api/documents/:id
 * Eliminar documento (soft delete)
 */
router.delete('/:id',
  requirePermission('documents', 'delete'),
  validate([
    field('id', 'params').required().numeric().positive()
  ]),
  deleteDocument
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS DE DESCARGA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/documents/:id/download
 * Descargar documento
 */
router.get('/:id/download',
  requirePermission('documents', 'read'),
  validate([
    field('id', 'params').required().numeric().positive()
  ]),
  downloadDocument
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS DE VERSIONADO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/documents/:id/versions
 * Obtener historial de versiones
 */
router.get('/:id/versions',
  requirePermission('documents', 'read'),
  validate([
    field('id', 'params').required().numeric().positive()
  ]),
  getVersionHistory
);

/**
 * POST /api/documents/:id/versions
 * Crear nueva versión
 */
router.post('/:id/versions',
  requirePermission('documents', 'update'),
  upload.single('file'),
  validate([
    field('id', 'params').required().numeric().positive(),
    field('change_description').optional()
  ]),
  createDocumentVersion
);

/**
 * POST /api/documents/:id/versions/:version/rollback
 * Rollback a versión anterior
 */
router.post('/:id/versions/:version/rollback',
  requirePermission('documents', 'update'),
  validate([
    field('id', 'params').required().numeric().positive(),
    field('version', 'params').required().numeric().positive()
  ]),
  rollbackVersion
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS DE COMPARTICIÓN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/documents/:id/shares
 * Obtener shares de un documento
 */
router.get('/:id/shares',
  requirePermission('documents', 'read'),
  validate([
    field('id', 'params').required().numeric().positive()
  ]),
  getDocumentShares
);

/**
 * POST /api/documents/:id/share
 * Compartir documento con usuario/rol
 */
router.post('/:id/share',
  requirePermission('documents', 'share'),
  validate([
    field('id', 'params').required().numeric().positive(),
    field('shared_with_user_id').optional().numeric().positive(),
    field('shared_with_role_id').optional().numeric().positive(),
    field('shared_with_email').optional().email(),
    field('can_view').optional().boolean(),
    field('can_download').optional().boolean(),
    field('can_edit').optional().boolean(),
    field('can_share').optional().boolean(),
    field('expires_at').optional()
  ]),
  shareDocument
);

/**
 * POST /api/documents/:id/share-link
 * Generar link público compartible
 */
router.post('/:id/share-link',
  requirePermission('documents', 'share'),
  validate([
    field('id', 'params').required().numeric().positive(),
    field('expires_in_days').optional().numeric().positive().max(365),
    field('password').optional().minLength(6)
  ]),
  generateShareLink
);

/**
 * DELETE /api/documents/:id/share-link
 * Revocar link compartible
 */
router.delete('/:id/share-link',
  requirePermission('documents', 'share'),
  validate([
    field('id', 'params').required().numeric().positive()
  ]),
  revokeShareLink
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS DE AUDITORÍA (solo admin/manager)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/documents/:id/logs
 * Obtener logs de acceso
 */
router.get('/:id/logs',
  requireAdminOrManager,
  validate([
    field('id', 'params').required().numeric().positive(),
    field('limit').optional().numeric().positive().max(200),
    field('offset').optional().numeric().min(0)
  ]),
  getAccessLogs
);

export default router;
