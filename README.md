# Baixada Vacinada - Backend API

API REST completa para gerenciamento de campanhas de vacinação, unidades de saúde, usuários e materiais educativos. Desenvolvida com Node.js, Express e MongoDB.

## Visão Geral

O Baixada Vacinada Backend fornece endpoints robustos e seguros para todas as operações do aplicativo de vacinação. Implementa autenticação Firebase, autorização baseada em roles, validação de dados, tratamento de erros abrangente e integração com serviços terceiros (Google Calendar, notificações).

A API segue padrões RESTful, versionamento semântico e documentação automática via Swagger.

## Requisitos do Sistema

- Node.js 20.x ou superior
- MongoDB 5.0+ (local ou cloud via MongoDB Atlas)
- Firebase Project (autenticação e custom claims)
- npm 10.x ou yarn 9.x
- Postman ou similar para testes (coleção incluída)

### Dependências de Serviços Externos

- Firebase Admin SDK (autenticação, validação de tokens)
- MongoDB (database)
- Google Calendar API (agendamento de campanhas)
- Nodemailer (envio de emails, opcional)

## Instalação

### Clonar Repositório

```bash
git clone https://github.com/baixadavacinada/baixada-vacinada.git
cd baixada-vacinada/bv-backend
```

### Instalar Dependências

```bash
npm install
```

### Configuração de Ambiente

Crie arquivo `.env` na raiz do projeto:

```env
NODE_ENV=development
PORT=8000
DB_URI=mongodb://localhost:27017/baixada-vacinada
DB_URI_TEST=mongodb://localhost:27017/baixada-vacinada-test

FIREBASE_PROJECT_ID=seu_project_id
FIREBASE_PRIVATE_KEY=sua_private_key
FIREBASE_CLIENT_EMAIL=seu_client_email

JWT_SECRET=sua_chave_secreta_muito_segura_aqui
JWT_EXPIRE=7d

GOOGLE_CALENDAR_API_KEY=sua_chave_api_google
GOOGLE_CALENDAR_ID=seu_calendar_id

CORS_ORIGIN=http://localhost:3000,https://seu-dominio.com

LOG_LEVEL=info

API_VERSION=v1
API_DOCUMENTATION_URL=/api/docs
```

Um arquivo `.env.example` está incluído. Solicite valores reais ao lead do projeto.

### Banco de Dados

#### Local MongoDB

```bash
brew install mongodb-community      # macOS
npm run db:seed                     # Seed com dados iniciais
```

#### MongoDB Atlas (Cloud)

1. Crie cluster em https://www.mongodb.com/cloud/atlas
2. Obtenha connection string
3. Configure em `DB_URI` no `.env`

## Desenvolvimento Local

### Iniciar Servidor

```bash
npm run dev
```

Servidor rodará em `http://localhost:8000`.

Output esperado:
```
[INFO] Server running on port 8000
[INFO] Database connected: mongodb://localhost:27017/baixada-vacinada
[INFO] Accessibility validation enabled
```

### Visualizar API Documentation

Acesse `http://localhost:8000/api/docs` (Swagger UI).

### Testes

```bash
npm run test              # Executa testes
npm run test:watch       # Modo watch
npm run test:coverage    # Relatório de cobertura
```

### Build

```bash
npm run build
npm start  # Executa versão compilada
```

## Scripts Disponíveis

### npm run dev
Inicia servidor com hot reload via `ts-node-dev`.

### npm run build
Compila TypeScript para JavaScript.

Output: `dist/` directory.

### npm start
Executa versão compilada (use após build).

**Nota:** Antes de usar em produção, sempre faça build.

### npm run test
Executa toda suite de testes com Jest.

Testes unitários e de integração, coverage report.

### npm run test:watch
Modo watch automático, reexecuta ao salvar.

### npm run test:coverage
Gera relatório HTML de cobertura.

Abra `coverage/lcov-report/index.html`.

### npm run test:integration
Executa apenas testes de integração.

### npm run lint
Verifica qualidade de código com ESLint.

Integrado em pre-commit via Husky.

### npm run format
Formata código com Prettier.

```bash
npm run format -- --check  # Apenas verifica
```

## Estrutura de Diretórios

```
src/
├── server.ts                      # Entrada da aplicação
├── config/
│   ├── cors.ts                    # Configuração CORS
│   ├── database.ts                # Conexão MongoDB
│   ├── env.ts                     # Variáveis de ambiente
│   ├── firebase.ts                # Firebase config
│   └── scalar.ts                  # Swagger/OpenAPI
├── domain/
│   ├── entities/                  # Interfaces/types do domínio
│   └── repositories/              # Interfaces de repositórios
├── infrastructure/
│   ├── database/
│   │   ├── models/                # Schemas Mongoose
│   │   └── repositories/          # Implementação de repositórios
│   └── external-services/         # Integrações externas
├── application/
│   └── use-cases/                 # Lógica de negócio
├── interfaces/
│   ├── controllers/               # Controllers por domínio
│   │   ├── public/
│   │   ├── admin/
│   │   └── agent/
│   └── routes/                    # Definição de rotas
├── middlewares/
│   ├── auth.ts                    # Autenticação básica
│   ├── authMiddleware.ts          # Autenticação request
│   ├── firebaseAuth.ts            # Validação Firebase
│   ├── firebaseAuthAdvanced.ts    # Validação com custom claims
│   ├── errorHandling.ts           # Tratamento de erros
│   ├── logging.ts                 # Logging de requests
│   ├── security.ts                # Headers de segurança
│   └── validation.ts              # Validação de payloads
├── services/
│   ├── claimsService.ts           # Gestão de custom claims
│   └── externalServices/          # Serviços terceiros
├── utils/
│   ├── errorLogger.ts             # Logger centralizado
│   ├── validators.ts              # Validadores reutilizáveis
│   └── helpers.ts                 # Funções auxiliares
├── docs/
│   ├── adminRoutes.docs.ts        # Documentação admin
│   ├── authRoutes.docs.ts         # Documentação autenticação
│   └── publicRoutes.docs.ts       # Documentação pública
├── api/
│   └── index.ts                   # Vercel Serverless handler
└── types/
    └── index.ts                   # Definições TypeScript globais

tests/
├── fixtures/                      # Dados de teste
├── helpers/                       # Funções auxiliares de teste
├── integration/                   # Testes de integração
├── mocks/                         # Mocks e stubs
├── globalSetup.ts                 # Setup global
└── globalTeardown.ts              # Cleanup global
```

## Arquitetura

### Camadas

```
┌──────────────────────────────────┐
│       Routes (Rotas)             │ Interface com client
├──────────────────────────────────┤
│   Middlewares (Autenticação,     │ Cross-cutting concerns
│   Validação, Logging)            │
├──────────────────────────────────┤
│   Controllers                    │ Orquestra lógica de request
├──────────────────────────────────┤
│   Use Cases (Application)        │ Lógica de negócio
├──────────────────────────────────┤
│   Repositories                   │ Acesso a dados
├──────────────────────────────────┤
│   MongoDB/Firebase               │ Persistência
└──────────────────────────────────┘
```

### Padrões Utilizados

- **MVC Adaptado**: Controllers delegam para use cases
- **Repository Pattern**: Abstração de acesso a dados
- **Dependency Injection**: Loose coupling entre camadas
- **Middleware Chain**: Validação, autenticação, logging
- **Error Handling**: Camada centralizada de tratamento

## Autenticação e Autorização

### Fluxo de Autenticação

1. Cliente envia credenciais para `/auth/login`
2. Backend valida com Firebase
3. Backend gera JWT com custom claims (role)
4. Cliente recebe token e armazena em HTTPOnly cookie
5. Cada request inclui token no header Authorization
6. Middleware valida token e extrai claims

### Custom Claims (Roles)

```typescript
type UserRole = 'public' | 'agent' | 'admin'

admin   // Acesso total ao sistema
agent   // Funcionário da saúde, acesso expandido
public  // Usuário comum, acesso limitado
```

Gerenciados via `claimsService.ts`.

### Middleware de Autenticação

#### firebaseAuth
Valida token Firebase básico.

```typescript
app.get('/rota', firebaseAuth, (req, res) => {
  // req.user disponível
})
```

#### firebaseAuthAdvanced
Valida token + custom claims (role).

```typescript
app.get('/admin-rota', 
  firebaseAuthAdvanced(['admin']), 
  (req, res) => {
    // Apenas admin pode acessar
  }
)
```

## Endpoints da API

### Autenticação (/auth)

#### POST /auth/register
Registra novo usuário.

**Payload:**
```json
{
  "email": "usuario@email.com",
  "password": "senha_segura",
  "displayName": "Nome do Usuário",
  "acceptTerms": true
}
```

**Response (201):**
```json
{
  "uid": "firebase_uid",
  "email": "usuario@email.com",
  "displayName": "Nome do Usuário",
  "token": "jwt_token"
}
```

#### POST /auth/login
Autentica usuário.

**Payload:**
```json
{
  "email": "usuario@email.com",
  "password": "senha"
}
```

**Response (200):**
```json
{
  "token": "jwt_token",
  "user": { /* dados do usuário */ }
}
```

#### POST /auth/logout
Invalida sessão (opcional, geralmente client-side).

### Saúde Pública (/api/public)

#### GET /api/public/health-units
Lista unidades de saúde ativas.

**Query Parameters:**
- `isActive`: boolean (default: true)
- `page`: number (default: 1)
- `limit`: number (default: 20)

**Response:**
```json
{
  "units": [
    {
      "_id": "unit_id",
      "name": "Clínica Centro",
      "address": "Rua A, 123",
      "latitude": -24.5555,
      "longitude": -46.6666,
      "schedule": { /* horários */ }
    }
  ],
  "total": 45,
  "page": 1
}
```

#### GET /api/public/health-units/:id
Detalhes de unidade de saúde específica.

#### GET /api/public/vaccines
Lista todas as vacinas disponíveis.

**Response:**
```json
{
  "vaccines": [
    {
      "_id": "vaccine_id",
      "name": "COVID-19",
      "manufacturer": "Pfizer",
      "ageRequirement": 12
    }
  ]
}
```

#### GET /api/public/educational-materials
Lista materiais educativos.

**Query Parameters:**
- `category`: string (e.g., "myths", "benefits")
- `search`: string

#### PATCH /api/public/users/favorites/educational-materials
Salva/remove material favorito.

**Autenticado:** Sim (requer token Firebase)

**Payload:**
```json
{
  "materialId": "material_id"
}
```

**Response:**
```json
{
  "favoriteEducationalMaterials": [
    { "materialId": "...", "addedAt": "2025-11-13T..." }
  ]
}
```

#### GET /api/public/users/favorites/educational-materials
Recupera materiais favoritos do usuário.

**Autenticado:** Sim

#### POST /api/public/feedback
Submete avaliação de UBS.

**Payload:**
```json
{
  "healthUnitId": "507f1f77bcf86cd799439011",
  "vaccineSuccessRating": 4,
  "waitTimeRating": 3,
  "respectfulServiceRating": 5,
  "cleanLocationRating": 4,
  "rating": 4,
  "npsScore": 8,
  "isAnonymous": true
}
```

**Response (201):** Feedback criado com métricas de NPS incluídas.

#### GET /api/public/feedback/:healthUnitId
Lista avaliações de uma UBS com métricas de NPS.

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 20)

Para mais detalhes, veja `docs-dev/FEEDBACK_SYSTEM.md`.

### Admin (/api/admin)

#### GET /api/admin/health-units
CRUD de unidades de saúde (admin only).

#### POST /api/admin/health-units
Cria nova unidade de saúde.

**Autenticado:** admin

#### PUT /api/admin/health-units/:id
Atualiza unidade de saúde.

#### DELETE /api/admin/health-units/:id
Deleta unidade de saúde.

#### GET /api/admin/users
Lista usuários do sistema.

**Query Parameters:**
- `role`: 'public' | 'admin' | 'agent'
- `status`: 'active' | 'suspended'

#### GET /api/admin/vaccination-records
Relatório de vacinações.

**Query Parameters:**
- `startDate`: ISO date
- `endDate`: ISO date
- `vaccineId`: string
- `healthUnitId`: string

#### POST /api/admin/campaigns
Cria nova campanha de vacinação.

**Payload:**
```json
{
  "name": "Campanha de Reforço COVID",
  "description": "Reforço para maiores de 60",
  "startDate": "2025-12-01",
  "endDate": "2025-12-15",
  "vaccines": ["vaccine_id_1", "vaccine_id_2"]
}
```

#### GET /api/admin/reports/feedback
Gera relatório CSV de avaliações com NPS.

**Autenticado:** admin

**Query Parameters:**
- `ubsId`: ID da UBS (opcional)
- `startDate`: ISO date (opcional)
- `endDate`: ISO date (opcional)

**Response:** Arquivo CSV com colunas: Data, UBS, Vacina Obtida, Tempo de Espera, Atendimento Respeitoso, Local Limpo, Recomendação (NPS), Rating Geral

Para mais detalhes, veja `docs-dev/FEEDBACK_SYSTEM.md`.

### Agente de Saúde (/api/agent)

#### POST /api/agent/vaccination-records
Registra vacinação (agent/admin).

**Payload:**
```json
{
  "userId": "user_id",
  "vaccineId": "vaccine_id",
  "healthUnitId": "unit_id",
  "applicationDate": "2025-11-13",
  "nextDueDate": "2026-05-13"
}
```

#### GET /api/agent/pending-notifications
Busca notificações pendentes para enviar.

## Modelos de Dados

### User Schema

```typescript
interface User {
  _id: ObjectId
  uid: string              // Firebase UID
  email: string
  displayName: string
  cpf?: string
  birthDate?: Date
  phone?: string
  address?: {
    street: string
    number: string
    city: string
    state: string
    postalCode: string
  }
  profile: {
    acceptedTerms: boolean
    acceptedTermsDate: Date
    favoriteEducationalMaterials: Array<{
      materialId: ObjectId
      addedAt: Date
    }>
  }
  role: 'public' | 'agent' | 'admin'
  status: 'active' | 'suspended' | 'deleted'
  createdAt: Date
  updatedAt: Date
}
```

### HealthUnit Schema

```typescript
interface HealthUnit {
  _id: ObjectId
  name: string
  type: 'clinic' | 'health_post' | 'hospital'
  address: {
    street: string
    number: string
    city: string
    state: string
    latitude: number
    longitude: number
  }
  contact: {
    phone: string
    email: string
  }
  schedule: {
    monday: { open: string, close: string }
    // ... outros dias
  }
  vaccines: ObjectId[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

### VaccinationRecord Schema

```typescript
interface VaccinationRecord {
  _id: ObjectId
  userId: ObjectId
  vaccineId: ObjectId
  healthUnitId: ObjectId
  applicationDate: Date
  nextDueDate?: Date
  notes?: string
  adverseEffects: boolean
  adverseEffectsDescription?: string
  healthWorker: string
  createdAt: Date
}
```

## Validação

Todos os inputs são validados com Joi:

```typescript
const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  acceptTerms: Joi.boolean().required()
})

const { error, value } = schema.validate(payload)
if (error) {
  throw new ValidationError(error.details[0].message)
}
```

Validação automática em middleware.

## Tratamento de Erros

### Hierarquia de Erros

```typescript
class ApiError extends Error {
  statusCode: number
  isOperational: boolean
}

class ValidationError extends ApiError (400)
class UnauthorizedError extends ApiError (401)
class ForbiddenError extends ApiError (403)
class NotFoundError extends ApiError (404)
class ConflictError extends ApiError (409)
```

### Middleware de Erro

```typescript
app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500
  const message = error.message || 'Internal Server Error'
  
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: error.code,
      timestamp: new Date()
    }
  })
})
```

Cliente recebe erro estruturado com stack trace (dev) ou mensagem genérica (prod).

## Logging

Logger centralizado em `utils/errorLogger.ts`:

```typescript
logger.info('Usuário registrado', { userId: user.id })
logger.warn('Tentativa de acesso não autorizado', { userId: req.user.id })
logger.error('Erro ao conectar banco', error, { context: 'database' })
```

Logs salvos em arquivo + console em desenvolvimento.

## Testes

### Estrutura

```typescript
describe('POST /api/public/health-units', () => {
  let app: Express.Application
  
  beforeAll(async () => {
    app = await setupTestApp()
  })
  
  afterEach(async () => {
    await HealthUnit.deleteMany({})
  })
  
  it('should return health units', async () => {
    await HealthUnit.create({ name: 'Clínica 1' })
    
    const response = await supertest(app)
      .get('/api/public/health-units')
      .expect(200)
    
    expect(response.body.units).toHaveLength(1)
  })
})
```

### Executar Testes

```bash
npm run test                    # Uma vez
npm run test:watch            # Watch mode
npm run test:coverage         # Com relatório
npm run test:integration      # Apenas integração
```

Cobertura mínima requerida: 80%.

## Segurança

### Implementações

- CORS configurável por ambiente
- Helmet para headers de segurança
- Rate limiting em endpoints críticos
- Validação de entrada (Joi schemas)
- Sanitização de outputs
- HTTPS em produção (forçado)
- JWT com expiração
- Senhas com bcrypt (rounds: 10)
- MongoDB com índices de performance

### Checklist de Segurança

- Variáveis sensíveis apenas em `.env` (nunca em código)
- Senhas nunca em logs
- Tokens com expiração curta
- Refresh tokens em cookies HTTPOnly
- Validação de CORS origin
- Rate limiting ativo
- Helmet headers configurados

## Performance

### Otimizações

- MongoDB indexes em campos frequentes (email, uid, createdAt)
- Aggregation pipeline para relatórios complexos
- Pagination obrigatória em listagens
- Caching de dados estáticos (Redis, opcional)
- Compressão gzip em respostas
- Connection pooling no MongoDB

### Monitoramento

```bash
npm run analyze:performance
```

Gera relatório de endpoints mais lentos.

## Implantação

### Vercel Serverless

1. Conecte repositório GitHub a Vercel
2. Configure variáveis de ambiente
3. Deploy automático ao fazer push para main

Função serverless em `api/index.ts`.

### Docker

```bash
docker build -t bv-backend .
docker run -e PORT=8000 -e DB_URI=mongodb://... bv-backend
```

### Produção

```bash
npm run build
npm start
```

Certifique-se de:
- NODE_ENV=production
- DB_URI aponta para MongoDB production
- JWT_SECRET é complexo
- CORS_ORIGIN é domínio específico
- Rate limiting ativo
- Logging estruturado

## Documentação API

Swagger/OpenAPI em `/api/docs` (desenvolvimento) ou `/api/v1/docs` (produção).

### Documentação de Recursos

Veja os arquivos em `docs-dev/`:

- **AUTHENTICATION_FLOW.md** - Fluxo de autenticação e autorização
- **FEEDBACK_SYSTEM.md** - Sistema de avaliações (feedback) de UBS com NPS
- **CLAIMS_SYSTEM_API.md** - Gerenciamento de custom claims Firebase
- **MIDDLEWARE_MIGRATION_GUIDE.md** - Guia de migração de middlewares
- **CONTRIBUTORS.md** - Informações de contribuidores

### Swagger/OpenAPI

Documentação gerada automaticamente a partir de comentários JSDoc:

```typescript
/**
 * @swagger
 * /api/public/health-units:
 *   get:
 *     summary: Lista unidades de saúde
 *     parameters:
 *       - name: isActive
 *         in: query
 *         type: boolean
 */
```

Use Postman collection: `Baixada_Vacinada_API.postman_collection.json`

## Troubleshooting

### "MongooseError: The uri parameter to openUri() must be a string"

Verifique `DB_URI` em `.env`.

### "Firebase authentication failed"

Verifique credenciais Firebase em `.env`:
- FIREBASE_PROJECT_ID
- FIREBASE_PRIVATE_KEY (formato com quebras de linha)
- FIREBASE_CLIENT_EMAIL

### "CORS error: Access-Control-Allow-Origin"

Frontend URL não está em `CORS_ORIGIN` no `.env`.

```env
CORS_ORIGIN=http://localhost:3000,https://seu-dominio.com
```

### "Rate limit exceeded"

Aguarde ou reinicie aplicação. Limites resetam a cada hora.

### "Tests fail with 'Cannot find module'"

```bash
npm run build
npm test
```

## Contribuindo

1. Crie branch: `git checkout -b feature/sua-feature`
2. Faça commits atômicos
3. Pre-commit hooks validam automaticamente
4. Abra Pull Request com descrição clara

Validações automáticas:
- ESLint: Qualidade de código
- TypeScript: Type checking
- Jest: Testes
- Cobertura: Mínimo 80%

## Roadmap

- [ ] Integração com SMS/WhatsApp para notificações
- [ ] Dashboard com métricas em tempo real
- [ ] Export de dados para análise
- [ ] Agendamento automático via Google Calendar
- [ ] Certificado digital de vacinação
- [ ] Suporte a múltiplas secretarias de saúde

## Suporte

Para problemas:
1. Verifique `.env` (variáveis de ambiente)
2. Consulte logs: `tail -f logs/app.log`
3. Rode testes: `npm run test`
4. Abra issue no GitHub com detalhes

## Licença

MIT. Veja LICENSE para detalhes.

## Versão

- **Backend**: 1.0.0
- **Node**: 20.x
- **Express**: 4.18.2
- **MongoDB**: 5.0+
- **TypeScript**: 5.x
