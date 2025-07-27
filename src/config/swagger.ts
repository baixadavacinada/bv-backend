import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Baixada Vacinada API',
      version: '1.0.0',
      description: 'API para gerenciamento de vacinação em Japeri',
    },
    servers: [{ url: 'http://localhost:3000/api' }],
  },
  apis: ['./src/docs/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
