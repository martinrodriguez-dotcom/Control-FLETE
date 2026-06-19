export type ViewState = 'dashboard' | 'units' | 'clients' | 'trips' | 'expenses' | 'fuel' | 'reports' | 'settlements' | 'maintenance' | 'admin';

export type UserRole = 'administrador' | 'encargado' | 'operario';

export interface BaseEntity { 
  id: string; 
  createdAt: number; 
  userEmail?: string; 
}

export interface UserProfile extends BaseEntity {
  email: string;
  role: UserRole;
  name: string;
  isActive: boolean;
}

export interface TransportUnit extends BaseEntity {
  name: string; plate: string; brand: string; model: string; year: number;
  type: 'camion' | 'semirremolque'; insuranceCompany: string; insuranceExpiry: string;
  status: 'activo' | 'inactivo'; notes: string;
  currentKm?: number; 
}

export interface Client extends BaseEntity {
  name: string; company: string; phone: string; email: string; address: string; cuit: string; notes: string;
}

export interface Trip extends BaseEntity {
  date: string; clientId: string; unitId: string; origin: string; destination: string;
  km: number; value: number; paymentMethod: string; paymentStatus: 'pendiente' | 'cobrado'; notes: string;
}

export interface Expense extends BaseEntity {
  date: string; description: string; category: string; amount: number; unitId: string; tripId?: string;
}

export interface FuelLoad extends BaseEntity {
  date: string; unitId: string; liters: number; pricePerLiter: number; total: number; station: string; currentKm: number;
}

export interface Settlement extends BaseEntity {
  date: string;
  unitId: string;
  tripIds: string[];
  totalAmount: number;
  notes: string;
}

export interface ServiceRecord extends BaseEntity {
  date: string;
  unitId: string;
  type: 'service' | 'km_update'; 
  currentKmOrHours: number;
  serviceInterval?: number; 
  partsReplaced?: string[]; 
  notes?: string;
}
