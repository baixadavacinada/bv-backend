import { UbsRepository } from '../../../domain/repositories/UbsRepository';

export class ListUbsUseCase {
  constructor(private ubsRepository: UbsRepository) {}

  async execute(city: string) {
    return this.ubsRepository.listByCity(city);
  }
}
