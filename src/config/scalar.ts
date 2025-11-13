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
    },
    schemas: {
      ProblemDetails: {
        type: 'object',
        description: 'RFC 7807 - Detalhes de Problema HTTP',
        properties: {
          type: {
            type: 'string',
            example: 'https://api.baixada-vacinada.com/errors/validation',
            description: 'URI que identifica o tipo de erro'
          },
          title: {
            type: 'string',
            example: 'Validation Failed',
            description: 'Resumo legível do tipo de problema'
          },
          status: {
            type: 'integer',
            example: 400,
            description: 'Código HTTP do status'
          },
          detail: {
            type: 'string',
            example: 'The field email is required',
            description: 'Explicação específica do problema'
          },
          instance: {
            type: 'string',
            example: '550e8400-e29b-41d4-a716-446655440000',
            description: 'Correlation ID para rastreamento'
          },
          code: {
            type: 'string',
            example: 'VALIDATION_ERROR',
            description: 'Código de erro interno'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:45.123Z',
            description: 'Timestamp ISO 8601'
          },
          path: {
            type: 'string',
            example: '/api/auth/profile',
            description: 'Caminho do endpoint que gerou o erro'
          }
        },
        required: ['type', 'title', 'status', 'instance', 'code', 'timestamp', 'path']
      },
      ValidationError: {
        allOf: [
          { $ref: '#/components/schemas/ProblemDetails' },
          {
            type: 'object',
            properties: {
              fields: {
                type: 'object',
                description: 'Campos com erro de validação',
                example: {
                  email: 'Invalid email format',
                  password: 'Password must be at least 8 characters'
                }
              }
            }
          }
        ]
      },
      ConflictError: {
        allOf: [
          { $ref: '#/components/schemas/ProblemDetails' },
          {
            type: 'object',
            properties: {
              conflictField: {
                type: 'string',
                description: 'Campo que causou o conflito',
                example: 'email'
              }
            }
          }
        ]
      },
      AuthenticationError: {
        allOf: [
          { $ref: '#/components/schemas/ProblemDetails' },
          {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                enum: ['INVALID_TOKEN', 'TOKEN_EXPIRED', 'UNAUTHORIZED'],
                description: 'Tipo específico de erro de autenticação'
              }
            }
          }
        ]
      },
      NotFoundError: {
        allOf: [
          { $ref: '#/components/schemas/ProblemDetails' },
          {
            type: 'object',
            properties: {
              resource: {
                type: 'string',
                description: 'Tipo de recurso não encontrado',
                example: 'User'
              }
            }
          }
        ]
      }
    }
  },
  'x-error-responses': {
    '400-Validation': {
      description: 'Bad Request - Erro de validação',
      content: {
        'application/problem+json': {
          schema: { $ref: '#/components/schemas/ValidationError' },
          example: {
            type: 'https://api.baixada-vacinada.com/errors/validation',
            title: 'Validation Failed',
            status: 400,
            detail: 'The request contains invalid data',
            instance: '550e8400-e29b-41d4-a716-446655440000',
            code: 'VALIDATION_ERROR',
            timestamp: '2024-01-15T10:30:45.123Z',
            path: '/api/auth/profile',
            fields: {
              email: 'Invalid email format',
              displayName: 'Display name is required'
            }
          }
        }
      }
    },
    '401-Unauthorized': {
      description: 'Unauthorized - Token ausente ou inválido',
      content: {
        'application/problem+json': {
          schema: { $ref: '#/components/schemas/AuthenticationError' },
          example: {
            type: 'https://api.baixada-vacinada.com/errors/unauthorized',
            title: 'Authentication Required',
            status: 401,
            detail: 'The provided authentication token is invalid',
            instance: '550e8400-e29b-41d4-a716-446655440000',
            code: 'INVALID_TOKEN',
            timestamp: '2024-01-15T10:30:45.123Z',
            path: '/api/auth/profile'
          }
        }
      }
    },
    '401-TokenExpired': {
      description: 'Unauthorized - Token expirado',
      content: {
        'application/problem+json': {
          schema: { $ref: '#/components/schemas/AuthenticationError' },
          example: {
            type: 'https://api.baixada-vacinada.com/errors/unauthorized',
            title: 'Token Expired',
            status: 401,
            detail: 'The authentication token has expired',
            instance: '550e8400-e29b-41d4-a716-446655440000',
            code: 'TOKEN_EXPIRED',
            timestamp: '2024-01-15T10:30:45.123Z',
            path: '/api/auth/profile',
            expiredAt: '2024-01-15T09:30:45.000Z'
          }
        }
      }
    },
    '403-Forbidden': {
      description: 'Forbidden - Usuário não tem permissão',
      content: {
        'application/problem+json': {
          schema: { $ref: '#/components/schemas/ProblemDetails' },
          example: {
            type: 'https://api.baixada-vacinada.com/errors/forbidden',
            title: 'Access Denied',
            status: 403,
            detail: 'You do not have permission to access this resource',
            instance: '550e8400-e29b-41d4-a716-446655440000',
            code: 'FORBIDDEN',
            timestamp: '2024-01-15T10:30:45.123Z',
            path: '/api/admin/users'
          }
        }
      }
    },
    '404-NotFound': {
      description: 'Not Found - Recurso não existe',
      content: {
        'application/problem+json': {
          schema: { $ref: '#/components/schemas/NotFoundError' },
          example: {
            type: 'https://api.baixada-vacinada.com/errors/not-found',
            title: 'Resource Not Found',
            status: 404,
            detail: 'User not found',
            instance: '550e8400-e29b-41d4-a716-446655440000',
            code: 'NOT_FOUND',
            timestamp: '2024-01-15T10:30:45.123Z',
            path: '/api/admin/users/abc123',
            resource: 'User'
          }
        }
      }
    },
    '409-Conflict': {
      description: 'Conflict - Recurso já existe',
      content: {
        'application/problem+json': {
          schema: { $ref: '#/components/schemas/ConflictError' },
          example: {
            type: 'https://api.baixada-vacinada.com/errors/conflict',
            title: 'Resource Already Exists',
            status: 409,
            detail: 'Resource with email already exists in database',
            instance: '550e8400-e29b-41d4-a716-446655440000',
            code: 'DUPLICATE_KEY',
            timestamp: '2024-01-15T10:30:45.123Z',
            path: '/api/public/auth/register',
            conflictField: 'email'
          }
        }
      }
    },
    '500-InternalError': {
      description: 'Internal Server Error - Erro no servidor',
      content: {
        'application/problem+json': {
          schema: { $ref: '#/components/schemas/ProblemDetails' },
          example: {
            type: 'https://api.baixada-vacinada.com/errors/internal-server-error',
            title: 'Internal Server Error',
            status: 500,
            detail: 'An unexpected error occurred. Please contact support if the problem persists.',
            instance: '550e8400-e29b-41d4-a716-446655440000',
            code: 'INTERNAL_ERROR',
            timestamp: '2024-01-15T10:30:45.123Z',
            path: '/api/auth/profile'
          }
        }
      }
    }
  },
  paths: {
    '/api/public/auth/login': {
      post: {
        summary: 'Login com email e senha (Sem autenticação)',
        tags: ['Autenticação Firebase - Sem Autenticação'],
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
        summary: 'Registrar com email e senha (Sem autenticação)',
        tags: ['Autenticação Firebase - Sem Autenticação'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email', example: 'usuario@exemplo.com' },
                  displayName: { type: 'string', example: 'João Silva' }
                },
                required: ['email', 'displayName']
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
    '/api/public/health-units': {
      get: {
        summary: 'Listar unidades de saúde (Sem autenticação)',
        tags: ['Público - Sem Autenticação'],
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
        summary: 'Listar vacinas disponíveis (Sem autenticação)',
        tags: ['Público - Sem Autenticação'],
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
                          batchNumber: { type: 'string', example: 'LOT123456', description: 'Número do lote da vacina' },
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

    // Auth Profile endpoints (Authenticated)
    '/api/auth/profile': {
      get: {
        summary: 'Obter meu perfil (Autenticado)',
        tags: ['Auth - Profile - Autenticado'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Perfil do usuário recuperado com sucesso' },
          401: { description: 'Não autorizado - token ausente ou inválido' }
        }
      },
      post: {
        summary: 'Criar novo perfil - Onboarding (Autenticado)',
        tags: ['Auth - Profile - Autenticado'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  name: { type: 'string' },
                  phone: { type: 'string' },
                  birthDate: { type: 'string', format: 'date' },
                  address: { type: 'object' },
                  healthConditions: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Perfil criado com sucesso' },
          409: { description: 'Perfil já existe' },
          400: { description: 'Dados inválidos' },
          401: { description: 'Não autorizado' }
        }
      },
      put: {
        summary: 'Atualizar meu perfil (Autenticado)',
        tags: ['Auth - Profile - Autenticado'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  displayName: { type: 'string' },
                  photoURL: { type: 'string', format: 'uri' },
                  name: { type: 'string' }
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

    // Public Feedback endpoints
    '/api/public/feedback': {
      post: {
        summary: 'Criar feedback sobre unidade de saúde',
        tags: ['Público - Feedback - Autenticado'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  healthUnitId: { type: 'string', example: '60a1b2c3d4e5f6789012347' },
                  rating: { 
                    type: 'number', 
                    minimum: 1, 
                    maximum: 5,
                    example: 5
                  },
                  vaccineSuccess: {
                    type: 'string',
                    maxLength: 500,
                    example: 'Vacina disponível e aplicada com sucesso',
                    description: 'Avaliação sobre disponibilidade e sucesso da vacinação'
                  },
                  waitTime: {
                    type: 'string',
                    maxLength: 500,
                    example: 'Tempo de espera foi curto, aproximadamente 15 minutos',
                    description: 'Avaliação sobre tempo de espera'
                  },
                  respectfulService: {
                    type: 'string',
                    maxLength: 500,
                    example: 'Profissionais foram educados e respeitosos',
                    description: 'Avaliação sobre respeito e educação no atendimento'
                  },
                  cleanLocation: {
                    type: 'string',
                    maxLength: 500,
                    example: 'Local muito limpo e bem organizado',
                    description: 'Avaliação sobre limpeza e organização do local'
                  },
                  recommendation: {
                    type: 'string',
                    maxLength: 500,
                    example: 'Recomendo esta unidade para todos da comunidade',
                    description: 'Recomendação geral ou comentários adicionais'
                  },
                  isAnonymous: { type: 'boolean', example: false }
                },
                required: ['healthUnitId', 'rating']
              }
            }
          }
        },
        responses: {
          201: { description: 'Feedback criado com sucesso' },
          401: { description: 'Não autorizado' },
          400: { description: 'Dados de entrada inválidos' }
        }
      }
    },
    '/api/public/feedback/health-unit/{healthUnitId}': {
      get: {
        summary: 'Listar feedbacks de uma unidade de saúde',
        tags: ['Público - Feedback - Autenticado'],
        parameters: [
          {
            name: 'healthUnitId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID da unidade de saúde'
          }
        ],
        responses: {
          200: { 
            description: 'Feedbacks da unidade recuperados com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    data: {
                      type: 'array',
                      items: { type: 'object' }
                    },
                    total: { type: 'number' },
                    averageRating: { type: 'number', example: 4.2 }
                  }
                }
              }
            }
          },
          400: { description: 'ID da unidade de saúde inválido' }
        }
      }
    },
    
    '/api/admin/vaccines': {
      post: {
        summary: 'Criar vacina (Admin - Autenticado)',
        tags: ['Gerenciamento Admin - Vacinas - Autenticado'],
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
                  description: { type: 'string', example: 'Vacina contra COVID-19 baseada em mRNA' },
                  batchNumber: { type: 'string', example: 'LOT123456', description: 'Número do lote da vacina' }
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
        summary: 'Listar todas as vacinas (Admin - Autenticado)',
        tags: ['Gerenciamento Admin - Vacinas - Autenticado'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { 
            description: 'Lista de vacinas recuperada com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          _id: { type: 'string' },
                          name: { type: 'string' },
                          manufacturer: { type: 'string' },
                          ageGroup: { type: 'string' },
                          doses: { type: 'array', items: { type: 'string' } },
                          description: { type: 'string' },
                          batchNumber: { type: 'string', description: 'Número do lote da vacina' },
                          isActive: { type: 'boolean' },
                          createdAt: { type: 'string', format: 'date-time' },
                          updatedAt: { type: 'string', format: 'date-time' }
                        }
                      }
                    },
                    total: { type: 'number' }
                  }
                }
              }
            }
          },
          401: { description: 'Não autorizado' }
        }
      }
    },
    '/api/admin/vaccines/{id}': {
      get: {
        summary: 'Obter vacina por ID (Admin - Autenticado)',
        tags: ['Gerenciamento Admin - Vacinas - Autenticado'],
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
          200: { 
            description: 'Vacina recuperada com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        manufacturer: { type: 'string' },
                        ageGroup: { type: 'string' },
                        doses: { type: 'array', items: { type: 'string' } },
                        description: { type: 'string' },
                        batchNumber: { type: 'string', description: 'Número do lote da vacina' },
                        isActive: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          },
          404: { description: 'Vacina não encontrada' },
          401: { description: 'Não autorizado' }
        }
      },
      put: {
        summary: 'Atualizar vacina (Admin - Autenticado)',
        tags: ['Gerenciamento Admin - Vacinas - Autenticado'],
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
                  batchNumber: { type: 'string', description: 'Número do lote da vacina' },
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
        summary: 'Remover vacina (Admin - Autenticado)',
        tags: ['Gerenciamento Admin - Vacinas - Autenticado'],
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
        tags: ['Gerenciamento Admin - Registros de Vacinação - Autenticado'],
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
        tags: ['Gerenciamento Admin - Registros de Vacinação - Autenticado'],
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
        tags: ['Gerenciamento Admin - Registros de Vacinação - Autenticado'],
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
        tags: ['Gerenciamento Admin - Registros de Vacinação - Autenticado'],
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
        tags: ['Gerenciamento Admin - Registros de Vacinação - Autenticado'],
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

    // Dashboard and Reports endpoints
    '/api/admin/dashboard/stats': {
      get: {
        summary: 'Obter estatísticas completas do dashboard (Admin)',
        tags: ['Dashboard e Relatórios - Autenticado'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Estatísticas do dashboard recuperadas com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        totalUsers: { type: 'number' },
                        totalAppointments: { type: 'number' },
                        totalVaccinationRecords: { type: 'number' },
                        totalHealthUnits: { type: 'number' },
                        totalVaccines: { type: 'number' },
                        totalFeedbacks: { type: 'number' },
                        totalNotifications: { type: 'number' },
                        activeHealthUnits: { type: 'number' },
                        completedAppointments: { type: 'number' },
                        cancelledAppointments: { type: 'number' },
                        averageFeedbackRating: { type: 'number' },
                        unreadNotifications: { type: 'number' },
                        recentActivity: {
                          type: 'object',
                          properties: {
                            newAppointmentsToday: { type: 'number' },
                            vaccinationsToday: { type: 'number' },
                            newFeedbacksToday: { type: 'number' }
                          }
                        },
                        monthlyStats: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              month: { type: 'string' },
                              appointments: { type: 'number' },
                              vaccinations: { type: 'number' },
                              feedbacks: { type: 'number' }
                            }
                          }
                        },
                        topHealthUnits: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string' },
                              appointmentCount: { type: 'number' },
                              averageRating: { type: 'number' }
                            }
                          }
                        },
                        vaccineDistribution: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              vaccineId: { type: 'string' },
                              vaccineName: { type: 'string' },
                              count: { type: 'number' },
                              percentage: { type: 'number' }
                            }
                          }
                        }
                      }
                    },
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          401: { description: 'Não autorizado' }
        }
      }
    },
    '/api/admin/dashboard/quick-stats': {
      get: {
        summary: 'Obter estatísticas rápidas (Admin)',
        tags: ['Dashboard e Relatórios - Autenticado'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Estatísticas rápidas recuperadas com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        totalAppointments: { type: 'number' },
                        totalVaccinations: { type: 'number' },
                        activeHealthUnits: { type: 'number' },
                        todayAppointments: { type: 'number' },
                        averageRating: { type: 'number' }
                      }
                    },
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          401: { description: 'Não autorizado' }
        }
      }
    },
    '/api/admin/reports/vaccination': {
      get: {
        summary: 'Relatório de vacinação (Admin)',
        tags: ['Dashboard e Relatórios - Autenticado'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'startDate',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'Data inicial para o relatório'
          },
          {
            name: 'endDate',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'Data final para o relatório'
          },
          {
            name: 'healthUnitId',
            in: 'query',
            schema: { type: 'string' },
            description: 'ID da unidade de saúde'
          },
          {
            name: 'vaccineId',
            in: 'query',
            schema: { type: 'string' },
            description: 'ID da vacina'
          }
        ],
        responses: {
          200: {
            description: 'Relatório de vacinação gerado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        summary: {
                          type: 'object',
                          properties: {
                            totalVaccinations: { type: 'number' },
                            uniquePatients: { type: 'number' },
                            averageAge: { type: 'number' },
                            genderDistribution: { type: 'object' },
                            doseDistribution: { type: 'object' }
                          }
                        },
                        byHealthUnit: { type: 'array' },
                        byVaccine: { type: 'array' },
                        byDate: { type: 'array' },
                        byAgeGroup: { type: 'array' },
                        coverage: { type: 'object' }
                      }
                    },
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          400: { description: 'Parâmetros inválidos' },
          401: { description: 'Não autorizado' }
        }
      }
    },
    '/api/admin/reports/health-units': {
      get: {
        summary: 'Relatório de unidades de saúde (Admin)',
        tags: ['Dashboard e Relatórios - Autenticado'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'startDate',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'Data inicial para o relatório'
          },
          {
            name: 'endDate',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'Data final para o relatório'
          },
          {
            name: 'isActive',
            in: 'query',
            schema: { type: 'boolean' },
            description: 'Filtrar por status ativo'
          },
          {
            name: 'city',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filtrar por cidade'
          },
          {
            name: 'state',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filtrar por estado'
          }
        ],
        responses: {
          200: {
            description: 'Relatório de unidades de saúde gerado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        summary: { type: 'object' },
                        performance: { type: 'array' },
                        geographical: { type: 'array' },
                        ratings: { type: 'array' }
                      }
                    },
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          400: { description: 'Parâmetros inválidos' },
          401: { description: 'Não autorizado' }
        }
      }
    },
    '/api/admin/reports/feedbacks': {
      post: {
        summary: 'Gerar relatório de feedbacks em Excel (Admin)',
        tags: ['Dashboard e Relatórios - Autenticado'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ubsId: { 
                    type: 'string', 
                    description: 'ID da unidade de saúde (opcional para filtrar por UBS específica)'
                  },
                  startDate: { 
                    type: 'string', 
                    format: 'date-time',
                    description: 'Data inicial para o relatório (opcional)'
                  },
                  endDate: { 
                    type: 'string', 
                    format: 'date-time',
                    description: 'Data final para o relatório (opcional)'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Arquivo Excel com relatório de feedbacks gerado com sucesso',
            content: {
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                schema: {
                  type: 'string',
                  format: 'binary'
                }
              }
            }
          },
          400: { description: 'Parâmetros inválidos' },
          401: { description: 'Não autorizado' },
          500: { description: 'Erro ao gerar relatório' }
        }
      }
    },
    '/api/admin/reports/users': {
      post: {
        summary: 'Gerar relatório de usuários em Excel (Admin)',
        tags: ['Dashboard e Relatórios - Autenticado'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  roleFilter: { 
                    type: 'string',
                    enum: ['admin', 'agent', 'public'],
                    description: 'Filtrar por perfil de usuário (opcional)'
                  },
                  statusFilter: { 
                    type: 'string',
                    enum: ['active', 'inactive', 'all'],
                    description: 'Filtrar por status do usuário (opcional, padrão: all)'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Arquivo Excel com relatório de usuários gerado com sucesso',
            content: {
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                schema: {
                  type: 'string',
                  format: 'binary'
                }
              }
            }
          },
          400: { description: 'Parâmetros inválidos' },
          401: { description: 'Não autorizado' },
          500: { description: 'Erro ao gerar relatório' }
        }
      }
    },
    
    // Admin Feedback endpoints
    '/api/admin/feedback': {
      get: {
        summary: 'Listar todos os feedbacks (Admin)',
        tags: ['Gerenciamento Admin - Feedback - Autenticado'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'healthUnitId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filtrar por unidade de saúde'
          }
        ],
        responses: {
          200: { description: 'Lista de feedbacks recuperada com sucesso' },
          401: { description: 'Não autorizado' }
        }
      }
    },
    '/api/admin/feedback/health-unit': {
      get: {
        summary: 'Listar feedbacks por unidade de saúde (Admin)',
        tags: ['Gerenciamento Admin - Feedback - Autenticado'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'healthUnitId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'ID da unidade de saúde'
          }
        ],
        responses: {
          200: { description: 'Feedbacks da unidade recuperados com sucesso' },
          401: { description: 'Não autorizado' },
          400: { description: 'ID da unidade de saúde é obrigatório' }
        }
      }
    },
    '/api/admin/feedback/{id}': {
      get: {
        summary: 'Obter feedback por ID (Admin)',
        tags: ['Gerenciamento Admin - Feedback - Autenticado'],
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
          200: { description: 'Feedback recuperado com sucesso' },
          404: { description: 'Feedback não encontrado' },
          401: { description: 'Não autorizado' }
        }
      }
    },
    '/api/admin/feedback/{id}/moderate': {
      patch: {
        summary: 'Moderar feedback (Admin)',
        tags: ['Gerenciamento Admin - Feedback - Autenticado'],
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
                  isActive: { type: 'boolean', example: true }
                },
                required: ['isActive']
              }
            }
          }
        },
        responses: {
          200: { description: 'Feedback moderado com sucesso' },
          404: { description: 'Feedback não encontrado' },
          401: { description: 'Não autorizado' }
        }
      }
    },
    
    // Enhanced Appointment Admin endpoints
    '/api/admin/appointments/stats': {
      get: {
        summary: 'Obter estatísticas de agendamentos (Admin)',
        tags: ['Gerenciamento Admin - Agendamentos - Autenticado'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'startDate',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'Data inicial para filtro (padrão: 1 ano atrás)'
          },
          {
            name: 'endDate',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'Data final para filtro (padrão: hoje)'
          }
        ],
        responses: {
          200: { 
            description: 'Estatísticas recuperadas com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        totalAppointments: { type: 'number' },
                        scheduledAppointments: { type: 'number' },
                        confirmedAppointments: { type: 'number' },
                        completedAppointments: { type: 'number' },
                        cancelledAppointments: { type: 'number' },
                        noShowAppointments: { type: 'number' },
                        averageCompletionRate: { type: 'number' },
                        appointmentsByHealthUnit: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              healthUnitId: { type: 'string' },
                              count: { type: 'number' }
                            }
                          }
                        },
                        appointmentsByVaccine: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              vaccineId: { type: 'string' },
                              count: { type: 'number' }
                            }
                          }
                        },
                        appointmentsByMonth: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              month: { type: 'string' },
                              count: { type: 'number' }
                            }
                          }
                        }
                      }
                    },
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          401: { description: 'Não autorizado' },
          400: { description: 'Datas inválidas' }
        }
      }
    },
    '/api/admin/appointments/{id}/complete-vaccination': {
      patch: {
        summary: 'Completar agendamento e criar registro de vacinação (Admin)',
        tags: ['Gerenciamento Admin - Agendamentos - Autenticado'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID do agendamento'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  appliedBy: { 
                    type: 'string', 
                    example: 'Dr. João Silva',
                    description: 'Nome do profissional que aplicou a vacina'
                  },
                  vaccinationNotes: { 
                    type: 'string', 
                    maxLength: 1000,
                    example: 'Vacinação aplicada sem intercorrências',
                    description: 'Observações sobre a vacinação'
                  },
                  reactions: { 
                    type: 'string', 
                    maxLength: 500,
                    example: 'Sem reações adversas observadas',
                    description: 'Reações ou efeitos observados'
                  },
                  nextDoseDate: { 
                    type: 'string', 
                    format: 'date',
                    example: '2024-02-15',
                    description: 'Data prevista para próxima dose (se aplicável)'
                  }
                },
                required: ['appliedBy']
              }
            }
          }
        },
        responses: {
          200: { 
            description: 'Agendamento completado e registro de vacinação criado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        appointment: { type: 'object' },
                        vaccinationRecord: { type: 'object' }
                      }
                    },
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          404: { description: 'Agendamento não encontrado' },
          401: { description: 'Não autorizado' },
          400: { description: 'Status do agendamento inválido ou dados incorretos' }
        }
      }
    },
    
    // Admin Health Units endpoints
    '/api/admin/health-units': {
      get: {
        summary: 'Listar unidades de saúde (Admin)',
        tags: ['Gerenciamento Admin - Unidades de Saúde - Autenticado'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'isActive',
            in: 'query',
            schema: { type: 'boolean' },
            description: 'Filtrar por status ativo'
          },
          {
            name: 'isFavorite',
            in: 'query',
            schema: { type: 'boolean' },
            description: 'Filtrar por favoritas'
          },
          {
            name: 'neighborhood',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filtrar por bairro'
          },
          {
            name: 'city',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filtrar por cidade'
          },
          {
            name: 'state',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filtrar por estado'
          }
        ],
        responses: {
          200: { description: 'Unidades de saúde listadas com sucesso' },
          401: { description: 'Não autorizado' }
        }
      },
      post: {
        summary: 'Criar nova unidade de saúde (Admin)',
        tags: ['Gerenciamento Admin - Unidades de Saúde - Autenticado'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', minLength: 3, maxLength: 200, example: 'UBS Centro' },
                  address: { type: 'string', minLength: 10, maxLength: 500, example: 'Rua das Flores, 123' },
                  neighborhood: { type: 'string', example: 'Centro' },
                  city: { type: 'string', example: 'São Paulo' },
                  state: { type: 'string', example: 'SP' },
                  zipCode: { type: 'string', example: '01234567' },
                  phone: { type: 'string', example: '(11) 1234-5678' },
                  operatingHours: {
                    type: 'object',
                    properties: {
                      monday: { type: 'string', example: '08:00-17:00' },
                      tuesday: { type: 'string', example: '08:00-17:00' },
                      wednesday: { type: 'string', example: '08:00-17:00' },
                      thursday: { type: 'string', example: '08:00-17:00' },
                      friday: { type: 'string', example: '08:00-17:00' },
                      saturday: { type: 'string', example: '08:00-12:00' },
                      sunday: { type: 'string', example: 'Fechado' }
                    }
                  },
                  availableVaccines: { type: 'array', items: { type: 'string' } },
                  geolocation: {
                    type: 'object',
                    properties: {
                      lat: { type: 'number', example: -23.5505 },
                      lng: { type: 'number', example: -46.6333 }
                    }
                  },
                  isActive: { type: 'boolean', default: true },
                  isFavorite: { type: 'boolean', default: false }
                },
                required: ['name', 'address', 'neighborhood', 'city', 'state', 'zipCode']
              }
            }
          }
        },
        responses: {
          201: { description: 'Unidade de saúde criada com sucesso' },
          400: { description: 'Dados de entrada inválidos' },
          401: { description: 'Não autorizado' }
        }
      }
    },
    '/api/admin/health-units/{id}': {
      get: {
        summary: 'Obter unidade de saúde por ID (Admin)',
        tags: ['Gerenciamento Admin - Unidades de Saúde - Autenticado'],
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
          200: { description: 'Unidade de saúde encontrada' },
          404: { description: 'Unidade de saúde não encontrada' },
          401: { description: 'Não autorizado' }
        }
      },
      put: {
        summary: 'Atualizar unidade de saúde (Admin)',
        tags: ['Gerenciamento Admin - Unidades de Saúde - Autenticado'],
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
                  name: { type: 'string', minLength: 3, maxLength: 200 },
                  address: { type: 'string', minLength: 10, maxLength: 500 },
                  neighborhood: { type: 'string' },
                  city: { type: 'string' },
                  state: { type: 'string' },
                  zipCode: { type: 'string' },
                  phone: { type: 'string' },
                  operatingHours: { type: 'object' },
                  availableVaccines: { type: 'array', items: { type: 'string' } },
                  geolocation: { type: 'object' },
                  isActive: { type: 'boolean' },
                  isFavorite: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Unidade de saúde atualizada com sucesso' },
          404: { description: 'Unidade de saúde não encontrada' },
          400: { description: 'Dados de entrada inválidos' },
          401: { description: 'Não autorizado' }
        }
      },
      delete: {
        summary: 'Remover unidade de saúde (Admin)',
        tags: ['Gerenciamento Admin - Unidades de Saúde - Autenticado'],
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
          200: { description: 'Unidade de saúde removida com sucesso' },
          404: { description: 'Unidade de saúde não encontrada' },
          401: { description: 'Não autorizado' }
        }
      }
    },
    
    // Admin Notifications endpoints
    '/api/admin/notifications': {
      get: {
        summary: 'Listar todas as notificações (Admin)',
        tags: ['Gerenciamento Admin - Notificações - Autenticado'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filtrar por usuário'
          },
          {
            name: 'isRead',
            in: 'query',
            schema: { type: 'boolean' },
            description: 'Filtrar por status de leitura'
          },
          {
            name: 'type',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filtrar por tipo de notificação'
          },
          {
            name: 'startDate',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'Data inicial'
          },
          {
            name: 'endDate',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'Data final'
          }
        ],
        responses: {
          200: { description: 'Notificações listadas com sucesso' },
          401: { description: 'Não autorizado' }
        }
      },
      post: {
        summary: 'Criar nova notificação (Admin)',
        tags: ['Gerenciamento Admin - Notificações - Autenticado'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  userId: { type: 'string', example: '60a1b2c3d4e5f67890123456' },
                  title: { type: 'string', minLength: 3, maxLength: 200, example: 'Lembrete de Vacinação' },
                  message: { 
                    type: 'string', 
                    minLength: 10, 
                    maxLength: 1000,
                    example: 'Sua segunda dose da vacina está agendada para amanhã às 14:00.'
                  },
                  type: { 
                    type: 'string', 
                    enum: ['appointment_reminder', 'vaccine_available', 'dose_due', 'system_update', 'general'],
                    example: 'appointment_reminder'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      appointmentId: { type: 'string' },
                      vaccineId: { type: 'string' },
                      healthUnitId: { type: 'string' },
                      actionUrl: { type: 'string' }
                    }
                  },
                  scheduledFor: { type: 'string', format: 'date-time', example: '2024-01-15T14:00:00Z' }
                },
                required: ['userId', 'title', 'message', 'type']
              }
            }
          }
        },
        responses: {
          201: { description: 'Notificação criada com sucesso' },
          400: { description: 'Dados de entrada inválidos' },
          401: { description: 'Não autorizado' }
        }
      }
    },
    '/api/admin/notifications/{id}': {
      get: {
        summary: 'Obter notificação por ID (Admin)',
        tags: ['Gerenciamento Admin - Notificações - Autenticado'],
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
          200: { description: 'Notificação encontrada' },
          404: { description: 'Notificação não encontrada' },
          401: { description: 'Não autorizado' }
        }
      },
      delete: {
        summary: 'Excluir notificação (Admin)',
        tags: ['Gerenciamento Admin - Notificações - Autenticado'],
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
          200: { description: 'Notificação excluída com sucesso' },
          404: { description: 'Notificação não encontrada' },
          401: { description: 'Não autorizado' }
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