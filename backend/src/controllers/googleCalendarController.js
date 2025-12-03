/**
 * Google Calendar Controller
 * Sprint 5.2 - Google Calendar Integration
 */

import pool from '../config/database.js';
import logger from '../utils/logger.js';
import googleCalendarService from '../services/googleCalendarService.js';
import googleCalendarSyncService from '../services/googleCalendarSyncService.js';

/**
 * Get OAuth authorization URL
 */
export const getAuthUrl = async (req, res) => {
  try {
    const userId = req.user.id;
    const agencyId = req.user.agency_id || req.agency?.id;

    const state = {
      userId,
      agencyId,
      timestamp: Date.now(),
    };

    const authUrl = googleCalendarService.getAuthUrl(state);

    res.json({
      success: true,
      data: { authUrl },
    });
  } catch (error) {
    logger.error('Error getting auth URL:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Handle OAuth callback
 */
export const handleOAuthCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code is required',
      });
    }

    // Parse state
    const stateData = JSON.parse(state || '{}');
    const { userId, agencyId } = stateData;

    // Exchange code for tokens
    const tokens = await googleCalendarService.getTokensFromCode(code);

    // Set credentials to get calendar info
    googleCalendarService.setCredentials(tokens.access_token, tokens.refresh_token);

    // Get primary calendar info
    const calendar = await googleCalendarService.getPrimaryCalendar();

    // Store connection in database
    const connection = await createConnection({
      agencyId,
      userId,
      tokens,
      calendar,
    });

    // Redirect to frontend success page
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?calendar_connected=true`;
    res.redirect(redirectUrl);
  } catch (error) {
    logger.error('Error in OAuth callback:', error);
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?calendar_error=${encodeURIComponent(error.message)}`;
    res.redirect(redirectUrl);
  }
};

/**
 * Create calendar connection
 */
async function createConnection({ agencyId, userId, tokens, calendar }) {
  const result = await pool.query(
    `INSERT INTO google_calendar_connections (
      agency_id, user_id, google_email,
      access_token, refresh_token, token_expiry,
      calendar_id, calendar_name, calendar_timezone,
      scopes, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (agency_id, calendar_id)
    DO UPDATE SET
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      token_expiry = EXCLUDED.token_expiry,
      status = 'active',
      error_count = 0,
      error_message = NULL,
      updated_at = NOW()
    RETURNING *`,
    [
      agencyId,
      userId,
      calendar.id,
      tokens.access_token,
      tokens.refresh_token,
      new Date(tokens.expiry_date),
      calendar.id,
      calendar.summary || 'Primary Calendar',
      calendar.timeZone || 'Europe/Madrid',
      JSON.stringify(tokens.scope?.split(' ') || []),
      userId,
    ]
  );

  return result.rows[0];
}

/**
 * Get all connections for agency
 */
export const getConnections = async (req, res) => {
  try {
    const agencyId = req.user.agency_id || req.agency?.id;

    const result = await pool.query(
      `SELECT * FROM active_calendar_connections
       WHERE agency_id = $1
       ORDER BY created_at DESC`,
      [agencyId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    logger.error('Error getting connections:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get connection by ID
 */
export const getConnectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const agencyId = req.user.agency_id || req.agency?.id;

    const result = await pool.query(
      `SELECT * FROM active_calendar_connections
       WHERE id = $1 AND agency_id = $2`,
      [id, agencyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error getting connection:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Update connection settings
 */
export const updateConnection = async (req, res) => {
  try {
    const { id } = req.params;
    const agencyId = req.user.agency_id || req.agency?.id;
    const {
      sync_enabled,
      sync_direction,
      auto_sync,
      sync_interval_minutes,
    } = req.body;

    const result = await pool.query(
      `UPDATE google_calendar_connections
       SET sync_enabled = COALESCE($3, sync_enabled),
           sync_direction = COALESCE($4, sync_direction),
           auto_sync = COALESCE($5, auto_sync),
           sync_interval_minutes = COALESCE($6, sync_interval_minutes),
           updated_at = NOW()
       WHERE id = $1 AND agency_id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [id, agencyId, sync_enabled, sync_direction, auto_sync, sync_interval_minutes]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Connection settings updated successfully',
    });
  } catch (error) {
    logger.error('Error updating connection:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Delete connection
 */
export const deleteConnection = async (req, res) => {
  try {
    const { id } = req.params;
    const agencyId = req.user.agency_id || req.agency?.id;

    const result = await pool.query(
      `UPDATE google_calendar_connections
       SET deleted_at = NOW(),
           status = 'revoked'
       WHERE id = $1 AND agency_id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [id, agencyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found',
      });
    }

    res.json({
      success: true,
      message: 'Connection deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting connection:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Trigger manual sync
 */
export const triggerSync = async (req, res) => {
  try {
    const { id } = req.params;
    const { direction = 'bidirectional' } = req.body;
    const userId = req.user.id;

    // Validate connection belongs to user's agency
    const agencyId = req.user.agency_id || req.agency?.id;
    const connectionResult = await pool.query(
      `SELECT id FROM google_calendar_connections
       WHERE id = $1 AND agency_id = $2 AND deleted_at IS NULL`,
      [id, agencyId]
    );

    if (connectionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found',
      });
    }

    // Start sync in background
    const result = await googleCalendarSyncService.syncConnection(id, direction, userId);

    res.json({
      success: true,
      data: result,
      message: 'Sync completed successfully',
    });
  } catch (error) {
    logger.error('Error triggering sync:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get sync history
 */
export const getSyncHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const agencyId = req.user.agency_id || req.agency?.id;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT sl.*
       FROM google_calendar_sync_log sl
       INNER JOIN google_calendar_connections gc ON sl.connection_id = gc.id
       WHERE sl.connection_id = $1
         AND gc.agency_id = $2
         AND gc.deleted_at IS NULL
       ORDER BY sl.sync_started_at DESC
       LIMIT $3 OFFSET $4`,
      [id, agencyId, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    logger.error('Error getting sync history:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get sync statistics
 */
export const getSyncStats = async (req, res) => {
  try {
    const agencyId = req.user.agency_id || req.agency?.id;

    const result = await pool.query(
      `SELECT * FROM calendar_sync_stats
       WHERE agency_id = $1`,
      [agencyId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    logger.error('Error getting sync stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get pending conflicts
 */
export const getConflicts = async (req, res) => {
  try {
    const agencyId = req.user.agency_id || req.agency?.id;
    const { status = 'pending' } = req.query;

    const result = await pool.query(
      `SELECT * FROM pending_calendar_conflicts
       WHERE agency_id = $1
       ORDER BY detected_at DESC`,
      [agencyId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    logger.error('Error getting conflicts:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Resolve conflict
 */
export const resolveConflict = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution_strategy, resolution_notes } = req.body;
    const userId = req.user.id;
    const agencyId = req.user.agency_id || req.agency?.id;

    // Validate resolution strategy
    const validStrategies = ['local_wins', 'google_wins', 'merge', 'manual'];
    if (!validStrategies.includes(resolution_strategy)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid resolution strategy',
      });
    }

    // Update conflict
    const result = await pool.query(
      `UPDATE calendar_conflicts
       SET status = 'resolved',
           resolution_strategy = $2,
           resolved_by = $3,
           resolved_at = NOW(),
           resolution_notes = $4,
           updated_at = NOW()
       WHERE id = $1 AND agency_id = $5 AND status = 'pending'
       RETURNING *`,
      [id, resolution_strategy, userId, resolution_notes, agencyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Conflict not found or already resolved',
      });
    }

    const conflict = result.rows[0];

    // Update mapping to clear conflict flag
    if (conflict.mapping_id) {
      await pool.query(
        `UPDATE event_calendar_mappings
         SET has_conflict = false,
             conflict_resolved_at = NOW(),
             conflict_resolution_strategy = $2
         WHERE id = $1`,
        [conflict.mapping_id, resolution_strategy]
      );
    }

    // Apply resolution based on strategy
    await applyConflictResolution(conflict, resolution_strategy);

    res.json({
      success: true,
      data: conflict,
      message: 'Conflict resolved successfully',
    });
  } catch (error) {
    logger.error('Error resolving conflict:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Apply conflict resolution
 */
async function applyConflictResolution(conflict, strategy) {
  try {
    if (strategy === 'local_wins') {
      // Update Google event with local data
      const connection = await pool.query(
        'SELECT * FROM google_calendar_connections WHERE id = $1',
        [conflict.connection_id]
      );

      if (connection.rows.length > 0) {
        const conn = connection.rows[0];
        await googleCalendarService.validateAndRefreshConnection(conn.id);

        const evento = conflict.local_data;
        const googleEventData = googleCalendarService.convertEventoToGoogleEvent(evento);

        const mapping = await pool.query(
          'SELECT * FROM event_calendar_mappings WHERE evento_id = $1 AND connection_id = $2',
          [conflict.evento_id, conflict.connection_id]
        );

        if (mapping.rows.length > 0) {
          await googleCalendarService.updateEvent(
            conn.calendar_id,
            mapping.rows[0].google_event_id,
            googleEventData
          );
        }
      }
    } else if (strategy === 'google_wins') {
      // Update local event with Google data
      const googleData = conflict.google_data;
      const eventoData = googleCalendarService.convertGoogleEventToEvento(
        googleData,
        conflict.agency_id
      );

      await pool.query(
        `UPDATE events
         SET evento = $2,
             fecha = $3,
             ubicacion = $4,
             descripcion = $5,
             duracion_minutos = $6,
             updated_at = NOW()
         WHERE id = $1`,
        [
          conflict.evento_id,
          eventoData.evento,
          eventoData.fecha,
          eventoData.ubicacion,
          eventoData.descripcion,
          eventoData.duracion_minutos,
        ]
      );
    }
    // For 'merge' and 'manual', no automatic action is taken
  } catch (error) {
    logger.error('Error applying conflict resolution:', error);
    throw error;
  }
}

/**
 * Get event mappings
 */
export const getEventMappings = async (req, res) => {
  try {
    const agencyId = req.user.agency_id || req.agency?.id;
    const { connection_id, has_conflict } = req.query;

    let query = `
      SELECT m.*, e.evento, e.fecha, e.ubicacion
      FROM event_calendar_mappings m
      INNER JOIN events e ON m.evento_id = e.id
      WHERE m.agency_id = $1 AND m.deleted_at IS NULL
    `;
    const params = [agencyId];
    let paramIndex = 2;

    if (connection_id) {
      query += ` AND m.connection_id = $${paramIndex++}`;
      params.push(connection_id);
    }

    if (has_conflict !== undefined) {
      query += ` AND m.has_conflict = $${paramIndex++}`;
      params.push(has_conflict === 'true');
    }

    query += ' ORDER BY e.fecha DESC LIMIT 100';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    logger.error('Error getting event mappings:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Check event conflicts
 */
export const checkEventConflicts = async (req, res) => {
  try {
    const { dj_id, fecha, duracion_minutos, exclude_evento_id } = req.body;

    if (!dj_id || !fecha) {
      return res.status(400).json({
        success: false,
        error: 'DJ ID and fecha are required',
      });
    }

    const conflicts = await googleCalendarService.checkEventConflicts(
      dj_id,
      fecha,
      duracion_minutos || 240,
      exclude_evento_id
    );

    res.json({
      success: true,
      data: {
        has_conflicts: conflicts.length > 0,
        conflicts,
      },
    });
  } catch (error) {
    logger.error('Error checking conflicts:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
