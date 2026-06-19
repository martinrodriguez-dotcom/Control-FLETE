import { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, getDoc, getDocs } from 'firebase/firestore';

// Tipos
import { ViewState, TransportUnit, Client, Trip, Expense, FuelLoad, Settlement, ServiceRecord, UserProfile, UserRole, UserStatus } from './types';

// Componentes
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { ShieldAlert, Clock } from 'lucide-react';

// Vistas
import { DashboardView } from './pages/Dashboard';
import { UnitsView } from './pages/Units';
import { TripsView } from './pages/Trips';
import { SettlementsView } from './pages/Settlements';
import { ExpensesView } from './pages/Expenses';
import { ReportsView } from './pages/Reports';
import { MaintenanceView } from './pages/Maintenance';
import { SimpleCRUDView } from './pages/SimpleCRUD';
import { LoginView } from './pages/Login';
import { AdminView } from './pages/Admin';

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
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);

  // 1. Efecto: Autenticación y Registro Automático
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      
      if (u && u.email) {
        const docRef = doc(db, 'user_profiles', u.uid);
        const snap = await getDoc(docRef);
        
        if (!snap.exists()) {
          const profilesSnap = await getDocs(collection(db, 'user_profiles'));
          const isFirstUser = profilesSnap.empty;

          const isMaster = u.email === 'admin@siipalletsflete.com';
          const assignedRole = (isFirstUser || isMaster) ? 'administrador' : 'operario';
          const assignedStatus = (isFirstUser || isMaster) ? 'activo' : 'pendiente';

          await setDoc(docRef, {
            id: u.uid,
            email: u.email,
            role: assignedRole,
            status: assignedStatus,
            name: u.displayName || u.email.split('@')[0].replace('.', ' '),
            createdAt: Date.now()
          });
        }
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Efecto: Descarga de Datos
  useEffect(() => {
    if (!user) return;
    
    const collections = ['units', 'clients', 'trips', 'expenses', 'fuel', 'settlements', 'services', 'user_profiles'];
    const setters = { 
      units: setUnits, clients: setClients, trips: setTrips, expenses: setExpenses, 
      fuel: setFuel, settlements: setSettlements, services: setServices, user_profiles: setUserProfiles
    };
    const unsubs: any[] = [];

    collections.forEach(colName => {
      const q = query(collection(db, colName));
      const unsub = onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => d.data() as any).sort((a, b) => b.createdAt - a.createdAt);
        setters[colName as keyof typeof setters](data);
      });
      unsubs.push(unsub);
    });

    return () => unsubs.forEach(u => u());
  }, [user]);

  // --- LÓGICA DE SEGURIDAD Y ROLES ---
  const currentUserProfile = userProfiles.find(p => p.email === user?.email);
  const userRole: UserRole = currentUserProfile?.role || 'operario';
  const userStatus: UserStatus = currentUserProfile?.status || (currentUserProfile?.isActive === false ? 'bloqueado' : currentUserProfile?.isActive === true ? 'activo' : 'pendiente');

  useEffect(() => {
    if (userRole === 'operario' && view !== 'maintenance') {
      setView('maintenance');
    }
  }, [userRole, view]);

  // Funciones protegidas
  const handleSaveItem = async (collectionName: string, data: any) => {
    if (!user) return;

    if (userRole === 'encargado' && collectionName !== 'user_profiles') {
      alert('MODO LECTURA: Tu rol de Encargado no permite agregar ni modificar registros.');
      return;
    }
    if (userRole === 'operario' && !['services', 'fuel', 'units'].includes(collectionName)) {
      alert('PERMISO DENEGADO: Solo puedes registrar datos de Mantenimiento y Combustible.');
      return;
    }

    const id = data.id || crypto.randomUUID();
    const payload = { ...data, id, createdAt: data.createdAt || Date.now() };
    await setDoc(doc(db, collectionName, id), payload);
  };

  const handleDeleteItem = async (collectionName: string, id: string) => {
    if (!user) return;

    if (userRole !== 'administrador') {
      alert('PERMISO DENEGADO: Solo el Administrador del sistema puede eliminar registros.');
      return;
    }

    if (window.confirm('¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer.')) {
      await deleteDoc(doc(db, collectionName, id));
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  // PANTALLA: USUARIO PENDIENTE DE APROBACIÓN
  if (userStatus === 'pendiente') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 text-center">
        <div className="bg-yellow-100 text-yellow-600 p-6 rounded-full mb-6 shadow-lg shadow-yellow-500/20 animate-pulse">
          <Clock size={64} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Cuenta en Revisión</h2>
        <p className="text-slate-500 max-w-md text-lg">
          Hola <strong>{currentUserProfile?.name || 'Usuario'}</strong>. Tu registro fue exitoso, pero un administrador debe habilitar tu acceso antes de que puedas usar el sistema.
        </p>
        <p className="text-slate-400 mt-4 text-sm">Por favor, avísale al encargado que ya te registraste.</p>
        <Button onClick={() => auth.signOut()} variant="ghost" className="mt-8 border border-slate-300">Salir por ahora</Button>
      </div>
    );
  }

  // PANTALLA: USUARIO BLOQUEADO
  if (userStatus === 'bloqueado') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 text-center">
        <ShieldAlert size={64} className="text-red-500 mb-4" />
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Acceso Bloqueado</h2>
        <p className="text-slate-500 max-w-md">Tu cuenta ha sido suspendida. Si crees que es un error, por favor comunícate con la administración de SII PALLETS.</p>
        <Button onClick={() => auth.signOut()} className="mt-8">Cerrar Sesión</Button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex ${darkMode ? 'dark bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <Sidebar view={view} setView={setView} isOpen={isSidebarOpen} setOpen={setSidebarOpen} userRole={userRole} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header darkMode={darkMode} setDarkMode={setDarkMode} setSidebarOpen={setSidebarOpen} user={user} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            
            {userRole !== 'operario' && (
              <>
                {view === 'dashboard' && <DashboardView trips={trips} expenses={expenses} fuel={fuel} units={units} clients={clients} />}
                {view === 'units' && <UnitsView units={units} onSave={handleSaveItem} onDelete={handleDeleteItem} />}
                {view === 'trips' && <TripsView trips={trips} clients={clients} units={units} onSave={handleSaveItem} onDelete={handleDeleteItem} />}
                {view === 'settlements' && <SettlementsView units={units} trips={trips} clients={clients} settlements={settlements} onSave={handleSaveItem} onDelete={handleDeleteItem} />}
                {view === 'expenses' && <ExpensesView expenses={expenses} units={units} onSave={handleSaveItem} onDelete={handleDeleteItem} />}
                
                {/* VISTA DE REPORTES (Aquí inyectamos la variable 'services') */}
                {view === 'reports' && <ReportsView units={units} trips={trips} expenses={expenses} fuel={fuel} services={services} />}
                
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
              </>
            )}

            {view === 'maintenance' && (
              <MaintenanceView 
                units={units} services={services} fuel={fuel} currentUserEmail={user.email || ''}
                onSave={handleSaveItem} onDelete={handleDeleteItem} 
              />
            )}

            {userRole === 'administrador' && view === 'admin' && (
              <AdminView users={userProfiles} onSave={handleSaveItem} />
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
