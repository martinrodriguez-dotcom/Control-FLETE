export type ViewState = 'dashboard' | 'units' | 'clients' | 'trips' | 'expenses' | 'fuel' | 'reports' | 'settlements' | 'maintenance' | 'admin';

export type UserRole = 'administrador' | 'encargado' | 'operario';
export type UserStatus = 'pendiente' | 'activo' | 'bloqueado';

export interface BaseEntity { 
  id: string; 
  createdAt: number; 
  userEmail?: string; 
}

export interface UserProfile extends BaseEntity {
  email: string;
  role: UserRole;
  status: UserStatus; 
  name: string;
  isActive?: boolean;
}

export interface TransportUnit extends BaseEntity {
  name: string; plate: string; brand: string; model: string; year: number;
  type: 'camion' | 'semirremolque' | 'tanque'; // <-- NUEVO TIPO: tanque
  insuranceCompany: string; insuranceExpiry: string;
  status: 'activo' | 'inactivo'; notes: string;
  currentKm?: number; 
  
  // NUEVOS CAMPOS EXCLUSIVOS PARA TANQUES
  fuelCapacity?: number; // Capacidad total en litros
  fuelAlertPercentage?: number; // Ej: 15 (Avisa cuando quede menos del 15%)
  currentFuel?: number; // Litros actuales en tiempo real
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
  sourceTankId?: string; // NUEVO: Para saber de qué tanque interno salió el gasoil
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
