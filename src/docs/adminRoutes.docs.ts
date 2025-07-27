/**
 * @openapi
 * /admin/vaccination-record:
 *   post:
 *     summary: Registra manualmente uma vacinação
 *     tags:
 *       - Vacinação
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
 *               vaccineName:
 *                 type: string
 *               dose:
 *                 type: string
 *                 example: "1ª dose"
 *               date:
 *                 type: string
 *                 format: date
 *             required:
 *               - residentId
 *               - vaccineName
 *               - dose
 *               - date
 *     responses:
 *       201:
 *         description: Registro criado
 *       401:
 *         description: Token ausente ou inválido
 */
