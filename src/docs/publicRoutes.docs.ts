/**
 * @openapi
 * /public/auth/login:
 *   post:
 *     summary: Realiza login e retorna um token JWT
 *     tags:
 *       - Autenticação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - username
 *               - password
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *       401:
 *         description: Credenciais inválidas
 */

/**
 * @openapi
 * /public/auth/register:
 *   post:
 *     summary: Registra novo usuário com email e senha
 *     description: Cria uma nova conta de usuário no Firebase Authentication. O usuário será automaticamente sincronizado com o MongoDB. Esta é a rota legada - recomenda-se usar o fluxo Firebase-first (criar no cliente Firebase, depois sincronizar via /auth/sync).
 *     tags:
 *       - Firebase Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "password123"
 *               displayName:
 *                 type: string
 *                 example: "John Doe"
 *     responses:
 *       201:
 *         description: Conta criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     uid:
 *                       type: string
 *                     email:
 *                       type: string
 *                     displayName:
 *                       type: string
 *                     emailVerified:
 *                       type: boolean
 *                     message:
 *                       type: string
 *       400:
 *         description: Entrada inválida ou senha fraca
 *       409:
 *         description: Email já existe
 *       500:
 *         description: Erro ao criar conta
 */

/**
 * @openapi
 * /public/auth/login/google:
 *   post:
 *     summary: Login with Google ID token
 *     tags:
 *       - Firebase Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token from Firebase Auth
 *                 example: "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
 *     responses:
 *       200:
 *         description: Google login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
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
 *                     emailVerified:
 *                       type: boolean
 *                     role:
 *                       type: string
 *                     provider:
 *                       type: string
 *                       example: "google"
 *                     token:
 *                       type: string
 *       401:
 *         description: Invalid or expired Google token
 *       400:
 *         description: Missing Google token
 */

/**
 * @openapi
 * /public/auth/password-reset:
 *   post:
 *     summary: Send password reset email
 *     tags:
 *       - Firebase Authentication
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
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Password reset email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 resetLink:
 *                   type: string
 *                   description: "Development only - remove in production"
 *       400:
 *         description: Invalid email
 */

/**
 * @openapi
 * /public/health-units:
 *   get:
 *     summary: Lista unidades de saúde disponíveis
 *     tags:
 *       - Unidades de Saúde
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         required: false
 *         description: "Nome da cidade para filtrar"
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         required: false
 *         description: "Filtrar apenas unidades ativas"
 *       - in: query
 *         name: isFavorite
 *         schema:
 *           type: boolean
 *         required: false
 *         description: "Filtrar apenas unidades favoritas"
 *       - in: query
 *         name: neighborhood
 *         schema:
 *           type: string
 *         required: false
 *         description: "Nome do bairro para filtrar"
 *     responses:
 *       200:
 *         description: Lista de unidades de saúde retornada com sucesso
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @openapi
 * /public/auth/verify-token:
 *   post:
 *     summary: Verify Firebase ID token
 *     tags:
 *       - Firebase Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Firebase ID token
 *                 example: "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
 *     responses:
 *       200:
 *         description: Token verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     uid:
 *                       type: string
 *                     email:
 *                       type: string
 *                     emailVerified:
 *                       type: boolean
 *                     customClaims:
 *                       type: object
 *       401:
 *         description: Invalid or expired token
 *       400:
 *         description: Missing ID token
 */

/**
 * @openapi
 * /public/profile:
 *   get:
 *     summary: Get user profile with claims (DEPRECATED - use /auth/profile)
 *     description: Retorna informações do perfil do usuário autenticado. DEPRECATED - Esta rota foi consolidada em /auth/profile. Use /auth/profile para novas requisições.
 *     tags:
 *       - Profile Management
 *       - Deprecated
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         uid:
 *                           type: string
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *                         role:
 *                           type: string
 *                           enum: [admin, agent, public]
 *                         permissions:
 *                           type: array
 *                           items:
 *                             type: string
 *                         isActive:
 *                           type: boolean
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /public/users/{uid}/role:
 *   put:
 *     summary: Update user role (Admin only)
 *     tags:
 *       - Profile Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, agent, public]
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /public/users:
 *   get:
 *     summary: List users with pagination (Admin only)
 *     tags:
 *       - Profile Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, agent, public]
 *     responses:
 *       200:
 *         description: Users list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           uid:
 *                             type: string
 *                           email:
 *                             type: string
 *                           name:
 *                             type: string
 *                           role:
 *                             type: string
 *                           permissions:
 *                             type: array
 *                             items:
 *                               type: string
 *                           isActive:
 *                             type: boolean
 *                           metadata:
 *                             type: object
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       403:
 *         description: Admin access required
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /public/auth/sync:
 *   post:
 *     summary: Sincroniza usuário Firebase com MongoDB
 *     description: Endpoint para sincronizar dados do usuário criado no Firebase com o banco de dados MongoDB. Deve ser chamado após criação bem-sucedida do usuário no Firebase.
 *     tags:
 *       - Firebase Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *                 description: Email do usuário
 *               displayName:
 *                 type: string
 *                 example: "John Doe"
 *                 description: Nome exibição do usuário
 *     responses:
 *       201:
 *         description: Usuário sincronizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     uid:
 *                       type: string
 *                     email:
 *                       type: string
 *                     displayName:
 *                       type: string
 *                     message:
 *                       type: string
 *       401:
 *         description: Usuário não autenticado
 *       500:
 *         description: Erro ao sincronizar usuário
 */

/**
 * @openapi
 * /public/vaccines:
 *   get:
 *     summary: Lista todas as vacinas disponíveis
 *     tags:
 *       - Vacinas
 *     responses:
 *       200:
 *         description: Lista de vacinas recuperada com sucesso
 */

/**
 * @openapi
 * /public/appointments:
 *   post:
 *     summary: Agenda uma vacinação
 *     tags:
 *       - Agendamentos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vaccineId
 *               - healthUnitId
 *               - scheduledDate
 *               - scheduledTime
 *               - dose
 *             properties:
 *               vaccineId:
 *                 type: string
 *               healthUnitId:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date
 *               scheduledTime:
 *                 type: string
 *               dose:
 *                 type: string
 *                 enum: [1ª dose, 2ª dose, 3ª dose, dose única, reforço]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Agendamento criado com sucesso
 *       401:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /public/appointments/my:
 *   get:
 *     summary: Lista meus agendamentos
 *     tags:
 *       - Agendamentos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Meus agendamentos
 *       401:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /public/appointments/available-slots:
 *   get:
 *     summary: Lista horários disponíveis em uma unidade
 *     tags:
 *       - Agendamentos
 *     parameters:
 *       - in: query
 *         name: healthUnitId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Horários disponíveis
 */

/**
 * @openapi
 * /public/appointments/{id}/cancel:
 *   patch:
 *     summary: Cancela um agendamento
 *     tags:
 *       - Agendamentos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Agendamento cancelado
 *       401:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /public/vaccination-records/my:
 *   get:
 *     summary: Lista meus registros de vacinação
 *     tags:
 *       - Registros de Vacinação
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Meus registros de vacinação
 *       401:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /public/vaccination-records/user/{userId}:
 *   get:
 *     summary: Lista registros de vacinação de um usuário
 *     tags:
 *       - Registros de Vacinação
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registros de vacinação
 *       401:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /public/feedback:
 *   post:
 *     summary: Cria feedback sobre uma unidade de saúde
 *     tags:
 *       - Feedback
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - healthUnitId
 *               - comment
 *               - rating
 *             properties:
 *               healthUnitId:
 *                 type: string
 *               comment:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               isAnonymous:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Feedback criado com sucesso
 *       401:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /public/feedback/health-unit/{healthUnitId}:
 *   get:
 *     summary: Lista feedbacks de uma unidade de saúde
 *     tags:
 *       - Feedback
 *     parameters:
 *       - in: path
 *         name: healthUnitId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Feedbacks da unidade
 */

/**
 * @openapi
 * /public/notifications:
 *   get:
 *     summary: Lista minhas notificações
 *     tags:
 *       - Notificações
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Minhas notificações
 *       401:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /public/notifications/{id}/read:
 *   patch:
 *     summary: Marca notificação como lida
 *     tags:
 *       - Notificações
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notificação marcada como lida
 *       401:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /public/notifications/mark-all-read:
 *   patch:
 *     summary: Marca todas as notificações como lidas
 *     tags:
 *       - Notificações
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Todas notificações marcadas como lidas
 *       401:
 *         description: Não autorizado
 */
