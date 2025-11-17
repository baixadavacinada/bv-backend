/**
 * @openapi
 * /public/webhooks/whatsapp/status:
 *   post:
 *         summary: Webhook para atualizações de status do WhatsApp,
 *     description: |
 *       Endpoint para receber atualizações de status de mensagens WhatsApp do Z-API.
 *       
 *       Este webhook é chamado automaticamente pelo Z-API quando o status de uma mensagem muda.
 *       
 *       Status possíveis:
 *       - queued: Mensagem enfileirada
 *       - sent: Enviada para o provedor
 *       - delivered: Entregue ao dispositivo
 *       - read: Lida pelo usuário
 *       - failed: Falha ao enviar
 *       - undelivered: Não entregue
 *     tags:
 *       - Webhooks
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - MessageSid
 *               - MessageStatus
 *             properties:
 *               MessageSid:
 *                 type: string
 *                 description: ID único da mensagem do Z-API
 *               MessageStatus:
 *                 type: string
 *                 enum: [queued, sent, delivered, read, failed, undelivered]
 *                 description: Status atual da mensagem
 *               ErrorCode:
 *                 type: string
 *                 description: Código de erro (se houver)
 *     responses:
 *       200:
 *         description: Webhook processado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 messageSid:
 *                   type: string
 *                 status:
 *                   type: string
 *       400:
 *         description: Parâmetros obrigatórios faltando
 *       500:
 *         description: Erro ao processar webhook
 */

/**
 * @openapi
 * /public/webhooks/health:
 *   get:
 *     summary: Health check do serviço de webhooks
 *     description: Verifica se o serviço de webhooks está operacional
 *     tags:
 *       - Webhooks
 *     responses:
 *       200:
 *         description: Serviço está funcionando
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
