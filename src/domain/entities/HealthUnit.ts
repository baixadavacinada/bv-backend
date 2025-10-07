export interface HealthUnit {
  _id?: string;
  name: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  operatingHours?: string;
  availableVaccines?: string[];
  geolocation?: {
    lat: number;
    lng: number;
  };
  isActive: boolean;
  isFavorite: boolean;
}
