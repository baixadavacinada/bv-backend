export interface UbsRepository {
  listByCity(city: string): Promise<any[]>;
}
