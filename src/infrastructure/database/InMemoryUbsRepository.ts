import { UbsRepository } from '../../domain/repositories/UbsRepository';

export class InMemoryUbsRepository implements UbsRepository {
  private ubs = [
    { id: 1, name: 'UBS Centro', city: 'Japeri' },
    { id: 2, name: 'UBS Engenheiro Pedreira', city: 'Japeri' }
  ];

  async listByCity(city: string): Promise<any[]> {
    return this.ubs.filter(u => u.city.toLowerCase() === city.toLowerCase());
  }
}
