/**
 * Pagination Middleware & Utilities
 * Estandariza paginación en todos los endpoints de la API
 */

/**
 * Middleware para parsear parámetros de paginación de la query string
 * Añade pagination object al req
 */
export const paginationMiddleware = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  req.pagination = {
    page,
    limit,
    offset
  };

  next();
};

/**
 * Formatea la respuesta paginada de manera consistente
 * @param {Array} data - Los datos a paginar
 * @param {Number} total - Total de registros en la BD
 * @param {Object} pagination - Objeto con page, limit, offset
 * @param {Object} additionalData - Datos adicionales opcionales
 * @returns {Object} Respuesta formateada
 */
export const formatPaginatedResponse = (data, total, pagination, additionalData = {}) => {
  const { page, limit } = pagination;
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null
    },
    ...additionalData
  };
};

/**
 * Añade paginación a una query de PostgreSQL
 * @param {String} baseQuery - Query base sin LIMIT/OFFSET
 * @param {Object} pagination - Objeto con page, limit, offset
 * @returns {String} Query con paginación
 */
export const addPaginationToQuery = (baseQuery, pagination) => {
  const { limit, offset } = pagination;
  return `${baseQuery.trim()} LIMIT ${limit} OFFSET ${offset}`;
};

/**
 * Obtiene el total de registros para una query
 * Reemplaza SELECT columns con SELECT COUNT(*)
 * @param {String} query - Query original
 * @returns {String} Query de conteo
 */
export const getCountQuery = (query) => {
  // Remove ORDER BY, LIMIT, OFFSET from count query
  let countQuery = query
    .replace(/ORDER BY[\s\S]+?(?=LIMIT|OFFSET|$)/gi, '')
    .replace(/LIMIT\s+\d+/gi, '')
    .replace(/OFFSET\s+\d+/gi, '')
    .trim();

  // Wrap in COUNT if it's a complex query
  if (countQuery.toLowerCase().includes('group by') ||
      countQuery.toLowerCase().includes('distinct')) {
    return `SELECT COUNT(*) FROM (${countQuery}) AS count_query`;
  }

  // Simple replacement for basic queries
  return countQuery.replace(
    /SELECT[\s\S]+?FROM/i,
    'SELECT COUNT(*) FROM'
  );
};

/**
 * Parsea y valida parámetros de filtro comunes
 * @param {Object} query - req.query object
 * @returns {Object} Filtros validados
 */
export const parseFilters = (query) => {
  const filters = {};

  // Búsqueda de texto
  if (query.search && typeof query.search === 'string') {
    filters.search = query.search.trim();
  }

  // Filtro por fecha (desde)
  if (query.dateFrom) {
    const date = new Date(query.dateFrom);
    if (!isNaN(date.getTime())) {
      filters.dateFrom = date;
    }
  }

  // Filtro por fecha (hasta)
  if (query.dateTo) {
    const date = new Date(query.dateTo);
    if (!isNaN(date.getTime())) {
      filters.dateTo = date;
    }
  }

  // Filtro por estado
  if (query.status && typeof query.status === 'string') {
    filters.status = query.status.trim();
  }

  // Filtro por tipo
  if (query.type && typeof query.type === 'string') {
    filters.type = query.type.trim();
  }

  // Ordenamiento
  if (query.sortBy && typeof query.sortBy === 'string') {
    filters.sortBy = query.sortBy.trim();
    filters.sortOrder = query.sortOrder === 'desc' ? 'DESC' : 'ASC';
  }

  return filters;
};

/**
 * Construye cláusula WHERE dinámicamente basado en filtros
 * @param {Object} filters - Filtros parseados
 * @param {Array} params - Array de parámetros SQL (se modifica por referencia)
 * @param {Number} startIndex - Índice inicial para parámetros ($1, $2, etc)
 * @returns {String} Cláusula WHERE
 */
export const buildWhereClause = (filters, params = [], startIndex = 1) => {
  const conditions = [];
  let paramIndex = startIndex;

  if (filters.search) {
    conditions.push(`(nombre ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  if (filters.dateFrom) {
    conditions.push(`fecha >= $${paramIndex}`);
    params.push(filters.dateFrom);
    paramIndex++;
  }

  if (filters.dateTo) {
    conditions.push(`fecha <= $${paramIndex}`);
    params.push(filters.dateTo);
    paramIndex++;
  }

  if (filters.status) {
    conditions.push(`status = $${paramIndex}`);
    params.push(filters.status);
    paramIndex++;
  }

  if (filters.type) {
    conditions.push(`tipo = $${paramIndex}`);
    params.push(filters.type);
    paramIndex++;
  }

  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
};

/**
 * Construye cláusula ORDER BY
 * @param {Object} filters - Filtros parseados
 * @param {String} defaultSort - Campo de ordenamiento por defecto
 * @returns {String} Cláusula ORDER BY
 */
export const buildOrderByClause = (filters, defaultSort = 'created_at DESC') => {
  if (filters.sortBy) {
    // Whitelist de campos permitidos para ordenar (prevenir SQL injection)
    const allowedFields = [
      'id', 'nombre', 'email', 'fecha', 'created_at', 'updated_at',
      'cache_total', 'status', 'tipo', 'precio'
    ];

    if (allowedFields.includes(filters.sortBy)) {
      return `ORDER BY ${filters.sortBy} ${filters.sortOrder || 'ASC'}`;
    }
  }

  return `ORDER BY ${defaultSort}`;
};

export default {
  paginationMiddleware,
  formatPaginatedResponse,
  addPaginationToQuery,
  getCountQuery,
  parseFilters,
  buildWhereClause,
  buildOrderByClause
};
