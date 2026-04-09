/**
 * @openapi
 * /auth/profile:
 *   get:
 *     summary: Obtém meu perfil (autenticado)
 *     description: Retorna informações do perfil do usuário autenticado
 *     tags:
 *       - User Profile (Auth Required)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil do usuário recuperado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     uid:
 *                       type: string
 *                     email:
 *                       type: string
 *                       format: email
 *                     displayName:
 *                       type: string
 *                     emailVerified:
 *                       type: boolean
 *                     photoURL:
 *                       type: string
 *                       format: uri
 *                     role:
 *                       type: string
 *                       enum: [admin, agent, public]
 *                     lastSignInTime:
 *                       type: string
 *                       format: date-time
 *                     creationTime:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Não autorizado - token ausente ou inválido
 *   post:
 *     summary: Cria novo registro de perfil (onboarding)
 *     description: Cria um novo registro de perfil no MongoDB para usuário autenticado no Firebase. Esta é a operação de onboarding - executada na primeira vez que um usuário acessa após autenticação no Firebase.
 *     tags:
 *       - User Profile (Auth Required)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "usuario@example.com"
 *               name:
 *                 type: string
 *                 example: "João Silva"
 *               phone:
 *                 type: string
 *                 example: "11987654321"
 *               birthDate:
 *                 type: string
 *                 format: date
 *                 example: "1990-05-15"
 *               cpf:
 *                 type: string
 *                 example: "12345678901"
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   number:
 *                     type: string
 *                   complement:
 *                     type: string
 *                   neighborhood:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *               emergencyContact:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   relationship:
 *                     type: string
 *               healthConditions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Perfil criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     uid:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Não autorizado - token ausente ou inválido
 *       409:
 *         description: Perfil já existe para este usuário
 *       400:
 *         description: Email obrigatório ou dados inválidos
 *   put:
 *     summary: Atualiza meu perfil
 *     description: Atualiza informações do perfil do usuário autenticado (Firebase e MongoDB)
 *     tags:
 *       - User Profile (Auth Required)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 description: Nome de exibição no Firebase
 *                 example: "John Doe"
 *               photoURL:
 *                 type: string
 *                 format: uri
 *                 description: URL da foto de perfil no Firebase
 *                 example: "https://example.com/photo.jpg"
 *               name:
 *                 type: string
 *                 description: Nome completo no MongoDB
 *                 example: "João da Silva"
 *               phone:
 *                 type: string
 *                 description: Número de telefone (opcional, formato livre)
 *                 example: "(11) 99999-9999"
 *               cpf:
 *                 type: string
 *                 description: CPF (opcional, formato XXX.XXX.XXX-XX)
 *                 example: "123.456.789-00"
 *               notifications:
 *                 type: object
 *                 description: Preferências de notificações
 *                 properties:
 *                   secondDose:
 *                     type: boolean
 *                     description: Notificações de segunda dose
 *                   appointment:
 *                     type: boolean
 *                     description: Notificações de agendamentos
 *                   newVaccines:
 *                     type: boolean
 *                     description: Notificações de novas vacinas
 *     responses:
 *       200:
 *         description: Perfil atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     uid:
 *                       type: string
 *                     email:
 *                       type: string
 *                     displayName:
 *                       type: string
 *                     photoURL:
 *                       type: string
 *                     name:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     cpf:
 *                       type: string
 *                     notifications:
 *                       type: object
 *       401:
 *         description: Não autorizado
 *       400:
 *         description: Input inválido


/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Obtém meu perfil completo (atalho para /auth/profile)
 *     description: Retorna informações completas do usuário autenticado
 *     tags:
 *       - User Profile (Auth Required)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados completos do usuário
 *       401:
 *         description: Não autorizado - token ausente ou inválido
 */

export const authRoutesDoc = {}