/**
 * Seed Notification Templates
 * Run this script to populate the database with initial templates
 * 
 * Usage: npx ts-node src/infrastructure/database/seeds/seedNotificationTemplates.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { NotificationTemplateModel } from '../models/notificationTemplateModel';

dotenv.config();

const templates = [
  {
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
    status: 'ativo',
    roles: ['public', 'agent', 'admin']
  },
  {
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
  {
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
  {
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
  {
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
  {
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
  {
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
  }
];

async function seedTemplates() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/baixada_vacinada';
    await mongoose.connect(mongoUri);

    console.log('Connected to MongoDB');
    console.log('Seeding notification templates...\n');

    // Clear existing templates
    await NotificationTemplateModel.deleteMany({});
    console.log('Cleared existing templates');

    // Insert new templates
    for (const template of templates) {
      await NotificationTemplateModel.create(template);
      console.log(`✓ Created template: ${template.name} (${template.id})`);
    }

    console.log(`\n✓ Successfully seeded ${templates.length} templates`);

    // Disconnect
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding templates:', error);
    process.exit(1);
  }
}

// Run seed
seedTemplates();
