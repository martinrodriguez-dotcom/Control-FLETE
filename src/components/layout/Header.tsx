import React from 'react';
import { Menu, Moon, Sun, LogOut } from 'lucide-react';
import { User, signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  setSidebarOpen: (val: boolean) => void;
  user: User | null;
}

export const Header: React.FC<HeaderProps> = ({ darkMode, setDarkMode, setSidebarOpen, user }) => {
  
  // Función para cerrar sesión en Firebase
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 sm:px-6 z-30">
      {/* Botón de menú para móviles */}
      <button 
        onClick={() => setSidebarOpen(true)} 
        className="md:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors"
      >
        <Menu size={24} />
      </button>
      
      {/* Espaciador central */}
      <div className="flex-1" />
      
      {/* Acciones de la derecha */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Toggle Dark Mode */}
        <button 
          onClick={() => setDarkMode(!darkMode)} 
          className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

        {/* Avatar y Botón de Salir */}
        <div className="flex items-center gap-3">
          <div 
            className="h-8 w-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm shadow-sm border border-blue-200"
            title={user?.email || 'Usuario'}
          >
            {user?.isAnonymous ? 'A' : user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={18} className="hidden sm:block" />
            <span className="hidden sm:block">Salir</span>
            {/* En celulares solo mostramos el ícono para ahorrar espacio */}
            <LogOut size={22} className="sm:hidden" />
          </button>
        </div>
      </div>
    </header>
  );
};
