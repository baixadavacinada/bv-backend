import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express, Request, Response, NextFunction } from 'express';
import path from 'path';

// Simplified swagger options optimized for Vercel
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Baixada Vacinada API',
      version: '1.0.0',
      description: 'API para gerenciamento de vacinação em Japeri com Firebase Authentication',
    },
    servers: [
      { 
        url: process.env.NODE_ENV === 'production' 
          ? 'https://bv-backend.vercel.app' 
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'Firebase ID Token',
          description: 'Firebase ID Token obtained from Firebase Auth'
        }
      }
    },
    paths: {
      '/api/public/health-units': {
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
          summary: 'Login with email and password',
          tags: ['Firebase Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email', example: 'user@example.com' },
                    password: { type: 'string', example: 'password123' }
                  },
                  required: ['email', 'password']
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
                      data: {
                        type: 'object',
                        properties: {
                          uid: { type: 'string' },
                          email: { type: 'string' },
                          displayName: { type: 'string' },
                          emailVerified: { type: 'boolean' },
                          role: { type: 'string', example: 'public' },
                          provider: { type: 'string', example: 'email' },
                          customToken: { type: 'string', description: 'Use this token to authenticate with Firebase on client' },
                          message: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            },
            401: { description: 'Invalid credentials or user disabled' },
            400: { description: 'Missing email or password' }
          }
        }
      },
      '/api/public/auth/register': {
        post: {
          summary: 'Register with email and password',
          tags: ['Firebase Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email', example: 'user@example.com' },
                    password: { type: 'string', minLength: 6, example: 'password123' },
                    displayName: { type: 'string', example: 'João Silva' }
                  },
                  required: ['email', 'password']
                }
              }
            }
          },
          responses: {
            201: {
              description: 'User registered successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          uid: { type: 'string' },
                          email: { type: 'string' },
                          displayName: { type: 'string' },
                          emailVerified: { type: 'boolean', example: false },
                          message: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            },
            400: { description: 'Invalid input or weak password' },
            409: { description: 'Email already exists' }
          }
        }
      },
      '/api/public/auth/login/google': {
        post: {
          summary: 'Login with Google',
          tags: ['Firebase Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    idToken: { type: 'string', example: 'google-firebase-id-token' }
                  },
                  required: ['idToken']
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Google login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          uid: { type: 'string' },
                          email: { type: 'string' },
                          displayName: { type: 'string' },
                          photoURL: { type: 'string' },
                          emailVerified: { type: 'boolean' },
                          role: { type: 'string', example: 'public' },
                          provider: { type: 'string', example: 'google' },
                          token: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            },
            401: { description: 'Invalid Google token' }
          }
        }
      },
      '/api/public/auth/password-reset': {
        post: {
          summary: 'Send password reset email',
          tags: ['Firebase Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email', example: 'user@example.com' }
                  },
                  required: ['email']
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Password reset email sent',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string' },
                      resetLink: { type: 'string', description: 'Development only' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/public/auth/verify-token': {
        post: {
          summary: 'Verify Firebase ID token',
          tags: ['Firebase Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    idToken: { type: 'string', example: 'firebase-id-token' }
                  },
                  required: ['idToken']
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Token verified successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          uid: { type: 'string' },
                          email: { type: 'string' },
                          emailVerified: { type: 'boolean' },
                          customClaims: { type: 'object' }
                        }
                      }
                    }
                  }
                }
              }
            },
            401: { description: 'Invalid or expired token' }
          }
        }
      },
      '/api/auth/profile': {
        get: {
          summary: 'Get user profile',
          tags: ['User Profile (Auth Required)'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'User profile retrieved',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          uid: { type: 'string' },
                          email: { type: 'string' },
                          displayName: { type: 'string' },
                          emailVerified: { type: 'boolean' },
                          photoURL: { type: 'string' },
                          role: { type: 'string' },
                          lastSignInTime: { type: 'string' },
                          creationTime: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' }
          }
        },
        put: {
          summary: 'Update user profile',
          tags: ['User Profile (Auth Required)'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    displayName: { type: 'string', example: 'New Name' },
                    photoURL: { type: 'string', format: 'uri', example: 'https://example.com/photo.jpg' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Profile updated successfully' },
            401: { description: 'Unauthorized' }
          }
        }
      },
      '/api/admin/firebase/users': {
        post: {
          summary: 'Create Firebase user (Admin)',
          tags: ['Firebase Admin'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                    displayName: { type: 'string' },
                    role: { type: 'string', enum: ['public', 'agent', 'admin'], default: 'public' }
                  },
                  required: ['email', 'password']
                }
              }
            }
          },
          responses: {
            201: { description: 'User created successfully' },
            401: { description: 'Unauthorized' },
            409: { description: 'Email already exists' }
          }
        }
      },
      '/api/admin/users': {
        post: {
          summary: 'Create user (Admin)',
          tags: ['Admin Management'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'João Silva' },
                    email: { type: 'string', format: 'email', example: 'joao@example.com' },
                    role: { type: 'string', enum: ['admin', 'agent', 'public'], example: 'agent' }
                  },
                  required: ['name', 'email', 'role']
                }
              }
            }
          },
          responses: {
            201: { description: 'User created successfully' },
            401: { description: 'Unauthorized' },
            400: { description: 'Invalid input data' }
          }
        }
      },
      '/api/admin/vaccines': {
        post: {
          summary: 'Create vaccine (Admin)',
          tags: ['Admin Management'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'COVID-19 Pfizer' },
                    manufacturer: { type: 'string', example: 'Pfizer' },
                    ageGroup: { type: 'string', example: '12+' },
                    dosesRequired: { type: 'number', example: 2 },
                    intervalBetweenDoses: { type: 'number', example: 21 }
                  },
                  required: ['name', 'manufacturer', 'ageGroup']
                }
              }
            }
          },
          responses: {
            201: { description: 'Vaccine created successfully' },
            401: { description: 'Unauthorized' },
            400: { description: 'Invalid input data' }
          }
        }
      },
      '/api/admin/health-units': {
        get: {
          summary: 'List health units (Admin)',
          tags: ['Admin Management'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              description: 'Page number',
              schema: { type: 'number', example: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Items per page',
              schema: { type: 'number', example: 10, maximum: 100 }
            }
          ],
          responses: {
            200: { description: 'List of health units retrieved' },
            401: { description: 'Unauthorized' }
          }
        }
      },
      '/api/admin/firebase/users/claims': {
        put: {
          summary: 'Update user custom claims (Admin)',
          tags: ['Firebase Admin'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    uid: { type: 'string', example: 'firebase-user-uid' },
                    customClaims: {
                      type: 'object',
                      properties: {
                        role: { type: 'string', enum: ['admin', 'agent', 'public'] },
                        permissions: { type: 'array', items: { type: 'string' } }
                      }
                    }
                  },
                  required: ['uid', 'customClaims']
                }
              }
            }
          },
          responses: {
            200: { description: 'User claims updated successfully' },
            401: { description: 'Unauthorized' },
            404: { description: 'User not found' }
          }
        }
      },
      '/api/admin/firebase/users/{uid}/status': {
        patch: {
          summary: 'Toggle user status (Admin)',
          tags: ['Firebase Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'uid',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    disabled: { type: 'boolean', example: false }
                  },
                  required: ['disabled']
                }
              }
            }
          },
          responses: {
            200: { description: 'User status updated successfully' },
            401: { description: 'Unauthorized' },
            404: { description: 'User not found' }
          }
        }
      },
      '/api/admin/firebase/me': {
        get: {
          summary: 'Get current admin user info',
          tags: ['Firebase Admin'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Current user information',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          uid: { type: 'string' },
                          email: { type: 'string' },
                          displayName: { type: 'string' },
                          customClaims: { type: 'object' },
                          lastSignInTime: { type: 'string' },
                          creationTime: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' }
          }
        }
      },
      '/api/admin/firebase/users/{uid}': {
        get: {
          summary: 'Get Firebase user (Admin)',
          tags: ['Firebase Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'uid',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: { description: 'User information retrieved' },
            404: { description: 'User not found' }
          }
        },
        delete: {
          summary: 'Delete Firebase user (Admin)',
          tags: ['Firebase Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'uid',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: { description: 'User deleted successfully' },
            404: { description: 'User not found' }
          }
        }
      }
    }
  },
  apis: [] // No file scanning to prevent timeout
};

export const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  // Strategy: Completely inline Swagger UI to avoid Vercel serverless issues
  
  // JSON endpoint (always works)
  app.get('/api-docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json(swaggerSpec);
  });

  // Completely self-contained Swagger UI page
  app.get('/api-docs', (req: Request, res: Response) => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Baixada Vacinada API - Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin:0; background: #fafafa; }
    .swagger-ui .topbar { display: none !important; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .scheme-container { background: #fff; padding: 10px; border-radius: 4px; }
    #swagger-ui { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .custom-header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      text-align: center;
      margin-bottom: 20px;
      border-radius: 8px;
    }
    .loading { text-align: center; padding: 50px; font-size: 18px; color: #666; }
  </style>
</head>
<body>
  <div class="custom-header">
    <h1>🏥 Baixada Vacinada API</h1>
    <p>Sistema de Gerenciamento de Vacinação - Japeri, RJ</p>
  </div>
  
  <div id="swagger-ui">
    <div class="loading">Carregando documentação da API...</div>
  </div>

  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      try {
        console.log('Inicializando Swagger UI...');
        
        const ui = SwaggerUIBundle({
          url: window.location.origin + '/api-docs.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
          ],
          plugins: [
            SwaggerUIBundle.plugins.DownloadUrl
          ],
          layout: "StandaloneLayout",
          persistAuthorization: true,
          displayRequestDuration: true,
          filter: true,
          tryItOutEnabled: true,
          defaultModelsExpandDepth: 1,
          defaultModelExpandDepth: 1,
          docExpansion: 'list',
          validatorUrl: null,
          supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'],
          onComplete: function() {
            console.log('Swagger UI carregado com sucesso!');
          },
          onFailure: function(error) {
            console.error('Erro ao carregar Swagger UI:', error);
            document.getElementById('swagger-ui').innerHTML = 
              '<div style="padding: 20px; background: white; margin: 20px; border-radius: 5px; border-left: 4px solid #f44336;">' +
              '<h2>❌ Erro ao carregar documentação</h2>' +
              '<p>Não foi possível carregar a interface do Swagger UI.</p>' +
              '<p><strong>Alternativas:</strong></p>' +
              '<ul>' +
              '<li><a href="/api-docs.json" target="_blank">📄 Ver especificação JSON</a></li>' +
              '<li><a href="https://editor.swagger.io/?url=' + encodeURIComponent(window.location.origin + '/api-docs.json') + '" target="_blank">🌐 Abrir no Swagger Editor</a></li>' +
              '</ul>' +
              '<h3>📋 Principais Endpoints:</h3>' +
              '<div style="background: #f5f5f5; padding: 15px; border-radius: 4px; font-family: monospace;">' +
              '<div><strong>🔓 Públicos:</strong></div>' +
              '<div>GET /api/public/health-units - Listar unidades de saúde</div>' +
              '<div>POST /api/public/auth/login - Login com email/senha</div>' +
              '<div>POST /api/public/auth/register - Registro de usuário</div>' +
              '<div>POST /api/public/auth/login/google - Login com Google</div><br>' +
              '<div><strong>🔒 Protegidos (requer token):</strong></div>' +
              '<div>GET /api/auth/profile - Perfil do usuário</div>' +
              '<div>POST /api/admin/firebase/users - Criar usuário (admin)</div>' +
              '<div>GET /api/admin/health-units - Gerenciar unidades (admin)</div>' +
              '</div>' +
              '<p><em>💡 Use o header Authorization: Bearer [seu-token] para endpoints protegidos.</em></p>' +
              '</div>';
          }
        });
        
        window.ui = ui;
      } catch (error) {
        console.error('Erro crítico no Swagger UI:', error);
        document.getElementById('swagger-ui').innerHTML = 
          '<div style="padding: 20px; background: white; margin: 20px; border-radius: 5px; border-left: 4px solid #f44336;">' +
          '<h2>❌ Falha crítica</h2>' +
          '<p>Erro ao inicializar o Swagger UI: ' + error.message + '</p>' +
          '<p><a href="/api-docs.json">📄 Acessar especificação JSON diretamente</a></p>' +
          '</div>';
      }
    };
  </script>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(htmlContent);
  });
}
