/**
 * @openapi
 * /auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags:
 *       - User Profile (Auth Required)
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