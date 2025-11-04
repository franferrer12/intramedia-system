/**
 * Swagger/OpenAPI Configuration
 * Auto-generates API documentation
 */

export const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Intra Media System API',
    version: '2.3.0',
    description: `
# Sistema de Gestión para Agencia de DJs

API completa para gestión de eventos, DJs, clientes, finanzas y más.

## Características

- 🎧 Gestión completa de DJs
- 📅 Sistema de eventos y reservas
- 💰 Control financiero avanzado
- 📊 Analytics y reportes
- 🔐 Autenticación JWT
- 🏢 Multi-tenant
- 📱 Integración con redes sociales

## Autenticación

La mayoría de los endpoints requieren autenticación mediante JWT.
Incluye el token en el header: \`Authorization: Bearer {token}\`

## Paginación

Los endpoints que retornan listas soportan paginación:
- \`page\`: Número de página (default: 1)
- \`limit\`: Resultados por página (default: 20, max: 100)

## Filtros

Muchos endpoints soportan filtros mediante query parameters.
Ejemplo: \`/api/djs?search=martin&activo=true&sortBy=nombre\`
    `,
    contact: {
      name: 'Intra Media',
      email: 'info@intramedia.com'
    },
    license: {
      name: 'Proprietary',
      url: 'https://intramedia.com/license'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server'
    },
    {
      url: 'https://api.intramedia.com',
      description: 'Production server'
    }
  ],
  tags: [
    { name: 'Auth', description: 'Autenticación y autorización' },
    { name: 'DJs', description: 'Gestión de DJs' },
    { name: 'Clientes', description: 'Gestión de clientes' },
    { name: 'Eventos', description: 'Gestión de eventos' },
    { name: 'Leads', description: 'Gestión de leads y prospectos' },
    { name: 'Requests', description: 'Solicitudes y requerimientos' },
    { name: 'Socios', description: 'Gestión de socios' },
    { name: 'Financial', description: 'Gestión financiera' },
    { name: 'Statistics', description: 'Estadísticas y KPIs' },
    { name: 'Analytics', description: 'Análisis avanzados' },
    { name: 'Quotations', description: 'Cotizaciones' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtenido del endpoint /api/auth/login'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          timestamp: { type: 'string', format: 'date-time' },
          error: {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Error message' },
              statusCode: { type: 'integer', example: 400 },
              type: { type: 'string', example: 'BAD_REQUEST' },
              details: { type: 'object', nullable: true },
              validation: { type: 'array', items: { type: 'object' }, nullable: true }
            }
          }
        }
      },
      Success: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          timestamp: { type: 'string', format: 'date-time' },
          message: { type: 'string', nullable: true },
          data: { type: 'object', nullable: true }
        }
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 100 },
          totalPages: { type: 'integer', example: 5 },
          hasNextPage: { type: 'boolean', example: true },
          hasPrevPage: { type: 'boolean', example: false },
          nextPage: { type: 'integer', nullable: true, example: 2 },
          prevPage: { type: 'integer', nullable: true, example: null },
          showing: {
            type: 'object',
            properties: {
              from: { type: 'integer', example: 1 },
              to: { type: 'integer', example: 20 },
              of: { type: 'integer', example: 100 }
            }
          }
        }
      },
      DJ: {
        type: 'object',
        required: ['nombre', 'email'],
        properties: {
          id: { type: 'integer', example: 1 },
          nombre: { type: 'string', example: 'DJ Martin' },
          email: { type: 'string', format: 'email', example: 'martin@example.com' },
          telefono: { type: 'string', example: '+34 600 123 456' },
          activo: { type: 'boolean', example: true },
          foto_url: { type: 'string', nullable: true },
          bio: { type: 'string', nullable: true },
          especialidades: { type: 'array', items: { type: 'string' } },
          redes_sociales: { type: 'object', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
          deleted_at: { type: 'string', format: 'date-time', nullable: true }
        }
      },
      Cliente: {
        type: 'object',
        required: ['nombre'],
        properties: {
          id: { type: 'integer', example: 1 },
          nombre: { type: 'string', example: 'Sala Apolo' },
          email: { type: 'string', format: 'email', nullable: true },
          telefono: { type: 'string', nullable: true },
          tipo_cliente: {
            type: 'string',
            enum: ['particular', 'empresa', 'promotora'],
            example: 'empresa'
          },
          direccion: { type: 'string', nullable: true },
          nif_cif: { type: 'string', nullable: true },
          observaciones: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
          deleted_at: { type: 'string', format: 'date-time', nullable: true }
        }
      },
      Evento: {
        type: 'object',
        required: ['evento', 'dj_id', 'fecha', 'mes'],
        properties: {
          id: { type: 'integer', example: 1 },
          evento: { type: 'string', example: 'Fiesta Nochevieja' },
          dj_id: { type: 'integer', example: 5 },
          cliente_id: { type: 'integer', nullable: true },
          fecha: { type: 'string', format: 'date', example: '2025-12-31' },
          mes: { type: 'string', example: 'diciembre' },
          estado: {
            type: 'string',
            enum: ['confirmado', 'pendiente', 'cancelado', 'completado'],
            example: 'confirmado'
          },
          horas: { type: 'number', nullable: true, example: 6 },
          precio_cliente: { type: 'number', example: 800 },
          parte_dj: { type: 'number', example: 600 },
          parte_agencia: { type: 'number', example: 200 },
          observaciones: { type: 'string', nullable: true },
          cobrado_cliente: { type: 'boolean', example: false },
          pagado_dj: { type: 'boolean', example: false },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
          deleted_at: { type: 'string', format: 'date-time', nullable: true }
        }
      },
      Lead: {
        type: 'object',
        required: ['nombre'],
        properties: {
          id: { type: 'integer', example: 1 },
          nombre: { type: 'string', example: 'Juan Pérez' },
          email: { type: 'string', format: 'email', nullable: true },
          telefono: { type: 'string', nullable: true },
          source: { type: 'string', example: 'web' },
          status: {
            type: 'string',
            enum: ['nuevo', 'contactado', 'calificado', 'negociacion', 'ganado', 'perdido'],
            example: 'nuevo'
          },
          prioridad: {
            type: 'string',
            enum: ['baja', 'media', 'alta'],
            example: 'media'
          },
          convertido: { type: 'boolean', example: false },
          observaciones: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
          deleted_at: { type: 'string', format: 'date-time', nullable: true }
        }
      },
      Cotizacion: {
        type: 'object',
        required: ['cliente_nombre', 'tipo_evento', 'fecha_evento'],
        properties: {
          id: { type: 'integer', example: 1 },
          numero: { type: 'string', example: 'COT-2025-0001' },
          cliente_nombre: { type: 'string', example: 'Juan Pérez' },
          cliente_email: { type: 'string', nullable: true },
          tipo_evento: { type: 'string', example: 'Boda' },
          fecha_evento: { type: 'string', format: 'date' },
          status: {
            type: 'string',
            enum: ['borrador', 'enviada', 'aceptada', 'rechazada', 'expirada', 'convertida'],
            example: 'enviada'
          },
          subtotal: { type: 'number', example: 1000 },
          descuento: { type: 'number', example: 0 },
          iva: { type: 'number', example: 210 },
          total: { type: 'number', example: 1210 },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      }
    },
    parameters: {
      pageParam: {
        in: 'query',
        name: 'page',
        schema: { type: 'integer', minimum: 1, default: 1 },
        description: 'Número de página'
      },
      limitParam: {
        in: 'query',
        name: 'limit',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        description: 'Resultados por página'
      },
      searchParam: {
        in: 'query',
        name: 'search',
        schema: { type: 'string' },
        description: 'Término de búsqueda'
      },
      sortByParam: {
        in: 'query',
        name: 'sortBy',
        schema: { type: 'string' },
        description: 'Campo por el cual ordenar'
      },
      sortOrderParam: {
        in: 'query',
        name: 'sortOrder',
        schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
        description: 'Dirección del ordenamiento'
      }
    },
    responses: {
      Unauthorized: {
        description: 'No autorizado - Token inválido o faltante',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      Forbidden: {
        description: 'Prohibido - Sin permisos suficientes',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      NotFound: {
        description: 'Recurso no encontrado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      ValidationError: {
        description: 'Error de validación',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              success: false,
              timestamp: '2025-10-28T13:00:00.000Z',
              error: {
                message: 'Los datos proporcionados no son válidos',
                statusCode: 422,
                type: 'VALIDATION_ERROR',
                validation: [
                  { field: 'email', message: 'Email no válido' },
                  { field: 'telefono', message: 'Teléfono requerido' }
                ]
              }
            }
          }
        }
      },
      ServerError: {
        description: 'Error interno del servidor',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      }
    }
  }
};

export const swaggerOptions = {
  swaggerDefinition,
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

export default { swaggerDefinition, swaggerOptions };
