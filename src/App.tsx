import React, { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query } from 'firebase/firestore';

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

// Componentes de UI (para inyectar en los formularios de SimpleCRUD)
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

  // Efecto: Manejo de Autenticación
  useEffect(() => {
    // Para simplificar, iniciamos sesión de forma anónima automáticamente.
    // En el futuro, puedes cambiar esto por signInWithEmailAndPassword.
    signInAnonymously(auth).catch(err => console.error("Error Auth:", err));
    
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Efecto: Sincronización en tiempo real con Firestore
  useEffect(() => {
    if (!user) return;
    
    const collections = ['units', 'clients', 'trips', 'expenses', 'fuel'];
    const setters = { units: setUnits, clients: setClients, trips: setTrips, expenses: setExpenses, fuel: setFuel };
    const unsubs: any[] = [];

    collections.forEach(colName => {
      // Estructura de base de datos segura por usuario: users/{userId}/{colección}
      const q = query(collection(db, 'users', user.uid, colName));
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

  // Funciones genéricas para guardar y eliminar en la base de datos
  const handleSaveItem = async (collectionName: string, data: any) => {
    if (!user) return;
    const id = data.id || crypto.randomUUID();
    const payload = { ...data, id, createdAt: data.createdAt || Date.now() };
    await setDoc(doc(db, 'users', user.uid, collectionName, id), payload);
  };

  const handleDeleteItem = async (collectionName: string, id: string) => {
    if (!user) return;
    if (window.confirm('¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer.')) {
      await deleteDoc(doc(db, 'users', user.uid, collectionName, id));
    }
  };

  // Pantalla de carga mientras se conecta a Firebase
  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex ${darkMode ? 'dark bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      <Sidebar view={view} setView={setView} isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header darkMode={darkMode} setDarkMode={setDarkMode} setSidebarOpen={setSidebarOpen} user={user} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            
            {/* VISTAS ESPECÍFICAS */}
            {view === 'dashboard' && (
              <DashboardView trips={trips} expenses={expenses} fuel={fuel} units={units} />
            )}
            
            {view === 'units' && (
              <UnitsView units={units} onSave={handleSaveItem} onDelete={handleDeleteItem} />
            )}

            {view === 'trips' && (
              <TripsView trips={trips} clients={clients} units={units} onSave={handleSaveItem} onDelete={handleDeleteItem} />
            )}

            {/* VISTAS GENERADAS CON CRUD GENÉRICO */}
            {view === 'clients' && (
              <SimpleCRUDView 
                title="Clientes" 
                collectionName="clients" 
                data={clients}
                onSave={handleSaveItem}
                onDelete={handleDeleteItem}
                fields={[
                  {key:'company', label:'Empresa'}, 
                  {key:'name', label:'Contacto'}, 
                  {key:'phone', label:'Teléfono'}, 
                  {key:'cuit', label:'CUIT'}
                ]}
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

            {view === 'expenses' && (
              <SimpleCRUDView 
                title="Gastos Operativos" 
                collectionName="expenses" 
                data={expenses}
                onSave={handleSaveItem}
                onDelete={handleDeleteItem}
                fields={[
                  {key:'date', label:'Fecha', format: (val) => new Date(val).toLocaleDateString('es-AR')}, 
                  {key:'category', label:'Categoría'}, 
                  {key:'description', label:'Descripción'}, 
                  {key:'amount', label:'Monto', format: (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val)}
                ]}
                FormContent={
                  <>
                    <Input label="Fecha" name="date" type="date" required />
                    <Input label="Categoría" name="category" type="select" options={[
                      {label:'Peajes', value:'peajes'}, {label:'Mecánica', value:'mecanica'}, 
                      {label:'Neumáticos', value:'neumaticos'}, {label:'Viáticos', value:'viaticos'},
                      {label:'Lavado', value:'lavado'}, {label:'Otros', value:'otros'}
                    ]} required />
                    <Input label="Unidad Afectada" name="unitId" type="select" options={units.map(u => ({label: u.name, value: u.id}))} required />
                    <Input label="Monto ($)" name="amount" type="number" required />
                    <div className="sm:col-span-2">
                      <Input label="Descripción" name="description" required />
                    </div>
                  </>
                }
              />
            )}

            {view === 'fuel' && (
              <SimpleCRUDView 
                title="Cargas de Combustible" 
                collectionName="fuel" 
                data={fuel}
                onSave={handleSaveItem}
                onDelete={handleDeleteItem}
                fields={[
                  {key:'date', label:'Fecha', format: (val) => new Date(val).toLocaleDateString('es-AR')}, 
                  {key:'liters', label:'Litros'}, 
                  {key:'total', label:'Total', format: (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val)},
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
                    <div className="sm:col-span-2">
                      <Input label="Estación de Servicio" name="station" />
                    </div>
                  </>
                }
              />
            )}
            
            {view === 'reports' && (
              <div className="p-8 text-center text-slate-500">
                <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Módulo de Reportes</h3>
                <p>Aquí puedes integrar gráficas con Recharts y exportaciones en PDF/Excel basándote en los datos descargados.</p>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
