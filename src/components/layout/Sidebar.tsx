import React from 'react';
import { LayoutDashboard, Truck, Users, Map, Receipt, Fuel, PieChart, ChevronRight } from 'lucide-react';
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
    { id: 'expenses', label: 'Gastos', icon: Receipt },
    { id: 'fuel', label: 'Combustible', icon: Fuel },
    { id: 'reports', label: 'Reportes', icon: PieChart },
  ];

  return (
    <>
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-200 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
          <Truck className="text-blue-600 mr-2" size={24} />
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Logis<span className="text-blue-600">Flow</span>
          </span>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { 
                  setView(item.id as ViewState); 
                  setOpen(false); // Cierra el sidebar en móviles al seleccionar
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon size={20} />
                {item.label}
                {isActive && <ChevronRight size={16} className="ml-auto" />}
              </button>
            );
          })}
        </nav>
      </aside>
      
      {/* Overlay para móviles */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden" 
          onClick={() => setOpen(false)} 
        />
      )}
    </>
  );
};
