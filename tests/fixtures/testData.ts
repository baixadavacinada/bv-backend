// Test data fixtures for consistent testing

export const testUsers = {
  admin: {
    uid: 'test-admin-uid',
    email: 'admin@baixadavacinada.com',
    displayName: 'Test Admin',
    role: 'admin',
  },
  user: {
    uid: 'test-user-uid',
    email: 'user@example.com',
    displayName: 'Test User',
    role: 'user',
  },
};

export const testHealthUnit = {
  name: 'UBS Centro de Teste',
  address: 'Rua de Teste, 123, Centro',
  neighborhood: 'Centro', 
  city: 'Japeri',
  state: 'RJ',
  zipCode: '26445-000',
  phone: '(21) 9999-9999',
  operatingHours: {
    monday: { open: '08:00', close: '17:00' },
    tuesday: { open: '08:00', close: '17:00' },
    wednesday: { open: '08:00', close: '17:00' },
    thursday: { open: '08:00', close: '17:00' },
    friday: { open: '08:00', close: '17:00' },
  },
  geolocation: {
    latitude: -22.6464,
    longitude: -43.6533,
  },
  availableVaccines: ['COVID-19', 'Influenza'],
  isActive: true,
  isFavorite: false,
};

export const testVaccine = {
  name: 'COVID-19 Test Vaccine',
  manufacturer: 'Test Pharma',
  ageGroup: '18+',
  doses: ['1ª dose', '2ª dose'],
  isActive: true,
};

export const testAppointment = {
  // healthUnitId: will be set dynamically
  // vaccineId: will be set dynamically
  // residentId: will be set dynamically
  appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  status: 'scheduled',
  notes: 'Test appointment',
};

export const testFeedback = {
  // healthUnitId: will be set dynamically
  // userId: will be set dynamically
  comment: 'Excelente atendimento na unidade de saúde. Equipe muito profissional e atenciosa.',
  rating: 5,
  isAnonymous: false,
};

export const testNotification = {
  // userId: will be set dynamically
  title: 'Lembrete de Vacinação',
  message: 'Sua vacinação está agendada para amanhã às 14:00.',
  type: 'appointment_reminder',
  status: 'pending',
};

export const testVaccinationRecord = {
  // residentId: will be set dynamically
  // vaccineId: will be set dynamically
  // healthUnitId: will be set dynamically
  appliedBy: 'Dr. João Silva',
  dose: '1ª dose',
  date: new Date(),
  notes: 'Vacinação aplicada com sucesso',
};