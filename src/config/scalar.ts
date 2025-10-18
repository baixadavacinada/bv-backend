import { Express, Request, Response } from 'express';

const apiSpec = {
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
          500: { description: 'Erro do servidor' }
        }
      }
    },
    '/api/public/vaccines': {
      get: {
        summary: 'Listar vacinas disponíveis',
        tags: ['Público'],
        responses: {
          200: {
            description: 'Lista de vacinas disponíveis',
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
                          name: { type: 'string', example: 'COVID-19 Pfizer' },
                          manufacturer: { type: 'string', example: 'Pfizer' },
                          ageGroup: { type: 'string', example: '12+' },
                          doses: { 
                            type: 'array',
                            items: { type: 'string' },
                            example: ['1ª dose', '2ª dose', 'reforço']
                          },
                          isActive: { type: 'boolean' }
                        }
                      }
                    },
                    message: { type: 'string', example: 'Vacinas recuperadas com sucesso' },
                    count: { type: 'number', example: 5 }
                  }
                }
              }
            }
          },
          500: { description: 'Erro do servidor' }
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
          200: { description: 'Login realizado com sucesso' },
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
          201: { description: 'Usuário registrado com sucesso' },
          400: { description: 'Entrada inválida ou senha fraca' },
          409: { description: 'Email já existe' }
        }
      }
    },
    '/api/admin/vaccines': {
      post: {
        summary: 'Criar vacina (Admin)',
        tags: ['Gerenciamento Admin - Vacinas'],
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
                  doses: { 
                    type: 'array',
                    items: { type: 'string' },
                    example: ['1ª dose', '2ª dose', 'reforço']
                  },
                  description: { type: 'string', example: 'Vacina contra COVID-19 baseada em mRNA' }
                },
                required: ['name', 'manufacturer', 'ageGroup', 'doses']
              }
            }
          }
        },
        responses: {
          201: { description: 'Vacina criada com sucesso' },
          401: { description: 'Não autorizado' },
          400: { description: 'Dados de entrada inválidos' }
        }
      },
      get: {
        summary: 'Listar todas as vacinas (Admin)',
        tags: ['Gerenciamento Admin - Vacinas'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Lista de vacinas recuperada com sucesso' },
          401: { description: 'Não autorizado' }
        }
      }
    },
    '/api/admin/vaccines/{id}': {
      get: {
        summary: 'Obter vacina por ID (Admin)',
        tags: ['Gerenciamento Admin - Vacinas'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: { description: 'Vacina recuperada com sucesso' },
          404: { description: 'Vacina não encontrada' },
          401: { description: 'Não autorizado' }
        }
      },
      put: {
        summary: 'Atualizar vacina (Admin)',
        tags: ['Gerenciamento Admin - Vacinas'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
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
                  name: { type: 'string' },
                  manufacturer: { type: 'string' },
                  ageGroup: { type: 'string' },
                  doses: { type: 'array', items: { type: 'string' } },
                  description: { type: 'string' },
                  isActive: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Vacina atualizada com sucesso' },
          404: { description: 'Vacina não encontrada' },
          401: { description: 'Não autorizado' }
        }
      },
      delete: {
        summary: 'Remover vacina (Admin)',
        tags: ['Gerenciamento Admin - Vacinas'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: { description: 'Vacina removida com sucesso' },
          404: { description: 'Vacina não encontrada' },
          401: { description: 'Não autorizado' }
        }
      }
    },
    
    // Vaccination Records Admin endpoints
    '/api/admin/vaccination-records': {
      post: {
        summary: 'Criar registro de vacinação (Admin)',
        tags: ['Gerenciamento Admin - Registros de Vacinação'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  residentId: { type: 'string', example: '60a1b2c3d4e5f6789012345' },
                  vaccineId: { type: 'string', example: '60a1b2c3d4e5f6789012346' },
                  healthUnitId: { type: 'string', example: '60a1b2c3d4e5f6789012347' },
                  appliedBy: { type: 'string', example: 'Dr. João Silva' },
                  dose: { 
                    type: 'string', 
                    enum: ['1ª dose', '2ª dose', '3ª dose', 'dose única', 'reforço'],
                    example: '1ª dose'
                  },
                  date: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
                  notes: { type: 'string', example: 'Paciente reagiu bem à vacinação' }
                },
                required: ['residentId', 'vaccineId', 'healthUnitId', 'appliedBy', 'dose', 'date']
              }
            }
          }
        },
        responses: {
          201: { description: 'Registro de vacinação criado com sucesso' },
          401: { description: 'Não autorizado' },
          400: { description: 'Dados de entrada inválidos' }
        }
      },
      get: {
        summary: 'Listar registros de vacinação (Admin)',
        tags: ['Gerenciamento Admin - Registros de Vacinação'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'healthUnitId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filtrar por unidade de saúde'
          },
          {
            name: 'startDate',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'Data inicial para filtro'
          },
          {
            name: 'endDate',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'Data final para filtro'
          },
          {
            name: 'residentId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filtrar por ID do morador'
          },
          {
            name: 'vaccineId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filtrar por ID da vacina'
          }
        ],
        responses: {
          200: { description: 'Lista de registros de vacinação recuperada com sucesso' },
          401: { description: 'Não autorizado' }
        }
      }
    },
    '/api/admin/vaccination-records/{id}': {
      get: {
        summary: 'Obter registro de vacinação por ID (Admin)',
        tags: ['Gerenciamento Admin - Registros de Vacinação'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: { description: 'Registro de vacinação recuperado com sucesso' },
          404: { description: 'Registro não encontrado' },
          401: { description: 'Não autorizado' }
        }
      },
      put: {
        summary: 'Atualizar registro de vacinação (Admin)',
        tags: ['Gerenciamento Admin - Registros de Vacinação'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
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
                  notes: { type: 'string' },
                  dose: { 
                    type: 'string', 
                    enum: ['1ª dose', '2ª dose', '3ª dose', 'dose única', 'reforço']
                  },
                  date: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Registro de vacinação atualizado com sucesso' },
          404: { description: 'Registro não encontrado' },
          401: { description: 'Não autorizado' }
        }
      },
      delete: {
        summary: 'Remover registro de vacinação (Admin)',
        tags: ['Gerenciamento Admin - Registros de Vacinação'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: { description: 'Registro de vacinação removido com sucesso' },
          404: { description: 'Registro não encontrado' },
          401: { description: 'Não autorizado' }
        }
      }
    },
    
    // Public Vaccination Records endpoints
    '/api/public/vaccination-records/my': {
      get: {
        summary: 'Obter meus registros de vacinação',
        tags: ['Público - Registros de Vacinação'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Registros de vacinação do usuário recuperados com sucesso' },
          401: { description: 'Não autorizado' }
        }
      }
    },
    '/api/public/vaccination-records/user/{userId}': {
      get: {
        summary: 'Obter registros de vacinação de um usuário específico',
        tags: ['Público - Registros de Vacinação'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID do usuário'
          }
        ],
        responses: {
          200: { description: 'Registros de vacinação do usuário recuperados com sucesso' },
          401: { description: 'Não autorizado' },
          400: { description: 'ID de usuário inválido' }
        }
      }
    }
  }
};

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
}