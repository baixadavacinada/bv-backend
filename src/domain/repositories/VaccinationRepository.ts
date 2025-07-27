export interface VaccinationRepository {
  create(record: any): Promise<any>;
}
