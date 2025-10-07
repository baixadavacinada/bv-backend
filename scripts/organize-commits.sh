#!/bin/bash

# Script para organizar commits granulares
# Este script deve ser executado depois de fazer backup das alterações

echo "🎯 Organizando commits granulares para Baixada Vacinada Backend"
echo "=================================================="

# Verificar se estamos em um repositório git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Erro: Este não é um repositório Git"
    exit 1
fi

echo "📋 Organizando commits por categorias lógicas..."

# 1. INFRAESTRUTURA E CONFIGURAÇÃO
echo "1️⃣ Commit: Atualização da infraestrutura do projeto"
git add package.json package-lock.json tsconfig.json
git commit -m "build: atualiza configuração do projeto

- Adiciona dependências de segurança (helmet, express-rate-limit)
- Adiciona dependências de validação (joi, bcrypt, uuid)
- Atualiza TypeScript para ES2020
- Adiciona configurações para testes e linting
- Instala mongoose para MongoDB

Closes: Configuração base para ambiente produção"

# 2. LIMPEZA E REMOÇÃO DE ARQUIVOS OBSOLETOS
echo "2️⃣ Commit: Remove arquivos obsoletos e redundantes"
git add -A
git commit -m "refactor: remove redundâncias e padroniza nomenclatura

- Remove repositórios duplicados (UbsRepository, VaccinationRepository)
- Remove implementações in-memory obsoletas
- Remove controllers antigos (ubsController, vaccinationController)
- Padroniza nomenclatura para 'healthUnit' em todo projeto
- Remove use cases não utilizados

Closes: Limpeza da arquitetura DDD"

# 3. DOMÍNIO E ENTIDADES
echo "3️⃣ Commit: Atualiza entidades de domínio"
git add src/domain/
git commit -m "feat(domain): implementa entidades seguindo DDD

- Atualiza User com roles (admin, agent, public)
- Implementa HealthUnit com geolocalização
- Adiciona VaccinationRecord com auditoria
- Cria Feedback com moderação
- Define Vaccine com doses configuráveis
- Adiciona interfaces de repositórios type-safe

Closes: Definição completa do domínio"

# 4. MODELOS MONGODB
echo "4️⃣ Commit: Implementa modelos MongoDB com validação"
git add src/infrastructure/database/models/
git commit -m "feat(database): modelos MongoDB com validação e índices

- Implementa schemas Mongoose com validação completa
- Adiciona índices para performance de consultas
- Corrige tipos ObjectId/string usando mongoUtils
- Adiciona campos de auditoria (createdBy, updatedBy)
- Implementa validações de negócio nos schemas

Closes: Camada de persistência robusta"

# 5. UTILITÁRIOS DE CONVERSÃO
echo "5️⃣ Commit: Implementa utilitários de conversão MongoDB"
git add src/infrastructure/database/utils/
git commit -m "feat(utils): conversão type-safe MongoDB/Domain

- Implementa mongoUtils para conversão ObjectId -> string
- Garante compatibilidade entre camadas
- Suporte para documentos lean e arrays
- Segue padrões DDD para IDs como string

Closes: Integração limpa MongoDB/Domain"

# 6. REPOSITÓRIOS
echo "6️⃣ Commit: Implementa repositórios MongoDB"
git add src/infrastructure/database/implementations/
git commit -m "feat(repositories): implementações MongoDB type-safe

- MongoUserRepository com busca por email
- MongoHealthUnitRepository com filtros geográficos
- MongoVaccineRepository para gestão de vacinas
- MongoFeedbackRepository para avaliações
- MongoVaccinationRecordRepository para registros
- Utiliza mongoUtils para conversões seguras

Closes: Camada de acesso a dados completa"

# 7. MIDDLEWARE DE SEGURANÇA
echo "7️⃣ Commit: Implementa middleware de segurança"
git add src/middlewares/security.ts
git commit -m "feat(security): middleware de segurança seguindo OWASP

- Rate limiting configurável por endpoint
- Headers de segurança com Helmet
- Sanitização de requests (NoSQL injection)
- Proteção contra XSS e CSRF
- Configuração CSP restritiva

Closes: Segurança de aplicação web"

# 8. MIDDLEWARE DE AUTENTICAÇÃO
echo "8️⃣ Commit: Sistema de autenticação e autorização"
git add src/middlewares/auth.ts
git commit -m "feat(auth): sistema RBAC com JWT

- Middleware de autenticação JWT
- Autorização baseada em roles (admin/agent/public)
- Verificação de usuário ativo
- Controle de ownership de recursos
- Preparação para integração Firebase

Closes: Sistema de autenticação completo"

# 9. MIDDLEWARE DE LOGGING
echo "9️⃣ Commit: Sistema de logging estruturado"
git add src/middlewares/logging.ts
git commit -m "feat(logging): sistema de logging com correlation ID

- Logger singleton com níveis estruturados
- Correlation ID para rastreamento de requests
- Middleware de logging de requests/responses
- Health check endpoint
- Métricas de performance (duração, tamanho)

Closes: Observabilidade da aplicação"

# 10. MIDDLEWARE DE ERROR HANDLING
echo "🔟 Commit: Sistema de tratamento de erros"
git add src/middlewares/errorHandling.ts
git commit -m "feat(errors): sistema de tratamento de erros robusto

- Classes de erro customizadas por tipo
- Middleware global de error handling
- Tratamento específico para erros MongoDB
- Async handler para eliminação de try/catch
- Logs estruturados de erros com context

Closes: Error handling profissional"

# 11. MIDDLEWARE DE VALIDAÇÃO
echo "1️⃣1️⃣ Commit: Sistema de validação de entrada"
git add src/middlewares/validation.ts
git commit -m "feat(validation): validação robusta de dados

- Validador configurável com múltiplas regras
- Schemas pré-definidos para entidades
- Validação de body e query parameters
- Suporte a tipos, comprimento, regex, enum
- Mensagens de erro descritivas em português

Closes: Validação de entrada de dados"

# 12. CONTROLLERS ATUALIZADOS
echo "1️⃣2️⃣ Commit: Controllers com nova arquitetura"
git add src/interfaces/controllers/
git commit -m "feat(controllers): controllers seguindo clean architecture

- UserController para gestão de usuários
- VaccineController para gestão de vacinas
- HealthUnitsController com CRUD completo
- Integração com middlewares de validação
- Error handling padronizado

Closes: Camada de apresentação atualizada"

# 13. ROTAS ATUALIZADAS
echo "1️⃣3️⃣ Commit: Sistema de rotas com middleware stack"
git add src/interfaces/routes/
git commit -m "feat(routes): rotas com middleware stack completo

- AdminRoutes com autenticação e autorização
- PublicRoutes para acesso público
- Integração de todos os middlewares
- Rate limiting por contexto
- Validação automática de entrada

Closes: Sistema de roteamento seguro"

# 14. USE CASES
echo "1️⃣4️⃣ Commit: Use cases seguindo Clean Architecture"
git add src/application/
git commit -m "feat(use-cases): casos de uso seguindo clean architecture

- ListHealthUnitsUseCase com filtros avançados
- RegisterVaccinationUseCase para registros
- Separação clara de responsabilidades
- Integração com repositórios

Closes: Camada de aplicação"

# 15. DOCUMENTAÇÃO
echo "1️⃣5️⃣ Commit: Documentação Swagger atualizada"
git add src/docs/
git commit -m "docs: documentação OpenAPI completa

- AdminRoutes documentados com autenticação
- PublicRoutes com exemplos
- Schemas de request/response
- Códigos de erro padronizados

Closes: Documentação da API"

# 16. CONFIGURAÇÃO E SERVER
echo "1️⃣6️⃣ Commit: Configuração do servidor"
git add src/config/ src/server.ts
git commit -m "feat(server): servidor com middleware stack completo

- Configuração de conexão MongoDB
- Servidor Express com middlewares ordenados
- Graceful shutdown
- Error handling global
- CORS configurado

Closes: Infraestrutura do servidor"

# 17. ARQUIVOS DE CONFIGURAÇÃO
echo "1️⃣7️⃣ Commit: Arquivos de configuração e utilitários"
git add .env.example context.txt package-improved.json scripts/
git commit -m "chore: arquivos de configuração e documentação

- Template .env.example
- Contexto do projeto atualizado
- Script de remoção de comentários
- Package.json melhorado com scripts

Closes: Configuração do ambiente"

# 18. COMMIT FINAL DE CLEANUP
echo "1️⃣8️⃣ Commit final: Cleanup de comentários"
git add -A
git commit -m "style: remove comentários desnecessários

- Remove comentários de código em todos arquivos .ts
- Mantém JSDoc para documentação
- Código mais limpo e legível
- Preparação para produção

Closes: Limpeza final do código"

echo "✅ Todos os commits organizados com sucesso!"
echo ""
echo "📊 Resumo dos commits criados:"
echo "   1. Infraestrutura e dependências"
echo "   2. Limpeza de redundâncias"
echo "   3. Entidades de domínio"
echo "   4. Modelos MongoDB"
echo "   5. Utilitários de conversão"
echo "   6. Repositórios"
echo "   7. Middleware de segurança"
echo "   8. Sistema de autenticação"
echo "   9. Sistema de logging"
echo "   10. Tratamento de erros"
echo "   11. Validação de dados"
echo "   12. Controllers"
echo "   13. Rotas"
echo "   14. Use cases"
echo "   15. Documentação"
echo "   16. Configuração do servidor"
echo "   17. Arquivos de configuração"
echo "   18. Cleanup final"
echo ""
echo "🎯 Próximos passos:"
echo "   - git push origin staging"
echo "   - Implementar integração Firebase"
echo "   - Adicionar testes unitários"
echo "   - Configurar CI/CD"