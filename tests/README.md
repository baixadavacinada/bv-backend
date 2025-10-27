# Testes de Integração - Baixada Vacinada API

Este documento descreve os testes de integração implementados para a API da Baixada Vacinada.

## Visão Geral

Os testes de integração foram desenvolvidos para validar os endpoints da API diretamente, testando cenários positivos e negativos conforme solicitado. A implementação segue o padrão "Given-When-Then" e utiliza uma abordagem leve sem Docker.

## Tecnologias Utilizadas

- **Jest**: Framework de testes principal
- **Supertest**: Para fazer requisições HTTP aos endpoints
- **MongoDB Memory Server**: Banco de dados em memória para testes (leve e rápido)
- **Firebase Admin SDK (mockado)**: Para autenticação nos testes

## Estrutura dos Testes

```
tests/
├── fixtures/
│   └── testData.ts          # Dados de exemplo para todos os testes
├── helpers/
│   ├── testApp.ts           # Inicialização da aplicação para testes
│   └── authHelpers.ts       # Helpers de autenticação (JWT)
├── integration/
│   ├── healthUnits.test.ts  # Testes de Unidades de Saúde
│   ├── appointments.test.ts # Testes de Agendamentos
│   ├── dashboard.test.ts    # Testes de Dashboard e Relatórios
│   ├── notifications.test.ts # Testes de Notificações
│   ├── feedback.test.ts     # Testes de Feedback
│   └── auth.test.ts         # Testes de Autenticação
├── globalSetup.ts           # Configuração global (MongoDB Memory Server)
├── globalTeardown.ts        # Limpeza global
└── setup.ts                 # Configuração por teste
```

## Cobertura dos Testes

### 1. Health Units (Unidades de Saúde)
- ✅ **CRUD Completo**: Criação, listagem, atualização e remoção
- ✅ **Autenticação**: Validação de admin vs usuário comum
- ✅ **Endpoints Públicos**: Listagem pública sem autenticação
- ✅ **Validação**: Dados obrigatórios e formatos
- ✅ **Cenários de Erro**: IDs inexistentes, dados inválidos

### 2. Appointments (Agendamentos)
- ✅ **Agendamento**: Criação de agendamentos
- ✅ **Cancelamento**: Cancelamento por usuário e admin
- ✅ **Atualização de Status**: Admin pode atualizar status
- ✅ **Slots Disponíveis**: Verificação de horários disponíveis
- ✅ **Validações**: Conflitos de horário, limites de capacidade

### 3. Dashboard e Relatórios
- ✅ **Estatísticas Gerais**: Contadores e métricas
- ✅ **Estatísticas de Agendamentos**: Por período e status
- ✅ **Relatórios de Vacinação**: Dados de vacinação
- ✅ **Relatórios de Unidades**: Performance por unidade
- ✅ **Testes de Performance**: Validação de tempo de resposta

### 4. Notifications (Notificações)
- ✅ **Criação**: Admin pode criar notificações
- ✅ **Listagem**: Usuários veem suas notificações
- ✅ **Marcar como Lida**: Individual e em lote
- ✅ **Filtros**: Por usuário, status, tipo
- ✅ **Operações em Lote**: Performance para múltiplas notificações

### 5. Feedback
- ✅ **Criação**: Usuários podem criar feedback
- ✅ **Feedback Anônimo**: Suporte a feedback anônimo
- ✅ **Listagem Pública**: Por unidade de saúde
- ✅ **Moderação**: Admin pode aprovar/rejeitar
- ✅ **Analytics**: Cálculo de avaliação média e distribuição

### 6. Authentication (Autenticação)
- ✅ **Login**: Firebase token para JWT
- ✅ **Refresh Token**: Renovação de tokens
- ✅ **Logout**: Invalidação de sessão
- ✅ **Perfil**: Visualização e atualização
- ✅ **Controle de Acesso**: Admin vs usuário comum
- ✅ **Segurança**: Proteção contra ataques comuns

## Como Executar

### Pré-requisitos
```bash
npm install
```

### Executar Todos os Testes de Integração
```bash
npm run test:integration
```

### Executar com Watch Mode
```bash
npm run test:integration:watch
```

### Executar com Cobertura
```bash
npm run test:coverage
```

### Executar Teste Específico
```bash
# Apenas testes de Health Units
npm run test:integration -- healthUnits

# Apenas testes de Autenticação  
npm run test:integration -- auth
```

## Padrão dos Testes

Todos os testes seguem o padrão **Given-When-Then**:

```typescript
it('should create health unit successfully with admin auth', async () => {
  // GIVEN: Admin user with valid health unit data
  const healthUnitData = { ...testHealthUnit };

  // WHEN: Admin creates health unit
  const response = await request(app)
    .post('/api/admin/health-units')
    .set(getAdminAuthHeaders())
    .send(healthUnitData)
    .expect(201);

  // THEN: Health unit is created successfully
  expect(response.body).toMatchObject({
    success: true,
    message: expect.stringContaining('sucesso'),
  });
});
```

## Cenários Testados

### Cenários Positivos ✅
- Operações CRUD com dados válidos
- Autenticação correta
- Fluxos completos de negócio
- Performance adequada

### Cenários Negativos ❌
- Dados inválidos ou ausentes
- Autenticação/autorização falhada
- IDs inexistentes
- Violações de regras de negócio
- Tentativas de acesso não autorizado

## Configuração do Ambiente de Teste

### MongoDB Memory Server
- Banco em memória que não requer instalação
- Rápido e isolado para cada execução de teste
- Configurado automaticamente no `globalSetup.ts`

### Mocking do Firebase
- Firebase Admin SDK é mockado para testes
- Tokens simulados para diferentes tipos de usuário
- Configurado no `setup.ts`

### Limpeza Entre Testes
- Banco limpo antes de cada teste
- Console.log suprimido durante testes
- Estado isolado entre execuções

## Performance

### Tempos de Resposta Validados
- Dashboard: < 3 segundos
- Operações CRUD: < 1 segundo
- Listagens: < 2 segundos
- Bulk operations: < 5 segundos

### Testes de Carga
- Múltiplas operações simultâneas
- Validação de paginação
- Stress test em endpoints críticos

## Troubleshooting

### Problemas Comuns

1. **MongoDB não conecta**
   ```bash
   # Verificar se o MongoDB Memory Server está rodando
   npm run test:integration -- --verbose
   ```

2. **Testes falham por timeout**
   ```bash
   # Aumentar timeout no jest.config.js se necessário
   testTimeout: 30000
   ```

3. **Problemas de autenticação nos testes**
   ```bash
   # Verificar se os mocks do Firebase estão funcionando
   # Verificar arquivo tests/setup.ts
   ```

## Próximos Passos

1. **Adicionar mais edge cases** conforme necessário
2. **Testes de stress** para alta carga
3. **Testes de segurança** mais abrangentes
4. **Integração com CI/CD** para execução automática

## Contribuindo

Ao adicionar novos testes:

1. Siga o padrão Given-When-Then
2. Teste cenários positivos E negativos
3. Use os helpers existentes para autenticação
4. Adicione dados de teste em `fixtures/testData.ts`
5. Mantenha testes isolados e independentes