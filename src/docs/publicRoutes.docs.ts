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
 * /public/auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags:
 *       - Firebase Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
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
 *                     photoURL:
 *                       type: string
 *                     role:
 *                       type: string
 *                     lastSignInTime:
 *                       type: string
 *                     creationTime:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *   put:
 *     summary: Update user profile
 *     tags:
 *       - Firebase Authentication
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
 *                 example: "John Doe"
 *               photoURL:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/photo.jpg"
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid input
 */
