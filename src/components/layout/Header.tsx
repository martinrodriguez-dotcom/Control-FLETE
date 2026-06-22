import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Menu, Moon, Sun, LogOut, User as UserIcon, Bell, ShieldAlert, AlertTriangle, Wrench, CheckCircle } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { User } from 'firebase/auth';
import { TransportUnit, ServiceRecord } from '../../types';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  setSidebarOpen: (value: boolean) => void;
  user: User | null;
  units?: TransportUnit[];
  services?: ServiceRecord[];
}

export const Header: React.FC<HeaderProps> = ({ 
  darkMode, setDarkMode, setSidebarOpen, user, units = [], services = [] 
}) => {
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const alertsRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú de alertas al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (alertsRef.current && !alertsRef.current.contains(event.target as Node)) {
        setIsAlertsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- MOTOR DE ALERTAS INTELIGENTES ---
  const alerts = useMemo(() => {
    const newAlerts: any[] = [];
    const now = new Date();
    
    // Fecha de control (5 días en el futuro)
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(now.getDate() + 5);

    units.forEach(unit => {
      if (unit.status !== 'activo') return; // Ignorar inactivos

      // 1. ALERTA DE SEGUROS (Solo vehículos)
      if (unit.type !== 'tanque' && unit.insuranceExpiry) {
        // Asegurarnos de que tome la fecha correctamente sin problemas de zona horaria
        const expiryParts = unit.insuranceExpiry.split('-');
        const expiryDate = new Date(Number(expiryParts[0]), Number(expiryParts[1]) - 1, Number(expiryParts[2]));
        
        if (expiryDate <= fiveDaysFromNow) {
          const isExpired = expiryDate < now;
          newAlerts.push({
            id: `ins-${unit.id}`,
            type: isExpired ? 'danger' : 'warning',
            icon: ShieldAlert,
            title: 'Seguro Vehicular',
            message: isExpired 
              ? `El seguro de ${unit.name} VENCIÓ el ${expiryDate.toLocaleDateString('es-AR')}.` 
              : `El seguro de ${unit.name} vence pronto (${expiryDate.toLocaleDateString('es-AR')}).`
          });
        }
      }

      // 2. ALERTA DE TANQUES
      if (unit.type === 'tanque') {
        const capacity = unit.fuelCapacity || 1;
        const current = unit.currentFuel || 0;
        const alertPct = unit.fuelAlertPercentage || 15;
        const pct = (current / capacity) * 100;
        
        if (pct <= alertPct) {
          newAlerts.push({
            id: `tank-${unit.id}`,
            type: 'danger',
            icon: AlertTriangle,
            title: 'Combustible Crítico',
            message: `El tanque ${unit.name} está al ${pct.toFixed(0)}% (${current} Lts).`
          });
        }
      }

      // 3. ALERTA DE MANTENIMIENTO (Solo vehículos)
      if (unit.type !== 'tanque') {
        const unitServices = services.filter(s => s.unitId === unit.id && s.type === 'service').sort((a,b) => b.createdAt - a.createdAt);
        if (unitServices.length > 0) {
          const lastService = unitServices[0];
          if (lastService.serviceInterval) {
            const nextServiceAt = lastService.currentKmOrHours + lastService.serviceInterval;
            const currentKm = unit.currentKm || 0;
            const remaining = nextServiceAt - currentKm;
            
            // Avisar cuando falten 500 km/hs o menos
            if (remaining <= 500) {
              const isPastDue = remaining < 0;
              newAlerts.push({
                id: `maint-${unit.id}`,
                type: isPastDue ? 'danger' : 'warning',
                icon: Wrench,
                title: 'Service Requerido',
                message: isPastDue 
                  ? `${unit.name} está PASADO de service por ${Math.abs(remaining)} km/hs.` 
                  : `${unit.name} requiere service en ${remaining} km/hs.`
              });
            }
          }
        }
      }
    });

    return newAlerts;
  }, [units, services]);

  const unreadCount = alerts.length;

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
      <div className="flex items-center">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 mr-2 md:hidden text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white hidden sm:block">
          LogisFlow <span className="text-blue-600">Enterprise</span>
        </h1>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        
        {/* CAMPANITA DE ALERTAS */}
        <div className="relative" ref={alertsRef}>
          <button
            onClick={() => setIsAlertsOpen(!isAlertsOpen)}
            className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors relative"
          >
            <Bell size={20} className={unreadCount > 0 ? "text-blue-600 animate-pulse" : ""} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
            )}
          </button>

          {/* DESPLEGABLE DE ALERTAS */}
          {isAlertsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-900 dark:text-white">Centro de Alertas</h3>
                <span className="bg-blue-100 text-blue-700 text-xs font-black px-2 py-1 rounded-full">{unreadCount}</span>
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                    <CheckCircle size={32} className="text-emerald-500 mb-2 opacity-50" />
                    <p className="text-sm">Todo está en orden.</p>
                    <p className="text-xs mt-1">No hay alertas pendientes.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {alerts.map(alert => {
                      const Icon = alert.icon;
                      const isDanger = alert.type === 'danger';
                      return (
                        <div key={alert.id} className={`p-4 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${isDanger ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                          <div className={`mt-0.5 p-2 rounded-full h-fit ${isDanger ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30'}`}>
                            <Icon size={16} />
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${isDanger ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                              {alert.title}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                              {alert.message}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          title="Alternar tema"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

        <div className="flex items-center gap-3 pl-2">
          <div className="hidden md:block text-right">
            <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none">
              {user?.displayName || user?.email?.split('@')[0]}
            </p>
            <p className="text-xs text-slate-500 mt-1">{user?.email}</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center border border-blue-200 dark:border-blue-800">
            <UserIcon size={18} />
          </div>
          <button
            onClick={() => auth.signOut()}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors ml-1"
            title="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
