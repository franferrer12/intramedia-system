import swaggerJsdoc from 'swagger-jsdoc';

/**
 * Swagger/OpenAPI 3.0 Configuration
 * Auto-generates API documentation from JSDoc comments
 */

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Intra Media System API',
      version: '2.3.0',
      description: `
        Sistema integral de gestión para agencias de DJs.

        ## Características
        - Gestión de eventos, DJs y clientes
        - Sistema de reservas y calendario
        - Pagos con Stripe
        - Integración con Google Calendar
        - Sistema de documentos con versionado
        - Dashboard financiero
        - Notificaciones en tiempo real
        - Gestión de leads y pipeline de ventas

        ## Autenticación
        Todas las rutas (excepto login y públicas) requieren autenticación JWT.
        Incluye el token en el header: \`Authorization: Bearer <token>\`

        ## Rate Limiting
        - Desarrollo: Sin límite
        - Producción: 100 requests / 15 minutos

        ## Paginación
        La mayoría de endpoints de listado soportan paginación:
        - \`limit\`: Número de resultados (default: 20, max: 100)
        - \`offset\`: Posición de inicio (default: 0)

        ## Filtrado
        Usa query parameters para filtrar:
        - \`fecha_desde\`, \`fecha_hasta\`: Rango de fechas
        - \`estado\`: Filtrar por estado
        - \`search\`: Búsqueda full-text
      `,
      contact: {
        name: 'Soporte Técnico',
        email: 'dev@intramedia.com',
      },
      license: {
        name: 'Proprietary',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.intramedia.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtenido del endpoint /api/auth/login',
        },
      },
      schemas: {
        // Authentication
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@example.com' },
            password: { type: 'string', format: 'password', example: 'password123' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                user: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },

        // Common
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Error message' },
            message: { type: 'string', example: 'Detailed error description' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: {} },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'integer', example: 150 },
                limit: { type: 'integer', example: 20 },
                offset: { type: 'integer', example: 0 },
                pages: { type: 'integer', example: 8 },
              },
            },
          },
        },

        // User
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            nombre: { type: 'string', example: 'Juan Pérez' },
            role: { type: 'string', enum: ['admin', 'manager', 'operator'], example: 'admin' },
            agency_id: { type: 'integer', example: 1 },
            active: { type: 'boolean', example: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },

        // Evento
        Evento: {
          type: 'object',
          required: ['evento', 'fecha', 'duracion_minutos', 'precio_acordado'],
          properties: {
            id: { type: 'integer', example: 1 },
            agency_id: { type: 'integer', example: 1 },
            evento: { type: 'string', example: 'Boda María & Carlos' },
            fecha: { type: 'string', format: 'date-time', example: '2025-12-25T20:00:00Z' },
            ubicacion: { type: 'string', example: 'Hotel Gran Meliá, Madrid' },
            dj_id: { type: 'integer', example: 5 },
            cliente_id: { type: 'integer', example: 10 },
            precio_acordado: { type: 'number', format: 'decimal', example: 1500.00 },
            comision_agencia: { type: 'number', format: 'decimal', example: 450.00 },
            comision_dj: { type: 'number', format: 'decimal', example: 1050.00 },
            duracion_minutos: { type: 'integer', example: 300 },
            estado: { type: 'string', enum: ['pending', 'confirmed', 'completed', 'cancelled'], example: 'confirmed' },
            notas: { type: 'string', nullable: true },
            contract_signed: { type: 'boolean', example: true },
            advance_payment: { type: 'number', format: 'decimal', nullable: true },
            final_payment: { type: 'number', format: 'decimal', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        CreateEventoRequest: {
          type: 'object',
          required: ['evento', 'fecha', 'duracion_minutos', 'precio_acordado'],
          properties: {
            evento: { type: 'string', example: 'Boda María & Carlos' },
            fecha: { type: 'string', format: 'date-time', example: '2025-12-25T20:00:00Z' },
            ubicacion: { type: 'string', example: 'Hotel Gran Meliá, Madrid' },
            dj_id: { type: 'integer', example: 5 },
            cliente_id: { type: 'integer', example: 10 },
            precio_acordado: { type: 'number', example: 1500.00 },
            comision_agencia: { type: 'number', example: 450.00 },
            comision_dj: { type: 'number', example: 1050.00 },
            duracion_minutos: { type: 'integer', example: 300 },
            estado: { type: 'string', enum: ['pending', 'confirmed', 'completed', 'cancelled'], example: 'pending' },
            notas: { type: 'string', nullable: true },
          },
        },

        // DJ
        DJ: {
          type: 'object',
          required: ['nombre', 'email'],
          properties: {
            id: { type: 'integer', example: 1 },
            agency_id: { type: 'integer', example: 1 },
            nombre: { type: 'string', example: 'DJ Pulse' },
            nombre_artistico: { type: 'string', example: 'DJ Pulse', nullable: true },
            email: { type: 'string', format: 'email', example: 'dj@example.com' },
            telefono: { type: 'string', example: '+34 600 123 456' },
            direccion: { type: 'string', nullable: true },
            nif_cif: { type: 'string', nullable: true },
            banco_iban: { type: 'string', nullable: true },
            comision_predeterminada: { type: 'number', format: 'decimal', example: 70.00 },
            precio_por_hora: { type: 'number', format: 'decimal', example: 300.00 },
            especialidad: { type: 'string', example: 'House, Techno' },
            active: { type: 'boolean', example: true },
            notas: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },

        // Cliente
        Cliente: {
          type: 'object',
          required: ['nombre', 'email'],
          properties: {
            id: { type: 'integer', example: 1 },
            agency_id: { type: 'integer', example: 1 },
            nombre: { type: 'string', example: 'María García' },
            email: { type: 'string', format: 'email', example: 'maria@example.com' },
            telefono: { type: 'string', example: '+34 600 789 012' },
            direccion: { type: 'string', nullable: true },
            nif_cif: { type: 'string', nullable: true },
            empresa: { type: 'string', nullable: true },
            tipo_cliente: { type: 'string', enum: ['individual', 'empresa', 'organizador'], example: 'individual' },
            notas: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },

        // Payment
        Payment: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            agency_id: { type: 'integer', example: 1 },
            evento_id: { type: 'integer', example: 5, nullable: true },
            amount: { type: 'number', format: 'decimal', example: 500.00 },
            currency: { type: 'string', example: 'EUR' },
            payment_type: { type: 'string', enum: ['advance', 'final', 'refund'], example: 'advance' },
            payment_method: { type: 'string', enum: ['card', 'bank_transfer', 'cash'], example: 'card' },
            status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed', 'refunded'], example: 'completed' },
            stripe_payment_intent_id: { type: 'string', nullable: true },
            paid_by: { type: 'string', example: 'María García' },
            description: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },

        // Document
        Document: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            agency_id: { type: 'integer', example: 1 },
            entity_type: { type: 'string', enum: ['evento', 'dj', 'cliente', 'contract'], example: 'evento' },
            entity_id: { type: 'integer', example: 5 },
            document_type: { type: 'string', enum: ['contract', 'invoice', 'receipt', 'other'], example: 'contract' },
            filename: { type: 'string', example: 'contract_evento_5.pdf' },
            file_path: { type: 'string', example: '/uploads/contracts/contract_evento_5.pdf' },
            file_size: { type: 'integer', example: 245678 },
            mime_type: { type: 'string', example: 'application/pdf' },
            version: { type: 'integer', example: 1 },
            is_current: { type: 'boolean', example: true },
            uploaded_by: { type: 'integer', example: 1 },
            uploaded_at: { type: 'string', format: 'date-time' },
          },
        },

        // Reservation
        Reservation: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            agency_id: { type: 'integer', example: 1 },
            dj_id: { type: 'integer', example: 5 },
            client_name: { type: 'string', example: 'María García' },
            client_email: { type: 'string', format: 'email', example: 'maria@example.com' },
            client_phone: { type: 'string', example: '+34 600 123 456' },
            event_date: { type: 'string', format: 'date-time' },
            event_duration_minutes: { type: 'integer', example: 300 },
            event_type: { type: 'string', example: 'Boda' },
            event_location: { type: 'string', example: 'Madrid' },
            estimated_price: { type: 'number', format: 'decimal', example: 1500.00 },
            status: { type: 'string', enum: ['pending', 'hold', 'confirmed', 'cancelled', 'expired'], example: 'pending' },
            hold_expires_at: { type: 'string', format: 'date-time', nullable: true },
            notes: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },

        // Lead
        Lead: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            agency_id: { type: 'integer', example: 1 },
            nombre: { type: 'string', example: 'Pedro López' },
            email: { type: 'string', format: 'email', example: 'pedro@example.com' },
            telefono: { type: 'string', example: '+34 600 555 777' },
            empresa: { type: 'string', nullable: true },
            origen: { type: 'string', enum: ['web', 'referral', 'social', 'email', 'phone', 'other'], example: 'web' },
            status: { type: 'string', enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'], example: 'new' },
            score: { type: 'integer', minimum: 0, maximum: 100, example: 75 },
            estimated_value: { type: 'number', format: 'decimal', nullable: true },
            next_follow_up: { type: 'string', format: 'date-time', nullable: true },
            assigned_to: { type: 'integer', nullable: true },
            notas: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Authentication', description: 'Login y gestión de sesiones' },
      { name: 'Eventos', description: 'Gestión de eventos' },
      { name: 'DJs', description: 'Gestión de DJs' },
      { name: 'Clientes', description: 'Gestión de clientes' },
      { name: 'Leads', description: 'Gestión de leads y pipeline' },
      { name: 'Payments', description: 'Pagos con Stripe' },
      { name: 'Documents', description: 'Gestión de documentos' },
      { name: 'Reservations', description: 'Sistema de reservas' },
      { name: 'Calendar', description: 'Integración con Google Calendar' },
      { name: 'Financial', description: 'Dashboard financiero' },
      { name: 'Notifications', description: 'Notificaciones' },
      { name: 'Settings', description: 'Configuración de la agencia' },
    ],
  },
  apis: [
    './src/routes/*.js', // Buscar JSDoc comments en todos los archivos de rutas
    './src/controllers/*.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
