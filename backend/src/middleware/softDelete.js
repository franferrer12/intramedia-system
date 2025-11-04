/**
 * Soft Delete Middleware & Utilities
 * Maneja borrado lógico en lugar de físico
 */

import db from '../config/database.js';

/**
 * Middleware para filtrar registros eliminados automáticamente
 * Añade WHERE deleted_at IS NULL a las queries
 */
export const excludeDeleted = (req, res, next) => {
  req.includeDeleted = req.query.includeDeleted === 'true';
  req.onlyDeleted = req.query.onlyDeleted === 'true';
  next();
};

/**
 * Construye condición de soft delete para queries
 * @param {Object} req - Request object
 * @returns {String} WHERE clause snippet
 */
export const getSoftDeleteCondition = (req) => {
  if (req.onlyDeleted) {
    return 'deleted_at IS NOT NULL';
  }
  if (req.includeDeleted) {
    return '1=1'; // No filter
  }
  return 'deleted_at IS NULL'; // Default: only active records
};

/**
 * Soft delete a record
 * @param {String} tableName - Name of the table
 * @param {Number} recordId - ID of the record
 * @returns {Promise<Boolean>} - Success status
 */
export const softDelete = async (tableName, recordId) => {
  try {
    const result = await db.query(
      `UPDATE ${tableName}
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [recordId]
    );

    return result.rowCount > 0;
  } catch (error) {
    console.error(`Error soft deleting from ${tableName}:`, error);
    throw error;
  }
};

/**
 * Restore a soft deleted record
 * @param {String} tableName - Name of the table
 * @param {Number} recordId - ID of the record
 * @returns {Promise<Boolean>} - Success status
 */
export const restoreSoftDelete = async (tableName, recordId) => {
  try {
    const result = await db.query(
      `UPDATE ${tableName}
       SET deleted_at = NULL
       WHERE id = $1 AND deleted_at IS NOT NULL
       RETURNING id`,
      [recordId]
    );

    return result.rowCount > 0;
  } catch (error) {
    console.error(`Error restoring ${tableName}:`, error);
    throw error;
  }
};

/**
 * Permanently delete a soft deleted record
 * @param {String} tableName - Name of the table
 * @param {Number} recordId - ID of the record
 * @returns {Promise<Boolean>} - Success status
 */
export const hardDelete = async (tableName, recordId) => {
  try {
    const result = await db.query(
      `DELETE FROM ${tableName}
       WHERE id = $1 AND deleted_at IS NOT NULL
       RETURNING id`,
      [recordId]
    );

    return result.rowCount > 0;
  } catch (error) {
    console.error(`Error hard deleting from ${tableName}:`, error);
    throw error;
  }
};

/**
 * Get soft deleted records count
 * @param {String} tableName - Name of the table
 * @returns {Promise<Number>} - Count of soft deleted records
 */
export const getSoftDeletedCount = async (tableName) => {
  try {
    const result = await db.query(
      `SELECT COUNT(*) FROM ${tableName} WHERE deleted_at IS NOT NULL`
    );

    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error(`Error counting soft deleted from ${tableName}:`, error);
    throw error;
  }
};

/**
 * Bulk soft delete
 * @param {String} tableName - Name of the table
 * @param {Array} recordIds - Array of record IDs
 * @returns {Promise<Number>} - Number of records deleted
 */
export const bulkSoftDelete = async (tableName, recordIds) => {
  try {
    if (!Array.isArray(recordIds) || recordIds.length === 0) {
      return 0;
    }

    const placeholders = recordIds.map((_, i) => `$${i + 1}`).join(',');
    const result = await db.query(
      `UPDATE ${tableName}
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE id IN (${placeholders}) AND deleted_at IS NULL
       RETURNING id`,
      recordIds
    );

    return result.rowCount;
  } catch (error) {
    console.error(`Error bulk soft deleting from ${tableName}:`, error);
    throw error;
  }
};

/**
 * Cleanup old soft deleted records (permanent delete after X days)
 * @param {String} tableName - Name of the table
 * @param {Number} daysOld - Delete records older than this many days
 * @returns {Promise<Number>} - Number of records permanently deleted
 */
export const cleanupOldDeleted = async (tableName, daysOld = 30) => {
  try {
    const result = await db.query(
      `DELETE FROM ${tableName}
       WHERE deleted_at IS NOT NULL
       AND deleted_at < NOW() - INTERVAL '${daysOld} days'
       RETURNING id`
    );

    return result.rowCount;
  } catch (error) {
    console.error(`Error cleaning up old deleted from ${tableName}:`, error);
    throw error;
  }
};

/**
 * Controller helper: Soft delete with response
 */
export const softDeleteController = (tableName, entityName = 'registro') => {
  return async (req, res) => {
    try {
      const { id } = req.params;

      const deleted = await softDelete(tableName, id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: `${entityName} no encontrado o ya eliminado`
        });
      }

      res.json({
        success: true,
        message: `${entityName} eliminado exitosamente`
      });
    } catch (error) {
      console.error(`Error deleting ${entityName}:`, error);
      res.status(500).json({
        success: false,
        error: `Error al eliminar ${entityName}`
      });
    }
  };
};

/**
 * Controller helper: Restore with response
 */
export const restoreController = (tableName, entityName = 'registro') => {
  return async (req, res) => {
    try {
      const { id } = req.params;

      const restored = await restoreSoftDelete(tableName, id);

      if (!restored) {
        return res.status(404).json({
          success: false,
          error: `${entityName} no encontrado o no está eliminado`
        });
      }

      res.json({
        success: true,
        message: `${entityName} restaurado exitosamente`
      });
    } catch (error) {
      console.error(`Error restoring ${entityName}:`, error);
      res.status(500).json({
        success: false,
        error: `Error al restaurar ${entityName}`
      });
    }
  };
};

export default {
  excludeDeleted,
  getSoftDeleteCondition,
  softDelete,
  restoreSoftDelete,
  hardDelete,
  getSoftDeletedCount,
  bulkSoftDelete,
  cleanupOldDeleted,
  softDeleteController,
  restoreController
};
