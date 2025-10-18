# Baixada Vacinada API - Postman Collection

## Configuração Inicial

### 1. Importar a Collection
- Importe o arquivo `postman-collection-complete.json` no Postman
- A collection já contém todas as variáveis necessárias configuradas

### 2. Configurar Environment (Opcional)
Crie um environment com as seguintes variáveis:
- `environment`: "development" ou "production"

### 3. Variáveis da Collection
A collection já possui as seguintes variáveis configuradas:
- `baseUrl`: URL base da API (localhost ou produção)
- `prodUrl`: URL de produção
- `firebaseToken`: Token do usuário comum
- `adminToken`: Token do usuário admin
- `userId`: ID do usuário
- `healthUnitId`: ID da unidade de saúde
- `appointmentId`: ID do agendamento
- `notificationId`: ID da notificação

## Fluxo de Testes Recomendado

### 1. **Autenticação**
```
1. Register with Email (cria usuário admin)
2. Login with Email (obtém token)
```
*Os tokens são automaticamente salvos nas variáveis da collection*

### 2. **Configuração Básica (Admin)**
```
1. Create Health Unit (cria unidade de saúde)
2. Create Notification (testa sistema de notificações)
```

### 3. **Funcionalidades Públicas**
```
1. List Health Units (lista unidades disponíveis)
2. Schedule Appointment (agenda consulta)
3. Create Feedback (avalia unidade)
4. List User Notifications (verifica notificações)
```

### 4. **Dashboard e Relatórios (Admin)**
```
1. Get Dashboard Stats (estatísticas completas)
2. Get Quick Stats (estatísticas rápidas)
3. Get Vaccination Report (relatório de vacinações)
4. Get Health Units Report (relatório de unidades)
```

### 5. **Gestão Administrativa**
```
1. List Appointments (Admin) (visualiza agendamentos)
2. Complete Appointment with Vaccination (registra vacinação)
3. Get Appointment Stats (estatísticas de agendamentos)
4. List All Notifications (Admin) (gerencia notificações)
```

## Endpoints do Dashboard

### Dashboard Completo
- **GET** `/admin/dashboard/stats`
- Retorna estatísticas completas do sistema
- Inclui: contadores gerais, atividade recente, análises mensais, top unidades, distribuição de vacinas

### Estatísticas Rápidas
- **GET** `/admin/dashboard/quick-stats`
- Versão otimizada para carregamento rápido
- Inclui: métricas essenciais e KPIs principais

### Relatório de Vacinação
- **GET** `/admin/reports/vaccination`
- Parâmetros: `startDate`, `endDate`, `healthUnitId`, `vaccineId`
- Análises: por unidade, por vacina, por data, por faixa etária, cobertura

### Relatório de Unidades de Saúde
- **GET** `/admin/reports/health-units`
- Parâmetros: `startDate`, `endDate`, `isActive`, `city`, `state`
- Análises: performance, distribuição geográfica, avaliações

## Autenticação

### Tokens Automáticos
A collection possui scripts que automaticamente:
- Extraem tokens das respostas de login
- Definem tokens de admin quando o usuário tem role "admin"
- Salvam IDs de recursos criados (unidades, agendamentos, notificações)

### Headers de Autorização
- **Público**: Alguns endpoints públicos não requerem autenticação
- **Usuário**: `Authorization: Bearer {{firebaseToken}}`
- **Admin**: `Authorization: Bearer {{adminToken}}`

## Testes Automáticos

Cada requisição inclui testes automáticos para:
- ✅ Status code de sucesso (200/201)
- ✅ Tempo de resposta aceitável (< 5s)
- ✅ Estrutura de resposta válida
- ✅ Extração automática de tokens e IDs

## Exemplos de Payload

### Criar Unidade de Saúde
```json
{
  "name": "UBS Centro de Japeri",
  "address": {
    "street": "Rua Principal, 123",
    "neighborhood": "Centro",
    "city": "Japeri",
    "state": "RJ",
    "zipCode": "26445-000"
  },
  "phone": "(21) 3333-4444",
  "email": "ubs.centro@japeri.rj.gov.br",
  "operatingHours": {
    "monday": { "open": "08:00", "close": "17:00" },
    "tuesday": { "open": "08:00", "close": "17:00" }
  },
  "location": {
    "latitude": -22.6464,
    "longitude": -43.6533
  },
  "capacity": 100,
  "services": ["Vacinação COVID-19", "Vacinação Influenza"]
}
```

### Agendar Consulta
```json
{
  "healthUnitId": "{{healthUnitId}}",
  "vaccineId": "vaccine_id_here",
  "appointmentDate": "2024-12-20T10:00:00.000Z",
  "notes": "First dose appointment"
}
```

### Criar Feedback
```json
{
  "healthUnitId": "{{healthUnitId}}",
  "comment": "Excelente atendimento!",
  "rating": 5,
  "isAnonymous": false
}
```

## URLs de Ambiente

### Desenvolvimento
- Base: `http://localhost:3000/api`
- Docs: `http://localhost:3000/api-docs`
- Health: `http://localhost:3000/health`

### Produção
- Base: `https://bv-backend.vercel.app/api`
- Docs: `https://bv-backend.vercel.app/api-docs`
- Health: `https://bv-backend.vercel.app/health`

## Dicas de Uso

1. **Execute os requests em ordem** - alguns dependem de IDs criados anteriormente
2. **Verifique as variáveis** - os scripts automáticos preenchem IDs conforme você testa
3. **Use os filtros nos relatórios** - teste diferentes combinações de parâmetros
4. **Monitore os logs** - use o Console do Postman para debug
5. **Teste em ambos ambientes** - desenvolvimento e produção

---

## Troubleshooting

### Erro 401 (Unauthorized)
- Verifique se fez login primeiro
- Confirme se o token está sendo usado corretamente
- Para endpoints admin, certifique-se de usar `{{adminToken}}`

### Erro 404 (Not Found)
- Confirme se os IDs nas variáveis estão corretos
- Execute os requests de criação antes dos de consulta

### Erro 500 (Internal Server Error)
- Verifique os logs do servidor
- Confirme se o payload está correto
- Teste com dados mais simples primeiro

---

**Collection atualizada em:** Dezembro 2024  
**Versão da API:** 1.0.0  
**Endpoints cobertos:** 25+ endpoints completos