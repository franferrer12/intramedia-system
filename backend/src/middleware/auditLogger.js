import AuditLog from '../models/AuditLog.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Audit Logger Middleware
 * Automatically logs all API requests and responses
 */

/**
 * Extract entity info from request
 */
const extractEntityInfo = (req) => {
  const path = req.route?.path || req.path;
  const method = req.method;
  const params = req.params;

  // Map routes to entity types
  const entityMappings = {
    '/eventos': 'evento',
    '/djs': 'dj',
    '/clientes': 'cliente',
    '/leads': 'lead',
    '/payments': 'payment',
    '/documents': 'document',
    '/contracts': 'contract',
    '/solicitudes': 'solicitud',
    '/reservations': 'reservation',
    '/socios': 'socio',
    '/nominas': 'nomina',
    '/users': 'user'
  };

  let entityType = null;
  let entityId = null;

  // Find matching entity type
  for (const [route, type] of Object.entries(entityMappings)) {
    if (path.includes(route)) {
      entityType = type;
      break;
    }
  }

  // Extract entity ID from params
  if (params.id) {
    entityId = parseInt(params.id);
  }

  return { entityType, entityId };
};

/**
 * Determine event type from HTTP method
 */
const getEventType = (method, path) => {
  if (path.includes('/login')) return 'LOGIN';
  if (path.includes('/logout')) return 'LOGOUT';
  if (path.includes('/export')) return 'EXPORT';
  if (path.includes('/import')) return 'IMPORT';

  const eventTypeMap = {
    'POST': 'CREATE',
    'PUT': 'UPDATE',
    'PATCH': 'UPDATE',
    'DELETE': 'DELETE',
    'GET': 'VIEW'
  };

  return eventTypeMap[method] || 'ACCESS';
};

/**
 * Generate action description
 */
const generateActionDescription = (req, entityType, eventType) => {
  const method = req.method;
  const path = req.route?.path || req.path;
  const body = req.body;

  let action = '';

  switch (eventType) {
    case 'CREATE':
      action = `Created ${entityType}`;
      if (body?.nombre) action += `: ${body.nombre}`;
      if (body?.evento) action += `: ${body.evento}`;
      break;

    case 'UPDATE':
      action = `Updated ${entityType}`;
      if (req.params.id) action += ` #${req.params.id}`;
      break;

    case 'DELETE':
      action = `Deleted ${entityType}`;
      if (req.params.id) action += ` #${req.params.id}`;
      break;

    case 'VIEW':
      if (path.includes('/export')) {
        action = `Exported ${entityType || 'data'}`;
      } else if (req.params.id) {
        action = `Viewed ${entityType} #${req.params.id}`;
      } else {
        action = `Listed ${entityType || 'resources'}`;
      }
      break;

    case 'LOGIN':
      action = `User logged in`;
      if (body?.username) action += `: ${body.username}`;
      break;

    case 'LOGOUT':
      action = `User logged out`;
      break;

    case 'EXPORT':
      action = `Exported ${entityType || 'data'}`;
      break;

    case 'IMPORT':
      action = `Imported ${entityType || 'data'}`;
      break;

    default:
      action = `${method} ${path}`;
  }

  return action;
};

/**
 * Extract changed fields by comparing old and new values
 */
const extractChangedFields = (oldValues, newValues) => {
  if (!oldValues || !newValues) return [];

  const changedFields = [];

  for (const key in newValues) {
    if (oldValues[key] !== newValues[key]) {
      changedFields.push(key);
    }
  }

  return changedFields;
};

/**
 * Get client IP address
 */
const getClientIp = (req) => {
  return req.ip ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    null;
};

/**
 * Main audit logging middleware
 */
export const auditLogger = (options = {}) => {
  const {
    excludePaths = ['/health', '/ping', '/metrics'],
    excludeMethods = [],
    logBody = true,
    logQuery = true,
    logResponse = false,
    sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard']
  } = options;

  return async (req, res, next) => {
    // Skip excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Skip excluded methods
    if (excludeMethods.includes(req.method)) {
      return next();
    }

    // Generate unique request ID
    const requestId = uuidv4();
    req.requestId = requestId;

    // Capture start time
    const startTime = Date.now();

    // Store original response methods
    const originalJson = res.json;
    const originalSend = res.send;

    let responseBody = null;
    let statusCode = null;

    // Override res.json to capture response
    res.json = function(body) {
      responseBody = body;
      statusCode = res.statusCode;
      return originalJson.call(this, body);
    };

    // Override res.send to capture response
    res.send = function(body) {
      if (!responseBody) {
        responseBody = body;
        statusCode = res.statusCode;
      }
      return originalSend.call(this, body);
    };

    // Capture response finish
    res.on('finish', async () => {
      try {
        const durationMs = Date.now() - startTime;
        const { entityType, entityId } = extractEntityInfo(req);
        const eventType = getEventType(req.method, req.path);
        const action = generateActionDescription(req, entityType, eventType);

        // Remove sensitive fields from body
        const sanitizeObject = (obj) => {
          if (!obj) return obj;
          const sanitized = { ...obj };
          sensitiveFields.forEach(field => {
            if (sanitized[field]) {
              sanitized[field] = '[REDACTED]';
            }
          });
          return sanitized;
        };

        // Prepare log data
        const logData = {
          eventType,
          entityType,
          entityId,
          userId: req.user?.id || null,
          userEmail: req.user?.email || null,
          userRole: req.user?.role || null,
          action,
          method: req.method,
          endpoint: req.originalUrl || req.url,
          ipAddress: getClientIp(req),
          userAgent: req.headers['user-agent'] || null,
          oldValues: null, // Will be set by specific controllers for UPDATE/DELETE
          newValues: logBody && req.body && Object.keys(req.body).length > 0
            ? sanitizeObject(req.body)
            : null,
          changedFields: null,
          status: statusCode >= 200 && statusCode < 400 ? 'SUCCESS' : 'FAILURE',
          errorMessage: statusCode >= 400 ? responseBody?.message || responseBody?.error : null,
          durationMs,
          metadata: {
            query: logQuery ? req.query : null,
            headers: {
              'content-type': req.headers['content-type'],
              'accept': req.headers['accept']
            },
            response: logResponse && responseBody ? {
              success: responseBody?.success,
              message: responseBody?.message
            } : null
          },
          sessionId: req.session?.id || req.headers['authorization']?.split(' ')[1]?.substring(0, 20) || null,
          requestId
        };

        // Create audit log asynchronously (don't block response)
        setImmediate(() => {
          AuditLog.create(logData).catch(error => {
            console.error('Audit log creation failed:', error);
          });
        });
      } catch (error) {
        console.error('Audit logging error:', error);
      }
    });

    next();
  };
};

/**
 * Manual audit log helper for specific operations
 * Use this in controllers when you need more control over logging
 */
export const logAudit = async (req, customData = {}) => {
  const { entityType, entityId } = extractEntityInfo(req);
  const eventType = customData.eventType || getEventType(req.method, req.path);

  const logData = {
    eventType,
    entityType: customData.entityType || entityType,
    entityId: customData.entityId || entityId,
    userId: req.user?.id || null,
    userEmail: req.user?.email || null,
    userRole: req.user?.role || null,
    action: customData.action || generateActionDescription(req, entityType, eventType),
    method: req.method,
    endpoint: req.originalUrl || req.url,
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'] || null,
    oldValues: customData.oldValues || null,
    newValues: customData.newValues || null,
    changedFields: customData.changedFields || extractChangedFields(
      customData.oldValues,
      customData.newValues
    ),
    status: customData.status || 'SUCCESS',
    errorMessage: customData.errorMessage || null,
    durationMs: customData.durationMs || null,
    metadata: customData.metadata || null,
    sessionId: req.session?.id || req.headers['authorization']?.split(' ')[1]?.substring(0, 20) || null,
    requestId: req.requestId || uuidv4()
  };

  return await AuditLog.create(logData);
};

/**
 * Middleware to capture entity state before modification
 * Use this before UPDATE/DELETE operations to capture old values
 */
export const captureOldState = (model, idParam = 'id') => {
  return async (req, res, next) => {
    try {
      const id = req.params[idParam];
      if (!id) return next();

      // Fetch current state
      const oldState = await model.findById(id);
      if (oldState) {
        req.oldState = oldState;
      }

      next();
    } catch (error) {
      console.error('Failed to capture old state:', error);
      next(); // Continue even if capturing fails
    }
  };
};

/**
 * Log security event
 */
export const logSecurityEvent = async (req, eventData) => {
  const logData = {
    eventType: 'SECURITY',
    entityType: null,
    entityId: null,
    userId: req.user?.id || null,
    userEmail: req.user?.email || null,
    userRole: req.user?.role || null,
    action: eventData.action,
    method: req.method,
    endpoint: req.originalUrl || req.url,
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'] || null,
    oldValues: null,
    newValues: null,
    changedFields: null,
    status: eventData.status || 'SUCCESS',
    errorMessage: eventData.error || null,
    durationMs: null,
    metadata: eventData.metadata || null,
    sessionId: req.session?.id || null,
    requestId: req.requestId || uuidv4()
  };

  return await AuditLog.create(logData);
};

export default auditLogger;
