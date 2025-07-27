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
 * /public/ubs:
 *   get:
 *     summary: Lista UBS disponíveis na cidade informada
 *     tags:
 *       - UBS
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         required: false
 *         description: "Nome da cidade (default: Japeri)"
 *     responses:
 *       200:
 *         description: Lista de UBS retornada com sucesso
 */
