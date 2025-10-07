import { Express } from 'express';

// Minimal static swagger spec to avoid file operations
const swaggerSpec = {
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
            schema: { type: 'boolean' }
          },
          {
            name: 'isFavorite', 
            in: 'query',
            schema: { type: 'boolean' }
          },
          {
            name: 'neighborhood',
            in: 'query',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'array' },
                    message: { type: 'string' },
                    count: { type: 'number' }
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
        summary: 'User login',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string' },
                  password: { type: 'string' }
                },
                required: ['username', 'password']
              }
            }
          }
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' }
        }
      }
    }
  }
};

export function setupSwagger(app: Express) {
  // Simple JSON endpoint without Swagger UI to avoid timeout
  app.get('/api-docs', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerSpec);
  });
  
  // Minimal HTML documentation page
  app.get('/docs', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Baixada Vacinada API Documentation</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; }
            .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .method { font-weight: bold; color: #2e8b57; }
          </style>
        </head>
        <body>
          <h1>Baixada Vacinada API</h1>
          <p>API para gerenciamento de vacinação em Japeri</p>
          
          <div class="endpoint">
            <p><span class="method">GET</span> /api/public/health-unit</p>
            <p>List health units with optional filters: isActive, isFavorite, neighborhood</p>
          </div>
          
          <div class="endpoint">
            <p><span class="method">POST</span> /api/public/auth/login</p>
            <p>User authentication with username and password</p>
          </div>
          
          <p><a href="/api-docs">View JSON Schema</a></p>
        </body>
      </html>
    `);
  });
}
