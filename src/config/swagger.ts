import swaggerJsdoc from 'swagger-jsdoc';
import { Express, Request, Response } from 'express';

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
  // JSON endpoint for OpenAPI specification
  app.get('/api-docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json(swaggerSpec);
  });

  // Scalar API Reference - Modern alternative to Swagger UI
  app.get('/api-docs', (req: Request, res: Response) => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Baixada Vacinada API - Documentation</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
  <script
    id="api-reference"
    type="application/json"
    data-url="/api-docs.json">
  </script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(htmlContent);
  });

  // Alternative endpoint with inline configuration
  app.get('/docs', (req: Request, res: Response) => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Baixada Vacinada API - Documentation</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
  <script
    id="api-reference"
    type="application/json">
    {
      "spec": {
        "url": "/api-docs.json"
      },
      "theme": "purple",
      "layout": "modern",
      "hideDownloadButton": false,
      "hideDarkModeToggle": false,
      "showSidebar": true,
      "customCss": "",
      "searchHotKey": "k",
      "metaData": {
        "title": "🏥 Baixada Vacinada API",
        "description": "Sistema de Gerenciamento de Vacinação - Japeri, RJ",
        "ogDescription": "API completa para gerenciamento de vacinação com Firebase Authentication",
        "ogTitle": "Baixada Vacinada API Documentation",
        "twitterCard": "summary_large_image"
      }
    }
  </script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(htmlContent);
  });
}
