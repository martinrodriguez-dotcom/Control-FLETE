import { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query } from 'firebase/firestore';

// Tipos
import { ViewState, TransportUnit, Client, Trip, Expense, FuelLoad, Settlement } from './types';

// Componentes de Layout
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

// Vistas / Pages
import { DashboardView } from './pages/Dashboard';
import { UnitsView } from './pages/Units';
import { TripsView } from './pages/Trips';
import { SettlementsView } from './pages/Settlements';
import { SimpleCRUDView } from './pages/SimpleCRUD';
import { ExpensesView } from './pages/Expenses';
import { ReportsView } from './pages/Reports';
import { LoginView } from './pages/Login';

// Componentes de UI
import { Input } from './components/ui/Input';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [view, setView] = useState<ViewState>('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Estados de datos
  const [units, setUnits] = useState<TransportUnit[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fuel, setFuel] = useState<FuelLoad[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  // Efecto: Manejo de Autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Efecto: Sincronización en tiempo real con Firestore (GLOBAL Y COMPARTIDO)
  useEffect(() => {
    if (!user) return;
    
    // Lista de colecciones a descargar desde Firebase
    const collections = ['units', 'clients', 'trips', 'expenses', 'fuel', 'settlements'];
    const setters = { 
      units: setUnits, 
      clients: setClients, 
      trips: setTrips, 
      expenses: setExpenses, 
      fuel: setFuel,
      settlements: setSettlements 
    };
    const unsubs: any[] = [];

    collections.forEach(colName => {
      // APUNTA DIRECTAMENTE A LA RAÍZ DE LA BASE DE DATOS
      const q = query(collection(db, colName));
      const unsub = onSnapshot(q, 
        (snap) => {
          const data = snap.docs.map(doc => doc.data() as any).sort((a, b) => b.createdAt - a.createdAt);
          setters[colName as keyof typeof setters](data);
        },
        (err) => console.error(`Error en la colección ${colName}:`, err)
      );
      unsubs.push(unsub);
    });

    return () => unsubs.forEach(u => u());
  }, [user]);

  // Funciones genéricas para guardar y eliminar (BASE DE DATOS GLOBAL)
  const handleSaveItem = async (collectionName: string, data: any) => {
    if (!user) return;
    const id = data.id || crypto.randomUUID();
    const payload = { ...data, id, createdAt: data.createdAt || Date.now() };
    await setDoc(doc(db, collectionName, id), payload);
  };

  const handleDeleteItem = async (collectionName: string, id: string) => {
    if (!user) return;
    if (window.confirm('¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer.')) {
      await deleteDoc(doc(db, collectionName, id));
    }
  };

  // Pantalla de carga
  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // SI NO HAY USUARIO, MUESTRA LOGIN
  if (!user) {
    return <LoginView />;
  }

  // APP PRINCIPAL
  return (
    <div className={`min-h-screen flex ${darkMode ? 'dark bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      <Sidebar view={view} setView={setView} isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header darkMode={darkMode} setDarkMode={setDarkMode} setSidebarOpen={setSidebarOpen} user={user} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            
            {view === 'dashboard' && <DashboardView trips={trips} expenses={expenses} fuel={fuel} units={units} clients={clients} />}
            {view === 'units' && <UnitsView units={units} onSave={handleSaveItem} onDelete={handleDeleteItem} />}
            {view === 'trips' && <TripsView trips={trips} clients={clients} units={units} onSave={handleSaveItem} onDelete={handleDeleteItem} />}
            
            {/* VISTA DE LIQUIDACIONES */}
            {view === 'settlements' && (
              <SettlementsView units={units} trips={trips} clients={clients} settlements={settlements} onSave={handleSaveItem} onDelete={handleDeleteItem} />
            )}

            {view === 'expenses' && <ExpensesView expenses={expenses} units={units} onSave={handleSaveItem} onDelete={handleDeleteItem} />}
            {view === 'reports' && <ReportsView units={units} trips={trips} expenses={expenses} fuel={fuel} />}

            {view === 'clients' && (
              <SimpleCRUDView 
                title="Clientes" collectionName="clients" data={clients} onSave={handleSaveItem} onDelete={handleDeleteItem}
                fields={[{key:'company', label:'Empresa'}, {key:'name', label:'Contacto'}, {key:'phone', label:'Teléfono'}, {key:'cuit', label:'CUIT'}]}
                FormContent={
                  <>
                    <Input label="Razón Social" name="company" required />
                    <Input label="Nombre de Contacto" name="name" required />
                    <Input label="Teléfono" name="phone" />
                    <Input label="Email" name="email" type="email" />
                    <Input label="Dirección" name="address" />
                    <Input label="CUIT" name="cuit" />
                  </>
                }
              />
            )}

            {view === 'fuel' && (
              <SimpleCRUDView 
                title="Cargas de Combustible" collectionName="fuel" data={fuel} onSave={handleSaveItem} onDelete={handleDeleteItem}
                fields={[
                  {key:'date', label:'Fecha', format: (val: string) => new Date(val).toLocaleDateString('es-AR', { timeZone: 'UTC' })}, 
                  {key:'liters', label:'Litros'}, 
                  {key:'total', label:'Total', format: (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val)},
                  {key:'station', label:'Estación'}
                ]}
                FormContent={
                  <>
                    <Input label="Fecha" name="date" type="date" required />
                    <Input label="Unidad" name="unitId" type="select" options={units.map(u => ({label: u.name, value: u.id}))} required />
                    <Input label="Litros" name="liters" type="number" required />
                    <Input label="Precio por Litro ($)" name="pricePerLiter" type="number" required />
                    <Input label="Total ($)" name="total" type="number" required />
                    <Input label="Kilometraje Actual" name="currentKm" type="number" />
                    <div className="sm:col-span-2"><Input label="Estación de Servicio" name="station" /></div>
                  </>
                }
              />
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
