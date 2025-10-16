import swaggerJsdoc from 'swagger-jsdoc';
import { Express, Request, Response } from 'express';

// Configuração otimizada para Vercel
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
        description: process.env.NODE_ENV === 'production' ? 'Produção' : 'Desenvolvimento'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'Firebase ID Token',
          description: 'Token de ID do Firebase obtido através do Firebase Auth'
        }
      }
    },
    paths: {
      '/api/public/health-units': {
        get: {
          summary: 'Listar unidades de saúde',
          tags: ['Público'],
          parameters: [
            {
              name: 'isActive',
              in: 'query',
              description: 'Filtrar por status ativo',
              schema: { type: 'boolean' }
            },
            {
              name: 'isFavorite', 
              in: 'query',
              description: 'Filtrar por status favorito',
              schema: { type: 'boolean' }
            },
            {
              name: 'neighborhood',
              in: 'query',
              description: 'Filtrar por nome do bairro',
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: {
              description: 'Lista de unidades de saúde',
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
                      message: { type: 'string', example: 'Unidades de saúde recuperadas com sucesso' },
                      count: { type: 'number', example: 10 }
                    }
                  }
                }
              }
            },
            500: {
              description: 'Erro do servidor',
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
                          message: { type: 'string', example: 'Erro ao buscar unidades de saúde' }
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
          summary: 'Login com email e senha',
          tags: ['Autenticação Firebase'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email', example: 'usuario@exemplo.com' },
                    password: { type: 'string', example: 'senha123' }
                  },
                  required: ['email', 'password']
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Login realizado com sucesso',
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
                          customToken: { type: 'string', description: 'Use este token para autenticar com Firebase no cliente' },
                          message: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            },
            401: { description: 'Credenciais inválidas ou usuário desabilitado' },
            400: { description: 'Email ou senha ausentes' }
          }
        }
      },
      '/api/public/auth/register': {
        post: {
          summary: 'Registrar com email e senha',
          tags: ['Autenticação Firebase'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email', example: 'usuario@exemplo.com' },
                    password: { type: 'string', minLength: 6, example: 'senha123' },
                    displayName: { type: 'string', example: 'João Silva' }
                  },
                  required: ['email', 'password']
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Usuário registrado com sucesso',
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
            400: { description: 'Entrada inválida ou senha fraca' },
            409: { description: 'Email já existe' }
          }
        }
      },
      '/api/public/auth/login/google': {
        post: {
          summary: 'Login com Google',
          tags: ['Autenticação Firebase'],
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
              description: 'Login com Google realizado com sucesso',
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
            401: { description: 'Token do Google inválido' }
          }
        }
      },
      '/api/public/auth/password-reset': {
        post: {
          summary: 'Enviar email de redefinição de senha',
          tags: ['Autenticação Firebase'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email', example: 'usuario@exemplo.com' }
                  },
                  required: ['email']
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Email de redefinição de senha enviado',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string' },
                      resetLink: { type: 'string', description: 'Apenas em desenvolvimento' }
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
          summary: 'Verificar token de ID do Firebase',
          tags: ['Autenticação Firebase'],
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
              description: 'Token verificado com sucesso',
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
            401: { description: 'Token inválido ou expirado' }
          }
        }
      },
      '/api/auth/profile': {
        get: {
          summary: 'Obter perfil do usuário',
          tags: ['Perfil do Usuário (Autenticação Necessária)'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Perfil do usuário recuperado',
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
            401: { description: 'Não autorizado' }
          }
        },
        put: {
          summary: 'Atualizar perfil do usuário',
          tags: ['Perfil do Usuário (Autenticação Necessária)'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    displayName: { type: 'string', example: 'Novo Nome' },
                    photoURL: { type: 'string', format: 'uri', example: 'https://exemplo.com/foto.jpg' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Perfil atualizado com sucesso' },
            401: { description: 'Não autorizado' }
          }
        }
      },
      '/api/admin/firebase/users': {
        post: {
          summary: 'Criar usuário Firebase (Admin)',
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
            201: { description: 'Usuário criado com sucesso' },
            401: { description: 'Não autorizado' },
            409: { description: 'Email já existe' }
          }
        }
      },
      '/api/admin/users': {
        post: {
          summary: 'Criar usuário (Admin)',
          tags: ['Gerenciamento Admin'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'João Silva' },
                    email: { type: 'string', format: 'email', example: 'joao@exemplo.com' },
                    role: { type: 'string', enum: ['admin', 'agent', 'public'], example: 'agent' }
                  },
                  required: ['name', 'email', 'role']
                }
              }
            }
          },
          responses: {
            201: { description: 'Usuário criado com sucesso' },
            401: { description: 'Não autorizado' },
            400: { description: 'Dados de entrada inválidos' }
          }
        }
      },
      '/api/admin/vaccines': {
        post: {
          summary: 'Criar vacina (Admin)',
          tags: ['Gerenciamento Admin'],
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
            201: { description: 'Vacina criada com sucesso' },
            401: { description: 'Não autorizado' },
            400: { description: 'Dados de entrada inválidos' }
          }
        }
      },
      '/api/admin/health-units': {
        get: {
          summary: 'Listar unidades de saúde (Admin)',
          tags: ['Gerenciamento Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              description: 'Número da página',
              schema: { type: 'number', example: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Itens por página',
              schema: { type: 'number', example: 10, maximum: 100 }
            }
          ],
          responses: {
            200: { description: 'Lista de unidades de saúde recuperada' },
            401: { description: 'Não autorizado' }
          }
        }
      },
      '/api/admin/firebase/users/claims': {
        put: {
          summary: 'Atualizar claims customizados do usuário (Admin)',
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
            200: { description: 'Claims do usuário atualizados com sucesso' },
            401: { description: 'Não autorizado' },
            404: { description: 'Usuário não encontrado' }
          }
        }
      },
      '/api/admin/firebase/users/{uid}/status': {
        patch: {
          summary: 'Alternar status do usuário (Admin)',
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
            200: { description: 'Status do usuário atualizado com sucesso' },
            401: { description: 'Não autorizado' },
            404: { description: 'Usuário não encontrado' }
          }
        }
      },
      '/api/admin/firebase/me': {
        get: {
          summary: 'Obter informações do usuário admin atual',
          tags: ['Firebase Admin'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Informações do usuário atual',
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
            401: { description: 'Não autorizado' }
          }
        }
      },
      '/api/admin/firebase/users/{uid}': {
        get: {
          summary: 'Obter usuário Firebase (Admin)',
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
            200: { description: 'Informações do usuário recuperadas' },
            404: { description: 'Usuário não encontrado' }
          }
        },
        delete: {
          summary: 'Excluir usuário Firebase (Admin)',
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
            200: { description: 'Usuário excluído com sucesso' },
            404: { description: 'Usuário não encontrado' }
          }
        }
      }
    }
  },
  apis: []
};

export const apiSpec = swaggerJsdoc(options);

export function setupApiDocs(app: Express) {
  // Endpoint JSON para especificação OpenAPI
  app.get('/api-docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json(apiSpec);
  });

  // Scalar API Reference - Interface moderna para documentação
  app.get('/api-docs', (req: Request, res: Response) => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Baixada Vacinada API - Documentação</title>
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

  // Endpoint alternativo com configuração inline
  app.get('/docs', (req: Request, res: Response) => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Baixada Vacinada API - Documentação</title>
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
        "title": "Baixada Vacinada API",
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