import React from 'react';
import { LayoutDashboard, Truck, Users, Map, Receipt, Fuel, PieChart, ChevronRight, ClipboardCheck } from 'lucide-react';
import { ViewState } from '../../types';

interface SidebarProps {
  view: ViewState;
  setView: (view: ViewState) => void;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ view, setView, isOpen, setOpen }) => {
  const navItems = [
    { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
    { id: 'units', label: 'Unidades', icon: Truck },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'trips', label: 'Viajes', icon: Map },
    { id: 'settlements', label: 'Liquidaciones', icon: ClipboardCheck },
    { id: 'expenses', label: 'Gastos', icon: Receipt },
    { id: 'fuel', label: 'Combustible', icon: Fuel },
    { id: 'reports', label: 'Reportes', icon: PieChart },
  ];

  return (
    <>
      {/* Sidebar contenedor */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-200 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static flex flex-col`}>
        
        {/* LOGO CORPORATIVO SII PALLETS */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <Truck className="text-blue-600 mr-2.5" size={26} strokeWidth={2.5} />
          <span className="text-2xl font-black tracking-tight">
            <span className="text-blue-600">SII</span>
            <span className="text-slate-900 dark:text-white ml-1.5">PALLETS</span>
          </span>
        </div>

        {/* Navegación */}
        <nav className="p-4 space-y-1 overflow-y-auto flex-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { 
                  setView(item.id as ViewState); 
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
                {isActive && <ChevronRight size={16} className="ml-auto opacity-70" />}
              </button>
            );
          })}
        </nav>
      </aside>
      
      {/* Overlay para móviles */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm transition-opacity" onClick={() => setOpen(false)} />
      )}
    </>
  );
};
