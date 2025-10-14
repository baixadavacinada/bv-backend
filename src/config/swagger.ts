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
      '/api/public/auth/profile': {
        get: {
          summary: 'Get user profile',
          tags: ['Firebase Authentication'],
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
          tags: ['Firebase Authentication'],
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
