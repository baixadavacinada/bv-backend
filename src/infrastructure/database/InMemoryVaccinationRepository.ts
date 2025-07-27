import { VaccinationRepository } from '../../domain/repositories/VaccinationRepository';

export class InMemoryVaccinationRepository implements VaccinationRepository {
  private records: any[] = [];

  async create(record: any): Promise<any> {
    const newRecord = { id: this.records.length + 1, ...record };
    this.records.push(newRecord);
    return newRecord;
  }
}
