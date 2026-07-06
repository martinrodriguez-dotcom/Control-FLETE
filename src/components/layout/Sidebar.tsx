import React from 'react';
import { 
  LayoutDashboard, Truck, Map as MapIcon, DollarSign, Receipt, Droplets, 
  Settings, Users, Shield, X, BarChart3, Package
} from 'lucide-react';
import { ViewState, UserRole } from '../../types';

interface SidebarProps {
  view: ViewState;
  setView: (v: ViewState) => void;
  isOpen: boolean;
  setOpen: (v: boolean) => void;
  userRole: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({ view, setView, isOpen, setOpen, userRole }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard, roles: ['administrador', 'encargado'] },
    { id: 'units', label: 'Unidades', icon: Truck, roles: ['administrador', 'encargado'] },
    { id: 'clients', label: 'Clientes', icon: Users, roles: ['administrador', 'encargado'] },
    { id: 'trips', label: 'Viajes', icon: MapIcon, roles: ['administrador', 'encargado'] },
    { id: 'settlements', label: 'Liquidaciones', icon: DollarSign, roles: ['administrador', 'encargado'] },
    { id: 'expenses', label: 'Gastos', icon: Receipt, roles: ['administrador', 'encargado'] },
    { id: 'fuel', label: 'Combustible', icon: Droplets, roles: ['administrador', 'encargado', 'operario'] },
    { id: 'maintenance', label: 'Mantenimiento', icon: Settings, roles: ['administrador', 'encargado', 'operario'] },
    { id: 'reports', label: 'Reportes', icon: BarChart3, roles: ['administrador', 'encargado'] },
    { id: 'admin', label: 'Administración', icon: Shield, roles: ['administrador'] }
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <>
      {/* Fondo oscuro para móviles cuando el menú está abierto */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Contenedor principal de la Barra Lateral */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 lg:w-64 flex flex-col
        bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl
        border-r border-slate-200/50 dark:border-slate-700/50
        shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)]
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* LOGO Y CABECERA DEL MENÚ */}
        <div className="h-20 flex items-center justify-between px-6 mb-2">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/30">
              <Package size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 tracking-tight">
                LogisFlow
              </h1>
              <p className="text-[10px] uppercase tracking-widest font-bold text-blue-600 dark:text-blue-400">Enterprise</p>
            </div>
          </div>
          <button 
            onClick={() => setOpen(false)} 
            className="lg:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* LISTA DE NAVEGACIÓN */}
        <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
          <nav className="space-y-1.5">
            {filteredMenu.map((item) => {
              const Icon = item.icon;
              const isActive = view === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setView(item.id as ViewState);
                    if (window.innerWidth < 1024) setOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-medium group relative overflow-hidden
                    ${isActive 
                      ? 'text-white shadow-md shadow-blue-500/25' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                    }
                  `}
                >
                  {/* Fondo activo con gradiente */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-100 transition-opacity" />
                  )}
                  
                  {/* Indicador lateral sutil para el estado activo */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-white rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                  )}

                  <div className="relative z-10 flex items-center gap-3">
                    <Icon size={20} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:text-blue-500'}`} />
                    <span className="text-sm font-semibold tracking-wide">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* PIE DEL MENÚ (Info del Rol) */}
        <div className="p-4 mt-auto">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Nivel de Acceso</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white capitalize flex items-center gap-2">
              <Shield size={14} className={userRole === 'administrador' ? 'text-blue-500' : 'text-emerald-500'} />
              {userRole}
            </p>
          </div>
        </div>

      </aside>
    </>
  );
};
