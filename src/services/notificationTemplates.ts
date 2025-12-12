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
  status?: 'ativo' | 'desativado';
  roles?: ('public' | 'agent' | 'admin')[];
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

  private static interpolate(text: string, context: TemplateContext): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return context[key] || match;
    });
  }

  static getTemplatesByCategory(category: NotificationTemplate['category']): NotificationTemplate[] {
    return Object.values(this.templates).filter((t) => t.category === category);
  }

  static listAll(): NotificationTemplate[] {
    return Object.values(this.templates);
  }

  private static readonly templates: Record<string, NotificationTemplate> = {

    appointment_scheduled: {
      id: 'appointment_scheduled',
      name: 'Agendamento Confirmado',
      description: 'Confirma que o agendamento foi realizado com sucesso',
      subject: 'Agendamento confirmado',
      body: `Olá, aqui é a equipe Baixada Vacinada!

Esperamos que você esteja bem, {{userName}}.

Temos uma ótima notícia: seu agendamento foi confirmado com sucesso.

Local: {{healthUnitName}}
Data: {{date}}
Horário: {{time}}
Vacina: {{vaccineName}}

Pedimos que chegue com 10 minutos de antecedência e traga seus documentos.

Acesse sua área na plataforma para mais detalhes: https://baixadavacinada.com/

Compartilhe com seus amigos e familiares: https://baixadavacinada.com/

Qualquer dúvida, entre em contato com a unidade de saúde.

Equipe Baixada Vacinada`,
      category: 'appointment',
      status: 'desativado',
      roles: ['public', 'agent', 'admin']
    },

    appointment_reminder_24h: {
      id: 'appointment_reminder_24h',
      name: 'Lembrete de Agendamento (24h)',
      description: 'Lembrete 24 horas antes do agendamento',
      subject: 'Lembrete: seu agendamento é amanhã',
      body: `Olá, aqui é a equipe Baixada Vacinada!

Tudo bem, {{userName}}?

Este é um lembrete amigável de que seu agendamento é amanhã.

Local: {{healthUnitName}}
Data: {{date}}
Horário: {{time}}
Vacina: {{vaccineName}}

Lembre-se de chegar 10 minutos mais cedo e trazer seus documentos.

Confira todos os detalhes na plataforma: https://baixadavacinada.com/

Compartilhe com quem você se importa: https://baixadavacinada.com/

Em caso de dúvidas, entre em contato com a unidade de saúde.

Equipe Baixada Vacinada`,
      category: 'reminder',
      status: 'desativado',
      roles: ['public', 'agent', 'admin']
    },

    appointment_reminder_2h: {
      id: 'appointment_reminder_2h',
      name: 'Lembrete de Agendamento (2h)',
      description: 'Lembrete 2 horas antes do agendamento',
      subject: 'Seu agendamento é hoje',
      body: `Olá, aqui é a equipe Baixada Vacinada!

Tudo pronto para hoje, {{userName}}?

Este é um lembrete de que seu agendamento é daqui a poucas horas.

Local: {{healthUnitName}}
Horário: {{time}}
Vacina: {{vaccineName}}

Prepare seus documentos e chegue alguns minutos antes do horário.

Veja os detalhes na plataforma: https://baixadavacinada.com/

Compartilhe nossa plataforma: https://baixadavacinada.com/

Nos vemos em breve.

Equipe Baixada Vacinada`,
      category: 'reminder',
      status: 'desativado',
      roles: ['public', 'agent', 'admin']
    },

    appointment_cancelled: {
      id: 'appointment_cancelled',
      name: 'Agendamento Cancelado',
      description: 'Notifica cancelamento de agendamento',
      subject: 'Agendamento cancelado',
      body: `Olá, aqui é a equipe Baixada Vacinada!

Esperamos que esteja tudo bem com você, {{userName}}.

Infelizmente precisamos informar que seu agendamento foi cancelado.

Local: {{healthUnitName}}
Data: {{date}}
Horário: {{time}}

Você pode realizar um novo agendamento facilmente pela nossa plataforma ou entrar em contato com a unidade de saúde.

Acesse: https://baixadavacinada.com/

Compartilhe com quem precisa: https://baixadavacinada.com/

Continuamos à sua disposição.

Equipe Baixada Vacinada`,
      category: 'appointment',
      status: 'desativado',
      roles: ['public', 'agent', 'admin']
    },

    appointment_rescheduled: {
      id: 'appointment_rescheduled',
      name: 'Agendamento Remarcado',
      description: 'Confirma remarcação de agendamento',
      subject: 'Agendamento remarcado',
      body: `Olá, aqui é a equipe Baixada Vacinada!

Tudo certo, {{userName}}?

Estamos confirmando que seu agendamento foi remarcado com sucesso.

Novo agendamento:
Local: {{healthUnitName}}
Data: {{date}}
Horário: {{time}}
Vacina: {{vaccineName}}

O agendamento anterior foi automaticamente cancelado.

Confira na plataforma: https://baixadavacinada.com/

Compartilhe conosco: https://baixadavacinada.com/

Nos vemos em breve.

Equipe Baixada Vacinada`,
      category: 'appointment',
      status: 'desativado',
      roles: ['public', 'agent', 'admin']
    },

    // ============ VACCINE TEMPLATES ============

    vaccine_available: {
      id: 'vaccine_available',
      name: 'Vacina Disponível',
      description: 'Notifica sobre disponibilidade de vacina',
      subject: 'Vacina disponível',
      body: `Olá, aqui é a equipe Baixada Vacinada!

Temos uma ótima notícia para você, {{userName}}.

A vacina {{vaccineName}} está disponível em {{healthUnitName}}.

Local: {{healthUnitName}}
Vacina: {{vaccineName}}
Horário de funcionamento: {{time}}

Você pode agendar seu atendimento pela nossa plataforma de forma rápida e fácil.

Acesse: https://baixadavacinada.com/

Compartilhe esta informação: https://baixadavacinada.com/

Não perca essa oportunidade de se proteger.

Equipe Baixada Vacinada`,
      category: 'vaccine',
      status: 'desativado',
      roles: ['public', 'agent', 'admin']
    },

    vaccine_stock_low: {
      id: 'vaccine_stock_low',
      name: 'Estoque Baixo',
      description: 'Alerta sobre estoque baixo de vacina',
      subject: 'Alerta: estoque baixo',
      body: `Olá, aqui é a equipe Baixada Vacinada!

Este é um alerta importante para você.

O estoque da vacina {{vaccineName}} está baixo em {{healthUnitName}}. Se você precisa dessa vacina, recomendamos que agende seu atendimento o quanto antes.

Local: {{healthUnitName}}
Vacina: {{vaccineName}}

Agende agora pela plataforma: https://baixadavacinada.com/

Compartilhe este alerta: https://baixadavacinada.com/

Não deixe para depois.

Equipe Baixada Vacinada`,
      category: 'vaccine',
      status: 'desativado',
      roles: ['public', 'agent', 'admin']
    },

    vaccine_out_of_stock: {
      id: 'vaccine_out_of_stock',
      name: 'Fora de Estoque',
      description: 'Notifica que vacina está fora de estoque',
      subject: 'Vacina temporariamente indisponível',
      body: `Olá, aqui é a equipe Baixada Vacinada!

Esperamos que esteja tudo bem, {{userName}}.

Infelizmente precisamos informar que a vacina {{vaccineName}} está temporariamente indisponível em {{healthUnitName}}.

Previsão de reabastecimento: {{date}}

Assim que a vacina voltar ao estoque, você será notificado imediatamente.

Acompanhe pela plataforma: https://baixadavacinada.com/

Compartilhe nossa plataforma: https://baixadavacinada.com/

Agradecemos sua compreensão.

Equipe Baixada Vacinada`,
      category: 'vaccine',
      status: 'desativado',
      roles: ['public', 'agent', 'admin']
    },

    vaccination_completed: {
      id: 'vaccination_completed',
      name: 'Vacinação Realizada',
      description: 'Confirma que vacinação foi realizada',
      subject: 'Vacinação registrada',
      body: `Olá, aqui é a equipe Baixada Vacinada!

Parabéns, {{userName}}!

Sua vacinação foi registrada com sucesso em nosso sistema.

Vacina: {{vaccineName}}
Data: {{date}}
Local: {{healthUnitName}}
Dose: {{currentDose}}/{{doses}}
Próxima dose: {{date}}

Todos os dados foram salvos em seu histórico de vacinação.

Acesse seu histórico: https://baixadavacinada.com/

Compartilhe e incentive outras pessoas: https://baixadavacinada.com/

Obrigado por se proteger e proteger quem você ama.

Equipe Baixada Vacinada`,
      category: 'vaccine',
      status: 'desativado',
      roles: ['public', 'agent', 'admin']
    },

    vaccination_dose_due: {
      id: 'vaccination_dose_due',
      name: 'Próxima Dose Vencida',
      description: 'Alerta que próxima dose venceu',
      subject: 'Alerta: dose vencida',
      body: `Olá, aqui é a equipe Baixada Vacinada!

Este é um alerta importante, {{userName}}.

Sua próxima dose de {{vaccineName}} está vencida e precisa ser tomada o quanto antes.

Vacina: {{vaccineName}}
Vencimento: {{date}}
Dose: {{currentDose + 1}}/{{doses}}
Local disponível: {{healthUnitName}}

Para manter sua proteção completa, é fundamental tomar a dose dentro do prazo recomendado.

Agende agora: https://baixadavacinada.com/

Compartilhe este lembrete: https://baixadavacinada.com/

Contamos com você.

Equipe Baixada Vacinada`,
      category: 'reminder',
      status: 'desativado',
      roles: ['public', 'agent', 'admin']
    },

    vaccination_dose_approaching: {
      id: 'vaccination_dose_approaching',
      name: 'Próxima Dose se Aproximando',
      description: 'Lembrete que próxima dose está se aproximando',
      subject: 'Lembrete: próxima dose se aproximando',
      body: `Olá, aqui é a equipe Baixada Vacinada!

Tudo bem, {{userName}}?

Este é um lembrete amigável de que sua próxima dose está se aproximando.

Vacina: {{vaccineName}}
Data recomendada: {{date}}
Dose: {{currentDose + 1}}/{{doses}}

Para garantir sua proteção completa, recomendamos que você agende seu atendimento com antecedência.

Agende pela plataforma: https://baixadavacinada.com/

Compartilhe: https://baixadavacinada.com/

Cuidar da saúde é cuidar de quem você ama.

Equipe Baixada Vacinada`,
      category: 'reminder',
      status: 'desativado',
      roles: ['public', 'agent', 'admin']
    },

    // ============ CUSTOM ACTIVE TEMPLATES ============

    lembretes_segunda_dose: {
      id: 'lembretes_segunda_dose',
      name: 'Lembretes de Segunda Dose',
      description: 'Notificações de lembretes para tomar a segunda dose da vacina',
      subject: 'Lembrete: segunda dose disponível',
      body: `Olá, aqui é a equipe Baixada Vacinada!

Esperamos que você esteja bem, {{userName}}.

Este é um lembrete importante: sua segunda dose de {{vaccineName}} está disponível.

Vacina: {{vaccineName}}
Unidade: {{healthUnitName}}

Para manter sua proteção completa, é fundamental tomar a segunda dose dentro do prazo recomendado.

Agende agora pela plataforma: https://baixadavacinada.com/

Compartilhe com seus conhecidos: https://baixadavacinada.com/

Contamos com você.

Equipe Baixada Vacinada`,
      category: 'reminder',
      status: 'ativo',
      roles: ['public', 'agent', 'admin']
    },

    novos_registros_vacinacao: {
      id: 'novos_registros_vacinacao',
      name: 'Novos Registros de Vacinação',
      description: 'Notificações quando uma nova dose for registrada no histórico',
      subject: 'Nova dose registrada',
      body: `Olá, aqui é a equipe Baixada Vacinada!

Parabéns, {{userName}}!

Uma nova dose foi registrada em seu histórico de vacinação.

Vacina: {{vaccineName}}
Dose: {{currentDose}}/{{doses}}
Data: {{date}}
Unidade: {{healthUnitName}}

Seu histórico foi atualizado e você pode consultá-lo a qualquer momento.

Acesse sua área: https://baixadavacinada.com/

Compartilhe e incentive: https://baixadavacinada.com/

Obrigado por manter sua saúde em dia.

Equipe Baixada Vacinada`,
      category: 'vaccine',
      status: 'ativo',
      roles: ['public', 'agent', 'admin']
    },

    novos_usuarios: {
      id: 'novos_usuarios',
      name: 'Alertas de Novos Cadastros de Usuários',
      description: 'Notifica sobre novos usuários registrados no sistema',
      subject: 'Novo cadastro no sistema',
      body: `Olá, aqui é o sistema Baixada Vacinada.

Este é um alerta automático sobre um novo cadastro.

Um novo usuário foi registrado com sucesso no sistema:

Nome: {{userName}}
Email: {{email}}
Data de Cadastro: {{date}}

Você pode acessar o painel administrativo para mais detalhes.

Acesse: https://baixadavacinada.com/

Equipe Baixada Vacinada`,
      category: 'system',
      status: 'ativo',
      roles: ['agent', 'admin']
    },

    novas_vacinas: {
      id: 'novas_vacinas',
      name: 'Alerta de Novas Vacinas',
      description: 'Notifica quando uma nova vacina é adicionada à aplicação',
      subject: 'Nova vacina no sistema',
      body: `Olá, aqui é o sistema Baixada Vacinada.

Este é um alerta automático sobre nova vacina.

Uma nova vacina foi adicionada ao sistema e já está disponível para agendamento:

Vacina: {{vaccineName}}
Fabricante: {{manufacturer}}
Data de Adição: {{date}}

Acesse o painel: https://baixadavacinada.com/

Equipe Baixada Vacinada`,
      category: 'vaccine',
      status: 'ativo',
      roles: ['agent', 'admin']
    },

    novas_ubs: {
      id: 'novas_ubs',
      name: 'Alerta de Novas UBSs',
      description: 'Notifica quando uma nova unidade de saúde é cadastrada',
      subject: 'Nova unidade de saúde cadastrada',
      body: `Olá, aqui é o sistema Baixada Vacinada.

Este é um alerta automático sobre nova unidade.

Uma nova unidade de saúde foi cadastrada e já está disponível para agendamentos:

Unidade: {{healthUnitName}}
Cidade: {{city}}
Telefone: {{phoneNumber}}
Data de Cadastro: {{date}}

Acesse o sistema: https://baixadavacinada.com/

Equipe Baixada Vacinada`,
      category: 'system',
      status: 'ativo',
      roles: ['agent', 'admin']
    },

    // ============ SYSTEM TEMPLATES ============

    account_created: {
      id: 'account_created',
      name: 'Conta Criada',
      description: 'Boas-vindas ao novo usuário',
      subject: 'Bem-vindo à Baixada Vacinada',
      body: `Olá, aqui é a equipe Baixada Vacinada!

Seja muito bem-vindo, {{userName}}!

É um prazer tê-lo conosco. Sua conta foi criada com sucesso e agora você pode aproveitar todos os nossos recursos.

Você pode agendar suas vacinas, consultar disponibilidade em tempo real, ver seu histórico completo de vacinação e receber lembretes importantes.

Acesse a plataforma: https://baixadavacinada.com/

Compartilhe com amigos e familiares: https://baixadavacinada.com/

Estamos à disposição para qualquer dúvida.

Equipe Baixada Vacinada`,
      category: 'system',
      status: 'desativado',
      roles: ['public', 'agent', 'admin']
    },

    profile_updated: {
      id: 'profile_updated',
      name: 'Perfil Atualizado',
      description: 'Confirma atualização de perfil',
      subject: 'Perfil atualizado',
      body: `Olá, aqui é a equipe Baixada Vacinada!

Esperamos que esteja tudo bem, {{userName}}.

Seus dados de perfil foram atualizados com sucesso em nosso sistema.

Se você não realizou esta alteração, entre em contato conosco imediatamente para verificarmos.

Acesse seu perfil: https://baixadavacinada.com/

Compartilhe nossa plataforma: https://baixadavacinada.com/

Continuamos à sua disposição.

Equipe Baixada Vacinada`,
      category: 'system',
      status: 'desativado',
      roles: ['public', 'agent', 'admin']
    },

    whatsapp_opt_in_confirmation: {
      id: 'whatsapp_opt_in_confirmation',
      name: 'Confirmação WhatsApp',
      description: 'Confirma ativação de notificações WhatsApp',
      subject: 'Número atualizado',
      body: `Olá, aqui é a equipe Baixada Vacinada!

Esperamos que você esteja bem, {{userName}}.

Estamos entrando em contato para confirmar que seu número de celular {{phoneNumber}} foi atualizado com sucesso em nosso sistema.

A partir de agora, você receberá lembretes de agendamentos, avisos sobre vacinas disponíveis e outras notificações importantes diretamente no WhatsApp.

Se você não realizou esta alteração, entre em contato conosco imediatamente.

Acesse nossa plataforma: https://baixadavacinada.com/

Compartilhe com seus amigos e familiares: https://baixadavacinada.com/

Estamos à disposição para qualquer dúvida.

Equipe Baixada Vacinada`,
      category: 'system',
      status: 'desativado',
      roles: ['public', 'agent', 'admin']
    },

    // ============ GENERAL TEMPLATES ============

    general_announcement: {
      id: 'general_announcement',
      name: 'Anúncio Geral',
      description: 'Anúncio genérico para todos os usuários',
      subject: 'Comunicado importante',
      body: `Olá, aqui é a equipe Baixada Vacinada!

Como vai, {{userName}}?

Gostaríamos de compartilhar um comunicado importante com você:

{{message}}

Para mais informações, acesse nossa plataforma: https://baixadavacinada.com/

Compartilhe conosco: https://baixadavacinada.com/

Obrigado pela atenção.

Equipe Baixada Vacinada`,
      category: 'general',
      status: 'desativado',
      roles: ['public', 'agent', 'admin']
    },

    maintenance_notice: {
      id: 'maintenance_notice',
      name: 'Aviso de Manutenção',
      description: 'Notifica sobre manutenção do sistema',
      subject: 'Manutenção programada',
      body: `Olá, aqui é a equipe Baixada Vacinada!

Atenção, {{userName}}.

Gostaríamos de informá-lo que realizaremos uma manutenção programada em nosso sistema.

Data: {{date}}
Horário: {{time}}

Durante este período, nossos serviços ficarão temporariamente indisponíveis. Pedimos desculpas pelo inconveniente e agradecemos sua compreensão.

Acompanhe atualizações: https://baixadavacinada.com/

Compartilhe: https://baixadavacinada.com/

Obrigado pela paciência.

Equipe Baixada Vacinada`,
      category: 'system',
      status: 'desativado',
      roles: ['public', 'agent', 'admin']
    },

    help_available: {
      id: 'help_available',
      name: 'Suporte Disponível',
      description: 'Informa que suporte está disponível',
      subject: 'Estamos aqui para ajudar',
      body: `Olá, aqui é a equipe Baixada Vacinada!

Como vai, {{userName}}?

Queremos que você saiba que estamos sempre à disposição para ajudar.

Tem dúvidas sobre vacinação, agendamentos ou qualquer funcionalidade da plataforma? Nossa equipe está pronta para atendê-lo via WhatsApp a qualquer momento.

Acesse nossa plataforma: https://baixadavacinada.com/

Compartilhe com quem precisa: https://baixadavacinada.com/

Estamos aqui para você.

Equipe Baixada Vacinada`,
      category: 'general',
      status: 'desativado',
      roles: ['public', 'agent', 'admin']
    }
  };
}
