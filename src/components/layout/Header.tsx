import React, { useState, useRef, useEffect } from 'react';
import { Menu, Moon, Sun, Bell, LogOut, User as UserIcon, AlertTriangle, ShieldAlert, Info, Settings } from 'lucide-react';
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Cerrar menús al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- MOTOR AUTOMÁTICO DE ALERTAS ---
  const generateAlerts = () => {
    const newAlerts = [];

    // 1. Alertas de Combustible en Tanques
    const tanks = units.filter(u => u.type === 'tanque' && u.status === 'activo');
    tanks.forEach(tank => {
      const capacity = tank.fuelCapacity || 1;
      const current = tank.currentFuel || 0;
      const alertPct = tank.fuelAlertPercentage || 15;
      const currentPct = (current / capacity) * 100;

      if (currentPct <= alertPct) {
        newAlerts.push({
          id: `fuel-${tank.id}`,
          type: 'critical',
          title: 'Nivel Crítico de Gasoil',
          message: `El tanque ${tank.name} está al ${currentPct.toFixed(0)}% (${current} Lts restantes).`,
          icon: AlertTriangle,
          color: 'text-red-500',
          bg: 'bg-red-50 dark:bg-red-900/20'
        });
      }
    });

    // 2. Alertas de Mantenimiento (Service)
    const vehicles = units.filter(u => u.type !== 'tanque' && u.status === 'activo');
    vehicles.forEach(vehicle => {
      const vServices = services.filter(s => s.unitId === vehicle.id && s.type === 'service').sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      const lastService = vServices[0];
      const currentKm = vehicle.currentKm || 0;

      if (lastService && lastService.serviceInterval) {
        const nextServiceKm = lastService.currentKmOrHours + lastService.serviceInterval;
        const kmRemaining = nextServiceKm - currentKm;

        if (kmRemaining <= 0) {
          newAlerts.push({
            id: `service-overdue-${vehicle.id}`,
            type: 'critical',
            title: 'Service Vencido',
            message: `La unidad ${vehicle.name} superó el kilometraje máximo para su mantenimiento.`,
            icon: ShieldAlert,
            color: 'text-red-500',
            bg: 'bg-red-50 dark:bg-red-900/20'
          });
        } else if (kmRemaining <= 1000) { 
          newAlerts.push({
            id: `service-warning-${vehicle.id}`,
            type: 'warning',
            title: 'Service Próximo',
            message: `La unidad ${vehicle.name} debe realizar service en ${kmRemaining} km.`,
            icon: Info,
            color: 'text-orange-500',
            bg: 'bg-orange-50 dark:bg-orange-900/20'
          });
        }
      }
    });

    return newAlerts;
  };

  const alerts = generateAlerts();
  const criticalAlertsCount = alerts.filter(a => a.type === 'critical').length;

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between px-4 sm:px-6 h-20">
        
        {/* BOTÓN MENÚ MÓVIL */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-all"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* ACCIONES Y PERFIL */}
        <div className="flex items-center gap-3 sm:gap-5">
          
          {/* BOTÓN TEMA CLARO/OSCURO */}
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-slate-800 transition-all"
            title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* CAMPANA DE NOTIFICACIONES */}
          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-slate-800 transition-all"
            >
              <Bell size={20} />
              {alerts.length > 0 && (
                <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${criticalAlertsCount > 0 ? 'bg-red-400' : 'bg-orange-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${criticalAlertsCount > 0 ? 'bg-red-500' : 'bg-orange-500'}`}></span>
                </span>
              )}
            </button>

            {/* DROPDOWN NOTIFICACIONES */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-slate-100 dark:border-slate-700 py-2 origin-top-right animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                  <h3 className="font-bold text-slate-900 dark:text-white">Centro de Alertas</h3>
                  <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 text-xs px-2 py-1 rounded-full font-bold">
                    {alerts.length} nuevas
                  </span>
                </div>
                
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {alerts.length === 0 ? (
                    <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                      <div className="bg-slate-50 dark:bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Bell size={24} className="text-slate-300" />
                      </div>
                      No hay alertas operativas en este momento.
                    </div>
                  ) : (
                    alerts.map((alert) => {
                      const Icon = alert.icon;
                      return (
                        <div key={alert.id} className="px-4 py-3 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors flex gap-3 items-start cursor-default">
                          <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${alert.bg} ${alert.color}`}>
                            <Icon size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{alert.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">{alert.message}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

          {/* MENÚ DE USUARIO */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 h-9 w-9 rounded-full flex items-center justify-center text-white shadow-inner font-bold text-sm">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight">
                  {user?.displayName || user?.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide truncate max-w-[120px]">
                  {user?.email}
                </p>
              </div>
            </button>

            {/* DROPDOWN USUARIO */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-slate-100 dark:border-slate-700 py-2 origin-top-right animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-3 mb-2 border-b border-slate-100 dark:border-slate-700 md:hidden">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {user?.displayName || 'Usuario'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>

                <div className="px-2">
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 dark:hover:text-blue-400 rounded-lg transition-colors">
                    <UserIcon size={16} /> Mi Perfil
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 dark:hover:text-blue-400 rounded-lg transition-colors">
                    <Settings size={16} /> Preferencias
                  </button>
                  
                  <div className="h-px bg-slate-100 dark:bg-slate-700 my-2 mx-2"></div>
                  
                  <button 
                    onClick={() => auth.signOut()}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium"
                  >
                    <LogOut size={16} /> Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
