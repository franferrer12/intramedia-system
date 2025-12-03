/**
 * Google Calendar Sync Service
 * Sprint 5.2 - Bidirectional Synchronization
 */

import pool from '../config/database.js';
import logger from '../utils/logger.js';
import googleCalendarService from './googleCalendarService.js';

class GoogleCalendarSyncService {
  /**
   * Start sync operation
   */
  async startSync(connectionId, direction = 'bidirectional', triggeredBy = 'manual', userId = null) {
    try {
      // Create sync log entry
      const logResult = await pool.query(
        `INSERT INTO google_calendar_sync_log (
          connection_id, agency_id, sync_direction,
          status, triggered_by, triggered_by_user_id
        )
        SELECT $1, agency_id, $2, 'syncing', $3, $4
        FROM google_calendar_connections
        WHERE id = $1
        RETURNING *`,
        [connectionId, direction, triggeredBy, userId]
      );

      const syncLog = logResult.rows[0];

      logger.info('Starting sync:', {
        connectionId,
        syncLogId: syncLog.id,
        direction,
      });

      return syncLog.id;
    } catch (error) {
      logger.error('Error starting sync:', error);
      throw error;
    }
  }

  /**
   * Complete sync operation
   */
  async completeSync(syncLogId, stats = {}, error = null) {
    try {
      const status = error ? 'failed' : 'completed';

      await pool.query(
        `UPDATE google_calendar_sync_log
         SET sync_completed_at = NOW(),
             status = $2,
             events_imported = $3,
             events_exported = $4,
             events_updated = $5,
             events_deleted = $6,
             events_skipped = $7,
             conflicts_detected = $8,
             error_message = $9
         WHERE id = $1`,
        [
          syncLogId,
          status,
          stats.imported || 0,
          stats.exported || 0,
          stats.updated || 0,
          stats.deleted || 0,
          stats.skipped || 0,
          stats.conflicts || 0,
          error?.message || null,
        ]
      );

      // Update connection's last sync status
      await pool.query(
        `UPDATE google_calendar_connections
         SET last_sync_at = NOW(),
             last_sync_status = $2,
             error_count = CASE WHEN $3 THEN error_count + 1 ELSE 0 END,
             error_message = $4
         WHERE id = (
           SELECT connection_id FROM google_calendar_sync_log WHERE id = $1
         )`,
        [syncLogId, status, error !== null, error?.message || null]
      );

      logger.info('Sync completed:', { syncLogId, status, stats });
    } catch (err) {
      logger.error('Error completing sync:', err);
    }
  }

  /**
   * Sync events for a connection
   */
  async syncConnection(connectionId, direction = 'bidirectional', userId = null) {
    const syncLogId = await this.startSync(connectionId, direction, 'manual', userId);

    const stats = {
      imported: 0,
      exported: 0,
      updated: 0,
      deleted: 0,
      skipped: 0,
      conflicts: 0,
    };

    try {
      // Validate and refresh connection
      const connection = await googleCalendarService.validateAndRefreshConnection(connectionId);

      // Import from Google
      if (direction === 'import' || direction === 'bidirectional') {
        const importStats = await this.importFromGoogle(connection);
        stats.imported = importStats.imported;
        stats.conflicts += importStats.conflicts;
      }

      // Export to Google
      if (direction === 'export' || direction === 'bidirectional') {
        const exportStats = await this.exportToGoogle(connection);
        stats.exported = exportStats.exported;
        stats.updated = exportStats.updated;
        stats.conflicts += exportStats.conflicts;
      }

      await this.completeSync(syncLogId, stats);

      return { success: true, stats, syncLogId };
    } catch (error) {
      logger.error('Sync error:', error);
      await this.completeSync(syncLogId, stats, error);
      throw error;
    }
  }

  /**
   * Import events from Google Calendar
   */
  async importFromGoogle(connection) {
    const stats = { imported: 0, conflicts: 0 };

    try {
      logger.info('Importing events from Google:', connection.google_email);

      // Get last sync time for incremental sync
      const lastSyncDate = connection.last_sync_at
        ? new Date(connection.last_sync_at)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

      // Get events from Google
      const googleEvents = await googleCalendarService.listEvents(connection.calendar_id, {
        timeMin: lastSyncDate.toISOString(),
        maxResults: 250,
      });

      logger.info(`Found ${googleEvents.length} events in Google Calendar`);

      for (const googleEvent of googleEvents) {
        try {
          await this.importSingleEvent(connection, googleEvent);
          stats.imported++;
        } catch (error) {
          logger.error('Error importing event:', googleEvent.id, error);
          stats.conflicts++;
        }
      }

      return stats;
    } catch (error) {
      logger.error('Error in importFromGoogle:', error);
      throw error;
    }
  }

  /**
   * Import single event from Google
   */
  async importSingleEvent(connection, googleEvent) {
    // Check if event already exists
    const mappingResult = await pool.query(
      `SELECT * FROM event_calendar_mappings
       WHERE connection_id = $1
         AND google_event_id = $2
         AND deleted_at IS NULL`,
      [connection.id, googleEvent.id]
    );

    if (mappingResult.rows.length > 0) {
      // Event exists, check for conflicts
      const mapping = mappingResult.rows[0];
      await this.checkAndUpdateEvent(connection, mapping, googleEvent);
    } else {
      // New event, create in local database
      await this.createEventFromGoogle(connection, googleEvent);
    }
  }

  /**
   * Create local event from Google event
   */
  async createEventFromGoogle(connection, googleEvent) {
    const eventoData = googleCalendarService.convertGoogleEventToEvento(
      googleEvent,
      connection.agency_id
    );

    // Insert evento
    const eventoResult = await pool.query(
      `INSERT INTO events (
        agency_id, evento, fecha, ubicacion, descripcion,
        duracion_minutos, tipo_evento, estado, asistentes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        eventoData.agency_id,
        eventoData.evento,
        eventoData.fecha,
        eventoData.ubicacion,
        eventoData.descripcion,
        eventoData.duracion_minutos,
        eventoData.tipo_evento,
        eventoData.estado,
        eventoData.asistentes,
      ]
    );

    const evento = eventoResult.rows[0];

    // Create mapping
    await pool.query(
      `INSERT INTO event_calendar_mappings (
        evento_id, agency_id, connection_id,
        google_event_id, google_calendar_id,
        sync_direction, last_modified_google
      )
      VALUES ($1, $2, $3, $4, $5, 'import', $6)`,
      [
        evento.id,
        connection.agency_id,
        connection.id,
        googleEvent.id,
        connection.calendar_id,
        googleEvent.updated,
      ]
    );

    logger.info('Created event from Google:', {
      eventoId: evento.id,
      googleEventId: googleEvent.id,
    });
  }

  /**
   * Check for conflicts and update event
   */
  async checkAndUpdateEvent(connection, mapping, googleEvent) {
    // Get local event
    const eventoResult = await pool.query(
      'SELECT * FROM events WHERE id = $1 AND deleted_at IS NULL',
      [mapping.evento_id]
    );

    if (eventoResult.rows.length === 0) {
      // Local event was deleted, handle conflict
      await this.handleDeletedLocalEvent(connection, mapping, googleEvent);
      return;
    }

    const evento = eventoResult.rows[0];

    // Compare timestamps
    const localModified = new Date(evento.updated_at || evento.created_at);
    const googleModified = new Date(googleEvent.updated);
    const lastSyncGoogle = new Date(mapping.last_modified_google || 0);

    // If Google event was modified after last sync
    if (googleModified > lastSyncGoogle) {
      // Check if local was also modified after last sync
      const lastSyncLocal = new Date(mapping.last_modified_local || 0);

      if (localModified > lastSyncLocal) {
        // Both modified - conflict!
        await this.createConflict(connection, mapping, evento, googleEvent, 'data_mismatch');
      } else {
        // Only Google modified - update local
        await this.updateLocalFromGoogle(connection, mapping, evento, googleEvent);
      }
    }
  }

  /**
   * Update local event from Google
   */
  async updateLocalFromGoogle(connection, mapping, evento, googleEvent) {
    const eventoData = googleCalendarService.convertGoogleEventToEvento(
      googleEvent,
      connection.agency_id
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
        evento.id,
        eventoData.evento,
        eventoData.fecha,
        eventoData.ubicacion,
        eventoData.descripcion,
        eventoData.duracion_minutos,
      ]
    );

    // Update mapping
    await pool.query(
      `UPDATE event_calendar_mappings
       SET last_modified_google = $2,
           synced_at = NOW()
       WHERE id = $1`,
      [mapping.id, googleEvent.updated]
    );

    logger.info('Updated local event from Google:', evento.id);
  }

  /**
   * Export events to Google Calendar
   */
  async exportToGoogle(connection) {
    const stats = { exported: 0, updated: 0, conflicts: 0 };

    try {
      logger.info('Exporting events to Google:', connection.google_email);

      // Get local events that need syncing
      const lastSyncDate = connection.last_sync_at
        ? new Date(connection.last_sync_at)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const eventosResult = await pool.query(
        `SELECT e.*
         FROM events e
         WHERE e.agency_id = $1
           AND e.deleted_at IS NULL
           AND e.fecha >= $2
           AND NOT EXISTS (
             SELECT 1 FROM event_calendar_mappings m
             WHERE m.evento_id = e.id
               AND m.connection_id = $3
               AND m.deleted_at IS NULL
           )
         ORDER BY e.fecha`,
        [connection.agency_id, lastSyncDate, connection.id]
      );

      logger.info(`Found ${eventosResult.rows.length} events to export`);

      for (const evento of eventosResult.rows) {
        try {
          await this.exportSingleEvent(connection, evento);
          stats.exported++;
        } catch (error) {
          logger.error('Error exporting event:', evento.id, error);
          stats.conflicts++;
        }
      }

      // Update existing mappings
      const mappingsResult = await pool.query(
        `SELECT m.*, e.*
         FROM event_calendar_mappings m
         INNER JOIN events e ON m.evento_id = e.id
         WHERE m.connection_id = $1
           AND m.deleted_at IS NULL
           AND e.deleted_at IS NULL
           AND e.updated_at > m.last_modified_local`,
        [connection.id]
      );

      for (const row of mappingsResult.rows) {
        try {
          await this.updateGoogleEvent(connection, row);
          stats.updated++;
        } catch (error) {
          logger.error('Error updating Google event:', row.google_event_id, error);
          stats.conflicts++;
        }
      }

      return stats;
    } catch (error) {
      logger.error('Error in exportToGoogle:', error);
      throw error;
    }
  }

  /**
   * Export single event to Google
   */
  async exportSingleEvent(connection, evento) {
    const googleEventData = googleCalendarService.convertEventoToGoogleEvent(evento);

    // Check for time conflicts
    if (evento.dj_id) {
      const conflicts = await googleCalendarService.checkEventConflicts(
        evento.dj_id,
        evento.fecha,
        evento.duracion_minutos,
        evento.id
      );

      if (conflicts.length > 0) {
        logger.warn('Time conflict detected for evento:', evento.id, conflicts);
        // Still export, but mark with conflict
      }
    }

    // Create event in Google
    const googleEvent = await googleCalendarService.createEvent(
      connection.calendar_id,
      googleEventData
    );

    // Create mapping
    await pool.query(
      `INSERT INTO event_calendar_mappings (
        evento_id, agency_id, connection_id,
        google_event_id, google_calendar_id,
        sync_direction, last_modified_local, last_modified_google
      )
      VALUES ($1, $2, $3, $4, $5, 'export', $6, $7)`,
      [
        evento.id,
        connection.agency_id,
        connection.id,
        googleEvent.id,
        connection.calendar_id,
        evento.updated_at || evento.created_at,
        googleEvent.updated,
      ]
    );

    logger.info('Exported event to Google:', {
      eventoId: evento.id,
      googleEventId: googleEvent.id,
    });
  }

  /**
   * Update event in Google Calendar
   */
  async updateGoogleEvent(connection, mapping) {
    const googleEventData = googleCalendarService.convertEventoToGoogleEvent(mapping);

    const googleEvent = await googleCalendarService.updateEvent(
      connection.calendar_id,
      mapping.google_event_id,
      googleEventData
    );

    // Update mapping
    await pool.query(
      `UPDATE event_calendar_mappings
       SET last_modified_local = $2,
           last_modified_google = $3,
           synced_at = NOW()
       WHERE id = $1`,
      [mapping.id, mapping.updated_at, googleEvent.updated]
    );

    logger.info('Updated Google event:', mapping.google_event_id);
  }

  /**
   * Create conflict record
   */
  async createConflict(connection, mapping, evento, googleEvent, conflictType) {
    await pool.query(
      `INSERT INTO calendar_conflicts (
        mapping_id, connection_id, evento_id, agency_id,
        conflict_type, conflict_reason,
        local_data, google_data
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT DO NOTHING`,
      [
        mapping.id,
        connection.id,
        evento.id,
        connection.agency_id,
        conflictType,
        'Both local and Google events were modified since last sync',
        JSON.stringify(evento),
        JSON.stringify(googleEvent),
      ]
    );

    // Mark mapping as conflicted
    await pool.query(
      `UPDATE event_calendar_mappings
       SET has_conflict = true,
           conflict_reason = $2,
           conflict_detected_at = NOW()
       WHERE id = $1`,
      [mapping.id, 'Data mismatch detected during sync']
    );

    logger.warn('Created conflict record for evento:', evento.id);
  }

  /**
   * Handle deleted local event
   */
  async handleDeletedLocalEvent(connection, mapping, googleEvent) {
    await this.createConflict(
      connection,
      mapping,
      { id: mapping.evento_id, deleted: true },
      googleEvent,
      'deleted_local'
    );
  }

  /**
   * Sync all active connections
   */
  async syncAllConnections() {
    try {
      const result = await pool.query(
        'SELECT * FROM get_connections_needing_sync()'
      );

      logger.info(`Found ${result.rows.length} connections needing sync`);

      for (const row of result.rows) {
        try {
          await this.syncConnection(row.connection_id, 'bidirectional', null);
        } catch (error) {
          logger.error('Error syncing connection:', row.connection_id, error);
        }
      }
    } catch (error) {
      logger.error('Error in syncAllConnections:', error);
      throw error;
    }
  }
}

export default new GoogleCalendarSyncService();
