import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

// Simplified swagger options optimized for Vercel
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Baixada Vacinada API',
      version: '1.0.0',
      description: 'API para gerenciamento de vacinação em Japeri',
    },
    servers: [
      { 
        url: process.env.NODE_ENV === 'production' 
          ? 'https://bv-backend.vercel.app' 
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development'
      }
    ],
    paths: {
      '/api/public/health-unit': {
        get: {
          summary: 'List health units',
          tags: ['Public'],
          parameters: [
            {
              name: 'isActive',
              in: 'query',
              description: 'Filter by active status',
              schema: { type: 'boolean' }
            },
            {
              name: 'isFavorite', 
              in: 'query',
              description: 'Filter by favorite status',
              schema: { type: 'boolean' }
            },
            {
              name: 'neighborhood',
              in: 'query',
              description: 'Filter by neighborhood name',
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: {
              description: 'List of health units',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { 
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            _id: { type: 'string' },
                            name: { type: 'string' },
                            address: { type: 'string' },
                            neighborhood: { type: 'string' },
                            isActive: { type: 'boolean' },
                            isFavorite: { type: 'boolean' }
                          }
                        }
                      },
                      message: { type: 'string', example: 'Health units retrieved successfully' },
                      count: { type: 'number', example: 10 }
                    }
                  }
                }
              }
            },
            500: {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: false },
                      error: {
                        type: 'object',
                        properties: {
                          code: { type: 'string', example: 'FETCH_ERROR' },
                          message: { type: 'string', example: 'Error fetching health units' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/public/auth/login': {
        post: {
          summary: 'User authentication',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    username: { type: 'string', example: 'admin' },
                    password: { type: 'string', example: 'password123' }
                  },
                  required: ['username', 'password']
                }
              }
            }
          },
          responses: {
            200: { 
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      token: { type: 'string', example: 'jwt.token.here' },
                      user: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          username: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            },
            401: { 
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: false },
                      error: {
                        type: 'object',
                        properties: {
                          code: { type: 'string', example: 'UNAUTHORIZED' },
                          message: { type: 'string', example: 'Invalid credentials' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: [] // No file scanning to prevent timeout
};

export const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  // Swagger UI with optimized configuration for Vercel
  const swaggerUiOptions = {
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .title { color: #2e8b57; }
    `,
    customSiteTitle: 'Baixada Vacinada API',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true
    }
  };

  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(swaggerSpec, swaggerUiOptions));
  
  // JSON endpoint for programmatic access
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerSpec);
  });
}
