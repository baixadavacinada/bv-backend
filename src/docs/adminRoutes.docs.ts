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
