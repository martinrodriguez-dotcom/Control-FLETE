import { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, getDocs } from 'firebase/firestore';

// Tipos
import { ViewState, TransportUnit, Client, Trip, Expense, FuelLoad } from './types';

// Componentes de Layout
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

// Vistas / Pages
import { DashboardView } from './pages/Dashboard';
import { UnitsView } from './pages/Units';
import { TripsView } from './pages/Trips';
import { SimpleCRUDView } from './pages/SimpleCRUD';
import { ExpensesView } from './pages/Expenses';
import { ReportsView } from './pages/Reports';
import { LoginView } from './pages/Login';

// Componentes de UI
import { Input } from './components/ui/Input';
import { Button } from './components/ui/Button';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [view, setView] = useState<ViewState>('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  // Estado para mostrar el cartel de migración temporal
  const [showMigrator, setShowMigrator] = useState(true);

  // Estados de datos
  const [units, setUnits] = useState<TransportUnit[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fuel, setFuel] = useState<FuelLoad[]>([]);

  // Efecto: Manejo de Autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Efecto: Sincronización en tiempo real con Firestore (MÚLTIPLES USUARIOS COMPARTIDOS)
  useEffect(() => {
    if (!user) return;
    
    const collections = ['units', 'clients', 'trips', 'expenses', 'fuel'];
    const setters = { units: setUnits, clients: setClients, trips: setTrips, expenses: setExpenses, fuel: setFuel };
    const unsubs: any[] = [];

    collections.forEach(colName => {
      // AHORA APUNTA A LA RUTA COMPARTIDA DE LA EMPRESA (YA NO ES POR USUARIO)
      const q = query(collection(db, 'artifacts', 'logisflow', 'public', 'data', colName));
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

  // Funciones genéricas para guardar y eliminar en la base de datos compartida
  const handleSaveItem = async (collectionName: string, data: any) => {
    if (!user) return;
    const id = data.id || crypto.randomUUID();
    const payload = { ...data, id, createdAt: data.createdAt || Date.now() };
    await setDoc(doc(db, 'artifacts', 'logisflow', 'public', 'data', collectionName, id), payload);
  };

  const handleDeleteItem = async (collectionName: string, id: string) => {
    if (!user) return;
    if (window.confirm('¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer.')) {
      await deleteDoc(doc(db, 'artifacts', 'logisflow', 'public', 'data', collectionName, id));
    }
  };

  // Función Mágica para recuperar los datos viejos
  const handleMigrateOldData = async () => {
    const oldUid = window.prompt("Ve a Firebase -> Authentication -> Users. Copia el 'User UID' de tu cuenta anónima vieja y pégalo aquí:");
    if (!oldUid) return;

    if (!window.confirm("¿Importar datos a la base de datos compartida?")) return;

    try {
      const collections = ['units', 'clients', 'trips', 'expenses', 'fuel'];
      let count = 0;
      for (const col of collections) {
        // Lee los datos de tu usuario viejo
        const snap = await getDocs(query(collection(db, 'users', oldUid.trim(), col)));
        for (const documentSnap of snap.docs) {
           // Los guarda en la nueva ruta compartida
           await setDoc(doc(db, 'artifacts', 'logisflow', 'public', 'data', col, documentSnap.id), documentSnap.data());
           count++;
        }
      }
      alert(`¡Migración Exitosa! Se recuperaron ${count} registros. Ahora son visibles para cualquier usuario de tu empresa.`);
      setShowMigrator(false); // Oculta el cartel
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error. Asegúrate de haber pegado el UID correctamente y de haber actualizado las Reglas de Firebase.");
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
        
        {/* Cartel temporal de recuperación de datos */}
        {showMigrator && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-800 p-4 flex flex-col sm:flex-row gap-3 justify-between items-center text-sm z-10">
            <span className="text-blue-800 dark:text-blue-300">
              <strong>Modo Multiusuario Activado:</strong> Si te faltan los datos que cargaste ayer, puedes recuperarlos con un clic.
            </span>
            <div className="flex gap-2">
              <Button variant="primary" onClick={handleMigrateOldData}>Recuperar mis datos</Button>
              <Button variant="ghost" onClick={() => setShowMigrator(false)}>Ocultar</Button>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            
            {view === 'dashboard' && <DashboardView trips={trips} expenses={expenses} fuel={fuel} units={units} clients={clients} />}
            {view === 'units' && <UnitsView units={units} onSave={handleSaveItem} onDelete={handleDeleteItem} />}
            {view === 'trips' && <TripsView trips={trips} clients={clients} units={units} onSave={handleSaveItem} onDelete={handleDeleteItem} />}
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
