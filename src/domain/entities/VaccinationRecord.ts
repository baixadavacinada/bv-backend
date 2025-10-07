export interface VaccinationRecord {
  _id?: string;
  residentId: string;
  vaccineId: string;
  healthUnitId: string;
  dose: '1ª dose' | '2ª dose' | '3ª dose' | 'dose única' | 'reforço';
  date: Date;
  appliedBy: string;
  createdBy: string;
  updatedBy?: string;
  isActive: boolean;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
