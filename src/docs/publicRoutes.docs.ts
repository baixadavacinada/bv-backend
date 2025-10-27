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

/**
 * @openapi
 * /public/profile:
 *   get:
 *     summary: Get user profile with claims
 *     tags:
 *       - Profile Management
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
 *                         profile:
 *                           type: object
 *                           properties:
 *                             hasBasicInfo:
 *                               type: boolean
 *                             hasHealthInfo:
 *                               type: boolean
 *                             profileCompleteness:
 *                               type: number
 *                         isActive:
 *                           type: boolean
 *                         mongoProfile:
 *                           type: object
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Create user profile in MongoDB
 *     tags:
 *       - Profile Management
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firebaseUid
 *               - email
 *             properties:
 *               firebaseUid:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               birthDate:
 *                 type: string
 *                 format: date
 *               cpf:
 *                 type: string
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
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
 *         description: Profile created successfully
 *       409:
 *         description: User profile already exists
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
