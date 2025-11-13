import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IntraMedia System API',
      version: '2.3.0',
      description: 'Sistema de gestión integral para agencias de DJs y eventos',
      contact: {
        name: 'IntraMedia Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    tags: [
      { name: 'Authentication' },
      { name: 'Eventos' },
      { name: 'DJs' },
      { name: 'Clientes' },
      { name: 'Financial' },
      { name: 'Analytics' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
