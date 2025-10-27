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
 *     summary: Update user custom claims (role management)
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
 *                 example: "firebase-user-uid"
 *               claims:
 *                 type: object
 *                 properties:
 *                   role:
 *                     type: string
 *                     enum: ["public", "agent", "admin"]
 *                   admin:
 *                     type: boolean
 *                 example:
 *                   role: "admin"
 *                   admin: true
 *     responses:
 *       200:
 *         description: Claims updated successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
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
 *     summary: Get user claims information
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
 *     responses:
 *       200:
 *         description: User claims retrieved
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
 *                     role:
 *                       type: string
 *                       enum: [admin, agent, public]
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                     profile:
 *                       type: object
 *                       properties:
 *                         hasBasicInfo:
 *                           type: boolean
 *                         hasHealthInfo:
 *                           type: boolean
 *                         profileCompleteness:
 *                           type: number
 *                     isActive:
 *                       type: boolean
 *                     metadata:
 *                       type: object
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /admin/claims:
 *   put:
 *     summary: Update user claims with advanced options
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
 *               role:
 *                 type: string
 *                 enum: [admin, agent, public]
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *               ubsId:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Claims updated successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /admin/users/{uid}/role:
 *   patch:
 *     summary: Update user role (shortcut)
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
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /admin/users/{uid}/deactivate:
 *   patch:
 *     summary: Deactivate user
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
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /admin/users/{uid}/reactivate:
 *   patch:
 *     summary: Reactivate user
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
 *     responses:
 *       200:
 *         description: User reactivated successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /admin/claims/bulk-update:
 *   post:
 *     summary: Bulk update multiple users claims
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
 *                 items:
 *                   type: object
 *                   properties:
 *                     uid:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [admin, agent, public]
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                     isActive:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Bulk update completed
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
