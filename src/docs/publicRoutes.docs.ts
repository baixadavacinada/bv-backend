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
 *     summary: Register new user with email and password
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
 *         description: Account created successfully
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
 *         description: Invalid input or weak password
 *       409:
 *         description: Email already exists
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
