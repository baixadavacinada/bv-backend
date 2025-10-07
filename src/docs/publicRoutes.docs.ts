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
 * /public/health-unit:
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
