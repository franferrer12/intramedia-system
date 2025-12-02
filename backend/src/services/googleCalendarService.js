/**
 * Google Calendar Service
 * Sprint 5.2 - Google Calendar Integration
 */

import { google } from 'googleapis';
import pool from '../config/database.js';
import logger from '../utils/logger.js';

class GoogleCalendarService {
  constructor() {
    this.oauth2Client = null;
    this.calendar = null;
    this.initializeClient();
  }

  /**
   * Initialize OAuth2 Client
   */
  initializeClient() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/calendar/oauth/callback';

    if (!clientId || !clientSecret) {
      logger.warn('Google Calendar credentials not configured');
      return;
    }

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Generate OAuth URL for user authorization
   */
  getAuthUrl(state = {}) {
    if (!this.oauth2Client) {
      throw new Error('Google OAuth client not initialized');
    }

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: JSON.stringify(state),
      prompt: 'consent', // Force to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code) {
    if (!this.oauth2Client) {
      throw new Error('Google OAuth client not initialized');
    }

    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      logger.error('Error exchanging code for tokens:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken) {
    if (!this.oauth2Client) {
      throw new Error('Google OAuth client not initialized');
    }

    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return credentials;
    } catch (error) {
      logger.error('Error refreshing access token:', error);
      throw error;
    }
  }

  /**
   * Set credentials for a connection
   */
  setCredentials(accessToken, refreshToken) {
    if (!this.oauth2Client) {
      throw new Error('Google OAuth client not initialized');
    }

    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  /**
   * Get user's calendar list
   */
  async getCalendarList() {
    try {
      const response = await this.calendar.calendarList.list();
      return response.data.items || [];
    } catch (error) {
      logger.error('Error getting calendar list:', error);
      throw error;
    }
  }

  /**
   * Get primary calendar info
   */
  async getPrimaryCalendar() {
    try {
      const response = await this.calendar.calendars.get({
        calendarId: 'primary',
      });
      return response.data;
    } catch (error) {
      logger.error('Error getting primary calendar:', error);
      throw error;
    }
  }

  /**
   * List events from Google Calendar
   */
  async listEvents(calendarId = 'primary', options = {}) {
    const {
      timeMin = new Date().toISOString(),
      timeMax,
      maxResults = 250,
      singleEvents = true,
      orderBy = 'startTime',
    } = options;

    try {
      const response = await this.calendar.events.list({
        calendarId,
        timeMin,
        timeMax,
        maxResults,
        singleEvents,
        orderBy,
      });

      return response.data.items || [];
    } catch (error) {
      logger.error('Error listing events:', error);
      throw error;
    }
  }

  /**
   * Get single event from Google Calendar
   */
  async getEvent(calendarId, eventId) {
    try {
      const response = await this.calendar.events.get({
        calendarId,
        eventId,
      });
      return response.data;
    } catch (error) {
      logger.error('Error getting event:', error);
      throw error;
    }
  }

  /**
   * Create event in Google Calendar
   */
  async createEvent(calendarId, eventData) {
    try {
      const response = await this.calendar.events.insert({
        calendarId,
        requestBody: eventData,
      });
      return response.data;
    } catch (error) {
      logger.error('Error creating event:', error);
      throw error;
    }
  }

  /**
   * Update event in Google Calendar
   */
  async updateEvent(calendarId, eventId, eventData) {
    try {
      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        requestBody: eventData,
      });
      return response.data;
    } catch (error) {
      logger.error('Error updating event:', error);
      throw error;
    }
  }

  /**
   * Delete event from Google Calendar
   */
  async deleteEvent(calendarId, eventId) {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId,
      });
      return true;
    } catch (error) {
      logger.error('Error deleting event:', error);
      throw error;
    }
  }

  /**
   * Convert local event to Google Calendar format
   */
  convertEventoToGoogleEvent(evento) {
    const startDateTime = new Date(evento.fecha);
    const endDateTime = new Date(startDateTime.getTime() + (evento.duracion_minutos || 240) * 60000);

    return {
      summary: evento.evento,
      description: this.buildEventDescription(evento),
      location: evento.ubicacion || '',
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'Europe/Madrid',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Europe/Madrid',
      },
      attendees: this.buildAttendees(evento),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
      colorId: this.getEventColorId(evento.tipo_evento),
    };
  }

  /**
   * Build event description from evento data
   */
  buildEventDescription(evento) {
    const parts = [];

    if (evento.descripcion) {
      parts.push(evento.descripcion);
    }

    parts.push('');
    parts.push('--- Detalles del Evento ---');

    if (evento.dj_nombre) {
      parts.push(`DJ: ${evento.dj_nombre}`);
    }

    if (evento.cliente_nombre) {
      parts.push(`Cliente: ${evento.cliente_nombre}`);
    }

    if (evento.tipo_evento) {
      parts.push(`Tipo: ${evento.tipo_evento}`);
    }

    if (evento.asistentes) {
      parts.push(`Asistentes: ${evento.asistentes}`);
    }

    if (evento.cache_total) {
      parts.push(`Caché: €${evento.cache_total}`);
    }

    if (evento.estado) {
      parts.push(`Estado: ${evento.estado}`);
    }

    return parts.join('\n');
  }

  /**
   * Build attendees list
   */
  buildAttendees(evento) {
    const attendees = [];

    if (evento.cliente_email) {
      attendees.push({
        email: evento.cliente_email,
        displayName: evento.cliente_nombre,
        responseStatus: 'accepted',
      });
    }

    if (evento.dj_email) {
      attendees.push({
        email: evento.dj_email,
        displayName: evento.dj_nombre,
        responseStatus: 'accepted',
      });
    }

    return attendees.length > 0 ? attendees : undefined;
  }

  /**
   * Get color ID based on event type
   */
  getEventColorId(tipoEvento) {
    const colorMap = {
      'boda': '9', // Blue
      'cumpleaños': '10', // Green
      'corporativo': '11', // Red
      'fiesta': '5', // Yellow
      'concierto': '6', // Orange
    };

    return colorMap[tipoEvento?.toLowerCase()] || '1'; // Default: Lavender
  }

  /**
   * Convert Google event to local evento format
   */
  convertGoogleEventToEvento(googleEvent, agencyId) {
    const startDateTime = googleEvent.start.dateTime || googleEvent.start.date;
    const endDateTime = googleEvent.end.dateTime || googleEvent.end.date;

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const durationMinutes = Math.round((end - start) / 60000);

    return {
      agency_id: agencyId,
      evento: googleEvent.summary || 'Sin título',
      fecha: start,
      ubicacion: googleEvent.location || null,
      descripcion: googleEvent.description || null,
      duracion_minutos: durationMinutes,
      tipo_evento: this.extractEventType(googleEvent),
      estado: 'confirmado',
      asistentes: googleEvent.attendees?.length || null,
    };
  }

  /**
   * Extract event type from Google event
   */
  extractEventType(googleEvent) {
    const summary = (googleEvent.summary || '').toLowerCase();
    const description = (googleEvent.description || '').toLowerCase();
    const combined = `${summary} ${description}`;

    if (combined.includes('boda')) return 'boda';
    if (combined.includes('cumpleaños') || combined.includes('cumpleanos')) return 'cumpleaños';
    if (combined.includes('corporativo') || combined.includes('empresa')) return 'corporativo';
    if (combined.includes('concierto')) return 'concierto';
    if (combined.includes('fiesta')) return 'fiesta';

    return 'otro';
  }

  /**
   * Check if event has conflicts (time overlap)
   */
  async checkEventConflicts(djId, fecha, duracionMinutos, excludeEventoId = null) {
    try {
      const result = await pool.query(
        'SELECT * FROM check_calendar_conflicts($1, $2, $3, $4)',
        [djId, fecha, duracionMinutos, excludeEventoId]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error checking conflicts:', error);
      return [];
    }
  }

  /**
   * Validate connection and refresh token if needed
   */
  async validateAndRefreshConnection(connectionId) {
    try {
      const result = await pool.query(
        `SELECT * FROM google_calendar_connections
         WHERE id = $1 AND deleted_at IS NULL`,
        [connectionId]
      );

      if (result.rows.length === 0) {
        throw new Error('Connection not found');
      }

      const connection = result.rows[0];

      // Check if token is expired or about to expire (within 5 minutes)
      const now = new Date();
      const expiry = new Date(connection.token_expiry);
      const needsRefresh = (expiry - now) < 5 * 60 * 1000;

      if (needsRefresh) {
        logger.info('Refreshing expired token for connection:', connectionId);
        const tokens = await this.refreshAccessToken(connection.refresh_token);

        // Update tokens in database
        await pool.query(
          `UPDATE google_calendar_connections
           SET access_token = $1,
               token_expiry = $2,
               updated_at = NOW()
           WHERE id = $3`,
          [tokens.access_token, new Date(tokens.expiry_date), connectionId]
        );

        connection.access_token = tokens.access_token;
        connection.token_expiry = new Date(tokens.expiry_date);
      }

      // Set credentials for this request
      this.setCredentials(connection.access_token, connection.refresh_token);

      return connection;
    } catch (error) {
      logger.error('Error validating connection:', error);

      // Mark connection as error
      await pool.query(
        `UPDATE google_calendar_connections
         SET status = 'error',
             error_message = $2,
             error_count = error_count + 1,
             updated_at = NOW()
         WHERE id = $1`,
        [connectionId, error.message]
      );

      throw error;
    }
  }
}

export default new GoogleCalendarService();
