/**
 * Notification Templates Service
 * Provides standardized message templates for different notification types
 * All templates are in Portuguese for Baixada Vacinada users
 */

export interface TemplateContext {
  userName?: string;
  vaccineName?: string;
  healthUnitName?: string;
  date?: string;
  time?: string;
  appointmentId?: string;
  doses?: number;
  currentDose?: number;
  phoneNumber?: string;
  [key: string]: any;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  category: 'appointment' | 'vaccine' | 'reminder' | 'system' | 'general';
}

export class NotificationTemplates {
  /**
   * Get template by ID
   */
  static getTemplate(templateId: string): NotificationTemplate | undefined {
    return this.templates[templateId];
  }

  /**
   * Render template with context variables
   */
  static render(templateId: string, context: TemplateContext = {}): { subject: string; body: string } | null {
    const template = this.getTemplate(templateId);
    if (!template) return null;

    return {
      subject: this.interpolate(template.subject, context),
      body: this.interpolate(template.body, context)
    };
  }

  /**
   * Interpolate template variables with context
   * Example: "Olá {{userName}}" with context { userName: "João" } = "Olá João"
   */
  private static interpolate(text: string, context: TemplateContext): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return context[key] || match;
    });
  }

  /**
   * Get all templates by category
   */
  static getTemplatesByCategory(category: NotificationTemplate['category']): NotificationTemplate[] {
    return Object.values(this.templates).filter((t) => t.category === category);
  }

  /**
   * List all available templates
   */
  static listAll(): NotificationTemplate[] {
    return Object.values(this.templates);
  }

  private static readonly templates: Record<string, NotificationTemplate> = {
    // ============ APPOINTMENT TEMPLATES ============

    appointment_scheduled: {
      id: 'appointment_scheduled',
      name: 'Agendamento Confirmado',
      description: 'Confirma que o agendamento foi realizado com sucesso',
      subject: 'Seu agendamento na {{healthUnitName}} foi confirmado',
      body: `Olá {{userName}}! 👋

Seu agendamento foi confirmado com sucesso! ✅

📍 Local: {{healthUnitName}}
📅 Data: {{date}}
🕐 Horário: {{time}}
💉 Vacina: {{vaccineName}}

Por favor, chegue 10 minutos antes do horário agendado com seus documentos em mãos.

Dúvidas? Entre em contato com a unidade de saúde.

Obrigado! 💙
Baixada Vacinada`,
      category: 'appointment'
    },

    appointment_reminder_24h: {
      id: 'appointment_reminder_24h',
      name: 'Lembrete de Agendamento (24h)',
      description: 'Lembrete 24 horas antes do agendamento',
      subject: 'Não esqueça! Seu agendamento é amanhã em {{healthUnitName}}',
      body: `Olá {{userName}}! 🔔

Lembrete: Seu agendamento é AMANHÃ!

📍 Local: {{healthUnitName}}
📅 Data: {{date}}
🕐 Horário: {{time}}
💉 Vacina: {{vaccineName}}

Chegue 10 minutos mais cedo. Leve seus documentos! 📋

Qualquer dúvida, entre em contato com a unidade.

Nos vemos amanhã! 💙
Baixada Vacinada`,
      category: 'reminder'
    },

    appointment_reminder_2h: {
      id: 'appointment_reminder_2h',
      name: 'Lembrete de Agendamento (2h)',
      description: 'Lembrete 2 horas antes do agendamento',
      subject: 'Último lembrete: seu agendamento é hoje em 2 horas',
      body: `Olá {{userName}}! ⏰

Seu agendamento é em POUCAS HORAS!

📍 Local: {{healthUnitName}}
🕐 Horário: {{time}} (hoje)
💉 Vacina: {{vaccineName}}

Prepare-se e chegue alguns minutos antes! 

Nos vemos em breve! 💙
Baixada Vacinada`,
      category: 'reminder'
    },

    appointment_cancelled: {
      id: 'appointment_cancelled',
      name: 'Agendamento Cancelado',
      description: 'Notifica cancelamento de agendamento',
      subject: 'Seu agendamento em {{healthUnitName}} foi cancelado',
      body: `Olá {{userName}},

Informamos que seu agendamento foi cancelado.

📍 Local: {{healthUnitName}}
📅 Data: {{date}}
🕐 Horário: {{time}}

Para reagendar, acesse nosso app ou entre em contato com a unidade de saúde.

Continuamos à sua disposição! 💙
Baixada Vacinada`,
      category: 'appointment'
    },

    appointment_rescheduled: {
      id: 'appointment_rescheduled',
      name: 'Agendamento Remarcado',
      description: 'Confirma remarcação de agendamento',
      subject: 'Seu agendamento foi remarcado para {{date}}',
      body: `Olá {{userName}}! 👋

Seu agendamento foi remarcado com sucesso! ✅

NOVO AGENDAMENTO:
📍 Local: {{healthUnitName}}
📅 Data: {{date}}
🕐 Horário: {{time}}
💉 Vacina: {{vaccineName}}

O agendamento anterior foi cancelado.

Nos vemos em breve! 💙
Baixada Vacinada`,
      category: 'appointment'
    },

    // ============ VACCINE TEMPLATES ============

    vaccine_available: {
      id: 'vaccine_available',
      name: 'Vacina Disponível',
      description: 'Notifica sobre disponibilidade de vacina',
      subject: '💉 {{vaccineName}} disponível em {{healthUnitName}}!',
      body: `Olá {{userName}}! 🎉

Ótima notícia! A vacina {{vaccineName}} está disponível em {{healthUnitName}}!

📍 Local: {{healthUnitName}}
💉 Vacina: {{vaccineName}}
📱 Horário de funcionamento: {{time}}

Agende seu atendimento agora mesmo no nosso app!

Não perca essa oportunidade! 💙
Baixada Vacinada`,
      category: 'vaccine'
    },

    vaccine_stock_low: {
      id: 'vaccine_stock_low',
      name: 'Estoque Baixo',
      description: 'Alerta sobre estoque baixo de vacina',
      subject: '⚠️ Estoque baixo: {{vaccineName}} em {{healthUnitName}}',
      body: `Aviso importante:

A vacina {{vaccineName}} está com estoque baixo em {{healthUnitName}}.

Se você precisa dessa vacina, recomendamos agendar seu atendimento o quanto antes!

📍 Local: {{healthUnitName}}
💉 Vacina: {{vaccineName}}

Acesse nosso app para agendar! 🏥

Baixada Vacinada`,
      category: 'vaccine'
    },

    vaccine_out_of_stock: {
      id: 'vaccine_out_of_stock',
      name: 'Fora de Estoque',
      description: 'Notifica que vacina está fora de estoque',
      subject: '⚠️ {{vaccineName}} indisponível em {{healthUnitName}}',
      body: `Olá {{userName}},

Informamos que a vacina {{vaccineName}} está temporariamente indisponível em {{healthUnitName}}.

⏳ Previsão de reabastecimento: {{date}}

Você será notificado quando a vacina voltar ao estoque!

Obrigado pela compreensão! 💙
Baixada Vacinada`,
      category: 'vaccine'
    },

    vaccination_completed: {
      id: 'vaccination_completed',
      name: 'Vacinação Realizada',
      description: 'Confirma que vacinação foi realizada',
      subject: '✅ Sua vacinação foi registrada com sucesso!',
      body: `Parabéns {{userName}}! 🎉

Sua vacinação foi registrada com sucesso! ✅

💉 Vacina: {{vaccineName}}
📅 Data: {{date}}
📍 Local: {{healthUnitName}}
🔢 Dose: {{currentDose}}/{{doses}}

Próxima dose: {{date}}

Dados registrados em seu histórico de vacinação!

Obrigado por se vacinar! 💙
Baixada Vacinada`,
      category: 'vaccine'
    },

    vaccination_dose_due: {
      id: 'vaccination_dose_due',
      name: 'Próxima Dose Vencida',
      description: 'Alerta que próxima dose venceu',
      subject: '⏰ Sua próxima dose de {{vaccineName}} está vencida',
      body: `Olá {{userName}},

Sua próxima dose de {{vaccineName}} está vencida!

💉 Vacina: {{vaccineName}}
📅 Vencimento: {{date}}
🔢 Dose: {{currentDose + 1}}/{{doses}}

Por favor, agende seu atendimento o quanto antes para manter sua proteção em dia!

📍 {{healthUnitName}} está pronta para atendê-lo!

Agende agora no nosso app! 🏥

Baixada Vacinada`,
      category: 'reminder'
    },

    vaccination_dose_approaching: {
      id: 'vaccination_dose_approaching',
      name: 'Próxima Dose se Aproximando',
      description: 'Lembrete que próxima dose está se aproximando',
      subject: '📅 Sua próxima dose de {{vaccineName}} está chegando',
      body: `Olá {{userName}},

Sua próxima dose de {{vaccineName}} está se aproximando!

💉 Vacina: {{vaccineName}}
📅 Recomendação: {{date}}
🔢 Dose: {{currentDose + 1}}/{{doses}}

Agende seu atendimento e mantenha sua proteção em dia! 💪

Acesse nosso app para agendar! 🏥

Obrigado! 💙
Baixada Vacinada`,
      category: 'reminder'
    },

    // ============ SYSTEM TEMPLATES ============

    account_created: {
      id: 'account_created',
      name: 'Conta Criada',
      description: 'Boas-vindas ao novo usuário',
      subject: 'Bem-vindo à Baixada Vacinada! 👋',
      body: `Olá {{userName}}! 👋

Bem-vindo à Baixada Vacinada! 🎉

Sua conta foi criada com sucesso!

Você agora pode:
✅ Agendar suas vacinas
✅ Consultar disponibilidade
✅ Ver seu histórico de vacinação
✅ Receber lembretes importantes

Comece agora mesmo acessando nosso app!

Qualquer dúvida, estamos à disposição! 💙

Baixada Vacinada`,
      category: 'system'
    },

    profile_updated: {
      id: 'profile_updated',
      name: 'Perfil Atualizado',
      description: 'Confirma atualização de perfil',
      subject: 'Seus dados foram atualizados com sucesso',
      body: `Olá {{userName}},

Seus dados de perfil foram atualizados com sucesso! ✅

Se você não realizou esta ação, entre em contato conosco imediatamente.

Continuamos à sua disposição! 💙

Baixada Vacinada`,
      category: 'system'
    },

    whatsapp_opt_in_confirmation: {
      id: 'whatsapp_opt_in_confirmation',
      name: 'Confirmação WhatsApp',
      description: 'Confirma ativação de notificações WhatsApp',
      subject: '✅ Notificações via WhatsApp ativadas',
      body: `Olá {{userName}}! 👋

Notificações via WhatsApp foram ativadas com sucesso! ✅

Você receberá:
📱 Lembretes de agendamentos
💉 Avisos sobre vacinas disponíveis
📅 Notificações importantes
✅ Confirmações de ações

Obrigado! 💙
Baixada Vacinada`,
      category: 'system'
    },

    // ============ GENERAL TEMPLATES ============

    general_announcement: {
      id: 'general_announcement',
      name: 'Anúncio Geral',
      description: 'Anúncio genérico para todos os usuários',
      subject: 'Comunicado importante',
      body: `Olá {{userName}},

Segue importante comunicado:

{{message}}

Para mais informações, visite nosso app!

Obrigado! 💙
Baixada Vacinada`,
      category: 'general'
    },

    maintenance_notice: {
      id: 'maintenance_notice',
      name: 'Aviso de Manutenção',
      description: 'Notifica sobre manutenção do sistema',
      subject: '🔧 Manutenção programada do sistema',
      body: `Atenção {{userName}}! 🔧

Realizaremos manutenção do sistema em:
📅 {{date}}
🕐 {{time}}

Nossos serviços estarão temporariamente indisponíveis.

Pedimos desculpas pelo inconveniente!

Obrigado pela compreensão! 💙
Baixada Vacinada`,
      category: 'system'
    },

    help_available: {
      id: 'help_available',
      name: 'Suporte Disponível',
      description: 'Informa que suporte está disponível',
      subject: '💬 Estamos aqui para ajudar!',
      body: `Olá {{userName}},

Tem dúvidas sobre vacinação ou agendamentos? 💬

Nossa equipe está pronta para ajudar via WhatsApp!

📱 Entre em contato conosco a qualquer momento

Estamos aqui para você! 💙
Baixada Vacinada`,
      category: 'general'
    }
  };
}
