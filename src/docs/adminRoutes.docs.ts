/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @openapi
 * /admin/users:
 *   post:
 *     summary: Cria um novo usuário
 *     tags:
 *       - Usuários
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: ["public", "agent", "admin"]
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       401:
 *         description: Token ausente ou inválido
 */

/**
 * @openapi
 * /admin/vaccines:
 *   post:
 *     summary: Cria uma nova vacina
 *     tags:
 *       - Vacinas
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               manufacturer:
 *                 type: string
 *               doses:
 *                 type: array
 *                 items:
 *                   type: string
 *               ageGroup:
 *                 type: string
 *     responses:
 *       201:
 *         description: Vacina criada com sucesso
 *       401:
 *         description: Token ausente ou inválido
 */

/**
 * @openapi
 * /admin/health-units:
 *   post:
 *     summary: Cria uma nova unidade de saúde
 *     tags:
 *       - Unidades de Saúde
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               neighborhood:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               phone:
 *                 type: string
 *               operatingHours:
 *                 type: object
 *                 properties:
 *                   monday:
 *                     type: string
 *                     example: "07:00-17:00"
 *                   tuesday:
 *                     type: string
 *                     example: "07:00-17:00"
 *                   wednesday:
 *                     type: string
 *                     example: "07:00-17:00"
 *                   thursday:
 *                     type: string
 *                     example: "07:00-17:00"
 *                   friday:
 *                     type: string
 *                     example: "07:00-17:00"
 *                   saturday:
 *                     type: string
 *                     example: "08:00-12:00"
 *                   sunday:
 *                     type: string
 *                     example: "Fechado"
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               isFavorite:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Unidade de saúde criada com sucesso
 *       401:
 *         description: Token ausente ou inválido
 *   get:
 *     summary: Lista todas as unidades de saúde
 *     tags:
 *       - Unidades de Saúde
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isFavorite
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: neighborhood
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de unidades de saúde
 *       401:
 *         description: Token ausente ou inválido
 */

/**
 * @openapi
 * /admin/health-units/{id}:
 *   get:
 *     summary: Busca uma unidade de saúde por ID
 *     tags:
 *       - Unidades de Saúde
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
 *         description: Unidade de saúde encontrada
 *       404:
 *         description: Unidade não encontrada
 *       401:
 *         description: Token ausente ou inválido
 *   put:
 *     summary: Atualiza uma unidade de saúde
 *     tags:
 *       - Unidades de Saúde
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               neighborhood:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               phone:
 *                 type: string
 *               operatingHours:
 *                 type: object
 *                 properties:
 *                   monday:
 *                     type: string
 *                     example: "07:00-17:00"
 *                   tuesday:
 *                     type: string
 *                     example: "07:00-17:00"
 *                   wednesday:
 *                     type: string
 *                     example: "07:00-17:00"
 *                   thursday:
 *                     type: string
 *                     example: "07:00-17:00"
 *                   friday:
 *                     type: string
 *                     example: "07:00-17:00"
 *                   saturday:
 *                     type: string
 *                     example: "08:00-12:00"
 *                   sunday:
 *                     type: string
 *                     example: "Fechado"
 *     responses:
 *       200:
 *         description: Unidade atualizada com sucesso
 *       404:
 *         description: Unidade não encontrada
 *       401:
 *         description: Token ausente ou inválido
 */

/**
 * @openapi
 * /admin/health-units/{id}/favorite:
 *   patch:
 *     summary: Alterna status de favorito da unidade
 *     tags:
 *       - Unidades de Saúde
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isFavorite:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status de favorito atualizado
 *       404:
 *         description: Unidade não encontrada
 *       401:
 *         description: Token ausente ou inválido
 */

/**
 * @openapi
 * /admin/health-units/{id}/active:
 *   patch:
 *     summary: Alterna status ativo/inativo da unidade
 *     tags:
 *       - Unidades de Saúde
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status ativo atualizado
 *       404:
 *         description: Unidade não encontrada
 *       401:
 *         description: Token ausente ou inválido
 */

/**
 * @openapi
 * /admin/health-units/{id}/visibility:
 *   patch:
 *     summary: Alterna visibilidade pública da unidade
 *     tags:
 *       - Unidades de Saúde
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Visibilidade atualizada
 *       404:
 *         description: Unidade não encontrada
 *       401:
 *         description: Token ausente ou inválido
 */

/**
 * @openapi
 * /admin/firebase/users:
 *   post:
 *     summary: Create a new Firebase user
 *     tags:
 *       - Firebase User Management
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
 *               role:
 *                 type: string
 *                 enum: ["public", "agent", "admin"]
 *                 default: "public"
 *     responses:
 *       201:
 *         description: User created successfully
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
 *                     role:
 *                       type: string
 *                     emailVerified:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Email already exists
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /admin/firebase/users/{uid}:
 *   get:
 *     summary: Get Firebase user information
 *     tags:
 *       - Firebase User Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User information retrieved
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
 *                     disabled:
 *                       type: boolean
 *                     customClaims:
 *                       type: object
 *                     createdAt:
 *                       type: string
 *                     lastSignInTime:
 *                       type: string
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *   delete:
 *     summary: Delete Firebase user
 *     tags:
 *       - Firebase User Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /admin/firebase/users/claims:
 *   put:
 *     summary: Atualiza custom claims de um usuário via Firebase
 *     description: |
 *       Alterna diretamente para atualizar custom claims no Firebase.
 *       Útil quando você precisa de controle de baixo nível sobre as claims.
 *       
 *       Nota: Prefira usar PUT /admin/claims para atualizações de alto nível
 *       pois fornece melhor validação e tracking.
 *     tags:
 *       - Firebase User Management
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uid
 *               - claims
 *             properties:
 *               uid:
 *                 type: string
 *                 description: ID do usuário Firebase
 *                 example: "firebase-user-uid"
 *               claims:
 *                 type: object
 *                 description: Claims customizadas
 *                 properties:
 *                   role:
 *                     type: string
 *                     enum: [public, agent, admin]
 *                     example: "admin"
 *                   ubsId:
 *                     type: string
 *                     example: "ubs123"
 *                   customField:
 *                     type: string
 *                     description: Qualquer outra claim customizada
 *                 example:
 *                   role: "admin"
 *                   admin: true
 *     responses:
 *       200:
 *         description: Claims atualizadas com sucesso
 *       404:
 *         description: Usuário não encontrado
 *       401:
 *         description: Token ausente ou inválido
 *       403:
 *         description: Sem permissão (apenas admin)
 */

/**
 * @openapi
 * /admin/firebase/users/{uid}/status:
 *   patch:
 *     summary: Enable/disable Firebase user
 *     tags:
 *       - Firebase User Management
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
 *               - disabled
 *             properties:
 *               disabled:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: User status updated
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /admin/firebase/me:
 *   get:
 *     summary: Get current user profile
 *     tags:
 *       - Firebase User Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
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
 *                     role:
 *                       type: string
 *                     customClaims:
 *                       type: object
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /admin/claims/{uid}:
 *   get:
 *     summary: Busca as claims (papéis e permissões) de um usuário
 *     description: |
 *       Retorna todas as claims associadas a um usuário, incluindo role, permissions, 
 *       status ativo/inativo e histórico de atualizações (audit trail).
 *       
 *       Roles disponíveis:
 *       - admin: Acesso completo ao sistema
 *       - agent: Acesso limitado a funcionalidades de agente/UBS
 *       - public: Acesso publico/usuario comum
 *     tags:
 *       - Advanced Claims Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário Firebase
 *     responses:
 *       200:
 *         description: Claims do usuário recuperadas com sucesso
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
 *                       example: "user123"
 *                     claims:
 *                       type: object
 *                       properties:
 *                         role:
 *                           type: string
 *                           enum: [admin, agent, public]
 *                           description: Papel do usuário
 *                           example: "agent"
 *                         permissions:
 *                           type: array
 *                           items:
 *                             type: string
 *                           description: Lista de permissões associadas ao role
 *                           example: ["read_health_units", "write_appointments", "read_vaccines"]
 *                         isActive:
 *                           type: boolean
 *                           description: Se o usuário está ativo ou desativado
 *                           example: true
 *                         ubsId:
 *                           type: string
 *                           description: ID da UBS (apenas para agentes)
 *                           example: "ubs456"
 *                         profile:
 *                           type: object
 *                           properties:
 *                             hasBasicInfo:
 *                               type: boolean
 *                               example: true
 *                             hasHealthInfo:
 *                               type: boolean
 *                               example: false
 *                             profileCompleteness:
 *                               type: number
 *                               example: 50
 *                         metadata:
 *                           type: object
 *                           properties:
 *                             lastLogin:
 *                               type: string
 *                               format: date-time
 *                             createdAt:
 *                               type: string
 *                               format: date-time
 *                             updatedAt:
 *                               type: string
 *                               format: date-time
 *                             updatedBy:
 *                               type: string
 *                               description: UID do admin que fez a última atualização
 *                             lastRoleUpdate:
 *                               type: string
 *                               format: date-time
 *       404:
 *         description: Usuário não encontrado
 *       401:
 *         description: Token ausente ou inválido
 *       403:
 *         description: Sem permissão (apenas admin)
 */

/**
 * @openapi
 * /admin/claims:
 *   put:
 *     summary: Atualiza claims de um usuário com opções avançadas
 *     description: |
 *       Atualiza as claims (claims) de um usuário, permitindo alterar role, 
 *       permissions, ubsId e status ativo/inativo. Todas as mudanças são 
 *       registradas no Firebase Custom Claims com metadados de auditoria.
 *       
 *       Permissions por role:
 *       - admin: read_users, write_users, delete_users, read_health_units, write_health_units, etc
 *       - agent: read_health_units, read_vaccines, read_appointments, write_appointments, read_records, write_records
 *       - public: read_health_units, read_vaccines
 *     tags:
 *       - Advanced Claims Management
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uid
 *             properties:
 *               uid:
 *                 type: string
 *                 description: ID do usuário Firebase
 *                 example: "user123"
 *               role:
 *                 type: string
 *                 enum: [admin, agent, public]
 *                 description: Novo papel do usuário
 *                 example: "agent"
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista customizada de permissões
 *                 example: ["read_health_units", "write_appointments"]
 *               ubsId:
 *                 type: string
 *                 description: ID da UBS (apenas para agentes)
 *                 example: "ubs456"
 *               isActive:
 *                 type: boolean
 *                 description: Ativar ou desativar usuário
 *                 example: true
 *     responses:
 *       200:
 *         description: Claims atualizadas com sucesso
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
 *                     claims:
 *                       type: object
 *                       properties:
 *                         role:
 *                           type: string
 *                         permissions:
 *                           type: array
 *                         isActive:
 *                           type: boolean
 *                         ubsId:
 *                           type: string
 *                         metadata:
 *                           type: object
 *                           description: Inclui updatedAt, updatedBy, lastRoleUpdate
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Input inválido ou faltando uid obrigatório
 *       404:
 *         description: Usuário não encontrado
 *       401:
 *         description: Token ausente ou inválido
 *       403:
 *         description: Sem permissão (apenas admin)
 */

/**
 * @openapi
 * /admin/users/{uid}/role:
 *   patch:
 *     summary: Atualiza o papel (role) de um usuário
 *     description: |
 *       Atalho conveniente para atualizar apenas o papel de um usuário.
 *       Ao alterar a role, as permissions são automaticamente atualizadas 
 *       para as permissões padrão daquele papel.
 *       
 *       Transições de role permitidas:
 *       - public -> agent (promoção)
 *       - agent -> admin (promoção)
 *       - admin -> agent (degradação)
 *       - agent -> public (degradação)
 *     tags:
 *       - Advanced Claims Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário Firebase
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
 *                 description: Novo papel do usuário
 *                 example: "agent"
 *     responses:
 *       200:
 *         description: Papel atualizado com sucesso
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
 *                     claims:
 *                       type: object
 *                       properties:
 *                         role:
 *                           type: string
 *                         permissions:
 *                           type: array
 *                           description: Permissions automaticamente atualizadas
 *                         isActive:
 *                           type: boolean
 *                         metadata:
 *                           type: object
 *       404:
 *         description: Usuário não encontrado
 *       400:
 *         description: Role inválido
 *       401:
 *         description: Token ausente ou inválido
 *       403:
 *         description: Sem permissão (apenas admin)
 */

/**
 * @openapi
 * /admin/users/{uid}/deactivate:
 *   patch:
 *     summary: Desativa uma conta de usuário
 *     description: |
 *       Desativa um usuário definindo isActive = false. Um usuário desativado:
 *       - Não consegue fazer login
 *       - Suas requisições autenticadas são bloqueadas com erro USER_INACTIVE
 *       - A conta continua no Firebase mas inacessível
 *       
 *       Use este endpoint para suspender temporariamente acesso sem deletar a conta.
 *     tags:
 *       - Advanced Claims Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário Firebase
 *     responses:
 *       200:
 *         description: Usuário desativado com sucesso
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
 *                     claims:
 *                       type: object
 *                       properties:
 *                         isActive:
 *                           type: boolean
 *                           example: false
 *                         role:
 *                           type: string
 *                         metadata:
 *                           type: object
 *       404:
 *         description: Usuário não encontrado
 *       401:
 *         description: Token ausente ou inválido
 *       403:
 *         description: Sem permissão (apenas admin)
 */

/**
 * @openapi
 * /admin/users/{uid}/reactivate:
 *   patch:
 *     summary: Reativa uma conta de usuário
 *     description: |
 *       Reativa um usuário desativado definindo isActive = true.
 *       Após reativar, o usuário consegue fazer login normalmente.
 *     tags:
 *       - Advanced Claims Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário Firebase
 *     responses:
 *       200:
 *         description: Usuário reativado com sucesso
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
 *                     claims:
 *                       type: object
 *                       properties:
 *                         isActive:
 *                           type: boolean
 *                           example: true
 *                         role:
 *                           type: string
 *                         metadata:
 *                           type: object
 *       404:
 *         description: Usuário não encontrado
 *       401:
 *         description: Token ausente ou inválido
 *       403:
 *         description: Sem permissão (apenas admin)
 */

/**
 * @openapi
 * /admin/claims/bulk-update:
 *   post:
 *     summary: Atualiza claims de múltiplos usuários em lote
 *     description: |
 *       Realiza atualizações em lote de claims para vários usuários simultaneamente.
 *       Útil para operações administrativas em massa como promover múltiplos agentes,
 *       atribuir UBS em lote, ou desativar múltiplos usuários.
 *       
 *       Cada atualização é processada individualmente, retornando sucessos e falhas.
 *     tags:
 *       - Advanced Claims Management
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - updates
 *             properties:
 *               updates:
 *                 type: array
 *                 description: Array com atualizações a fazer
 *                 items:
 *                   type: object
 *                   required:
 *                     - uid
 *                   properties:
 *                     uid:
 *                       type: string
 *                       description: ID do usuário Firebase
 *                       example: "user1"
 *                     role:
 *                       type: string
 *                       enum: [admin, agent, public]
 *                       description: Novo papel (opcional)
 *                       example: "agent"
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Permissions customizadas (opcional)
 *                     ubsId:
 *                       type: string
 *                       description: ID da UBS (opcional)
 *                       example: "ubs123"
 *                     isActive:
 *                       type: boolean
 *                       description: Status ativo/inativo (opcional)
 *     responses:
 *       200:
 *         description: Atualização em lote concluída
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
 *                     successful:
 *                       type: array
 *                       description: Atualizações que funcionaram
 *                       items:
 *                         type: object
 *                         properties:
 *                           uid:
 *                             type: string
 *                           success:
 *                             type: boolean
 *                             example: true
 *                           claims:
 *                             type: object
 *                     failed:
 *                       type: array
 *                       description: Atualizações que falharam
 *                       items:
 *                         type: object
 *                         properties:
 *                           uid:
 *                             type: string
 *                           success:
 *                             type: boolean
 *                             example: false
 *                           error:
 *                             type: string
 *                             example: "User not found"
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         successful:
 *                           type: number
 *                         failed:
 *                           type: number
 *       400:
 *         description: Updates array vazio ou mal formatado
 *       401:
 *         description: Token ausente ou inválido
 *       403:
 *         description: Sem permissão (apenas admin)
 */

/**
 * @openapi
 * /admin/appointments:
 *   get:
 *     summary: Lista todos os agendamentos
 *     description: |
 *       Retorna lista de agendamentos com filtros opcionais por data e unidade de saúde.
 *     tags:
 *       - Agendamentos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: healthUnitId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lista de agendamentos
 *       401:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /admin/appointments/{id}/status:
 *   patch:
 *     summary: Atualiza status de um agendamento
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [scheduled, confirmed, completed, cancelled, no_show]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status atualizado
 *       401:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /admin/appointments/{id}/complete-vaccination:
 *   patch:
 *     summary: Marca agendamento como vacinado e cria registro de vacinação
 *     description: |
 *       Registra que uma vacinação foi realizada, criando um VaccinationRecord
 *       e atualizando o status do agendamento.
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               appliedBy:
 *                 type: string
 *                 description: Nome do profissional que aplicou
 *               vaccinationNotes:
 *                 type: string
 *               reactions:
 *                 type: string
 *               nextDoseDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Vacinação registrada
 *       401:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /admin/appointments/stats:
 *   get:
 *     summary: Estatísticas de agendamentos
 *     tags:
 *       - Agendamentos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Estatísticas de agendamentos
 *       401:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /admin/vaccines:
 *   get:
 *     summary: Lista todas as vacinas
 *     tags:
 *       - Vacinas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de vacinas
 *       401:
 *         description: Não autorizado
 *   post:
 *     summary: Cria nova vacina
 *     tags:
 *       - Vacinas
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               manufacturer:
 *                 type: string
 *               ageGroup:
 *                 type: string
 *               doses:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Vacina criada
 *       401:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /admin/vaccines/{id}:
 *   get:
 *     summary: Busca uma vacina específica
 *     tags:
 *       - Vacinas
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
 *         description: Dados da vacina
 *       401:
 *         description: Não autorizado
 *   put:
 *     summary: Atualiza uma vacina
 *     tags:
 *       - Vacinas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Vacina atualizada
 *       401:
 *         description: Não autorizado
 *   delete:
 *     summary: Deleta uma vacina
 *     tags:
 *       - Vacinas
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
 *         description: Vacina deletada
 *       401:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /admin/vaccination-records:
 *   get:
 *     summary: Lista registros de vacinação
 *     tags:
 *       - Registros de Vacinação
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: healthUnitId
 *         schema:
 *           type: string
 *       - in: query
 *         name: vaccineId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lista de registros
 *       401:
 *         description: Não autorizado
 *   post:
 *     summary: Cria novo registro de vacinação
 *     tags:
 *       - Registros de Vacinação
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               residentId:
 *                 type: string
 *               vaccineId:
 *                 type: string
 *               healthUnitId:
 *                 type: string
 *               appliedBy:
 *                 type: string
 *               dose:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registro criado
 *       401:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /admin/vaccination-records/{id}:
 *   get:
 *     summary: Busca um registro de vacinação específico
 *     tags:
 *       - Registros de Vacinação
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
 *         description: Dados do registro
 *       401:
 *         description: Não autorizado
 *   put:
 *     summary: Atualiza um registro de vacinação
 *     tags:
 *       - Registros de Vacinação
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Registro atualizado
 *       401:
 *         description: Não autorizado
 *   delete:
 *     summary: Deleta um registro de vacinação
 *     tags:
 *       - Registros de Vacinação
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
 *         description: Registro deletado
 *       401:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /admin/health-units:
 *   get:
 *     summary: Lista todas as unidades de saúde
 *     tags:
 *       - Unidades de Saúde
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de unidades
 *       401:
 *         description: Não autorizado
 *   post:
 *     summary: Cria nova unidade de saúde
 *     tags:
 *       - Unidades de Saúde
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               neighborhood:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               phone:
 *                 type: string
 *               operatingHours:
 *                 type: object
 *               geolocation:
 *                 type: object
 *               availableVaccines:
 *                 type: array
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Unidade criada
 *       401:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /admin/health-units/{id}:
 *   get:
 *     summary: Busca uma unidade de saúde específica
 *     tags:
 *       - Unidades de Saúde
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
 *         description: Dados da unidade
 *       401:
 *         description: Não autorizado
 *   put:
 *     summary: Atualiza uma unidade de saúde
 *     tags:
 *       - Unidades de Saúde
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Unidade atualizada
 *       401:
 *         description: Não autorizado
 *   delete:
 *     summary: Deleta uma unidade de saúde
 *     tags:
 *       - Unidades de Saúde
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
 *         description: Unidade deletada
 *       401:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /admin/feedback:
 *   get:
 *     summary: Lista todos os feedbacks
 *     tags:
 *       - Feedback
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: healthUnitId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de feedbacks
 *       401:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /admin/feedback/{id}:
 *   get:
 *     summary: Busca um feedback específico
 *     tags:
 *       - Feedback
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
 *         description: Dados do feedback
 *       401:
 *         description: Não autorizado
 *   patch:
 *     summary: Modera (aprova/rejeita) um feedback
 *     tags:
 *       - Feedback
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Feedback moderado
 *       401:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /admin/notifications:
 *   get:
 *     summary: Lista notificações
 *     tags:
 *       - Notificações
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de notificações
 *       401:
 *         description: Não autorizado
 *   post:
 *     summary: Cria nova notificação
 *     tags:
 *       - Notificações
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *               scheduledFor:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notificação criada
 *       401:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /admin/notifications/{id}:
 *   get:
 *     summary: Busca uma notificação específica
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
 *         description: Dados da notificação
 *       401:
 *         description: Não autorizado
 *   delete:
 *     summary: Deleta uma notificação
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
 *         description: Notificação deletada
 *       401:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /admin/dashboard/stats:
 *   get:
 *     summary: Estatísticas gerais do dashboard
 *     description: Retorna métricas gerais do sistema como total de usuários, agendamentos, vacinações, etc.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas do sistema
 *       401:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /admin/dashboard/quick-stats:
 *   get:
 *     summary: Estatísticas rápidas do dashboard
 *     description: Retorna um resumo rápido de métricas importantes
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumo de estatísticas
 *       401:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /admin/reports/vaccination:
 *   get:
 *     summary: Relatório de vacinações
 *     tags:
 *       - Relatórios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: healthUnitId
 *         schema:
 *           type: string
 *       - in: query
 *         name: vaccineId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Relatório de vacinações
 *       401:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /admin/reports/health-units:
 *   get:
 *     summary: Relatório de unidades de saúde
 *     tags:
 *       - Relatórios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Relatório de unidades
 *       401:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /admin/firebase/users:
 *   get:
 *     summary: Lista usuários do Firebase
 *     tags:
 *       - Firebase User Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários
 *       401:
 *         description: Não autorizado
 *   post:
 *     summary: Cria novo usuário no Firebase
 *     tags:
 *       - Firebase User Management
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               displayName:
 *                 type: string
 *               customClaims:
 *                 type: object
 *     responses:
 *       201:
 *         description: Usuário criado
 *       401:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /admin/firebase/users/{uid}:
 *   get:
 *     summary: Busca usuário do Firebase
 *     tags:
 *       - Firebase User Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dados do usuário
 *       401:
 *         description: Não autorizado
 *   delete:
 *     summary: Deleta usuário do Firebase
 *     tags:
 *       - Firebase User Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuário deletado
 *       401:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /admin/users:
 *   post:
 *     summary: Cria novo usuário (shortcut)
 *     tags:
 *       - Usuários
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               displayName:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário criado
 *       401:
 *         description: Não autorizado
 */
