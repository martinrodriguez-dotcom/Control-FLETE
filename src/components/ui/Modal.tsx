import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        {/* Fondo oscuro overlay */}
        <div 
          className="fixed inset-0 bg-slate-900/75 transition-opacity" 
          onClick={onClose} 
        />
        
        {/* Contenedor del Modal */}
        <div className="relative transform overflow-hidden rounded-xl bg-white dark:bg-slate-800 text-left shadow-xl transition-all sm:my-8 w-full max-w-2xl">
          
          {/* Header del Modal */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {title}
            </h3>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Cuerpo del Modal con scroll */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {children}
          </div>
          
        </div>
      </div>
    </div>
  );
};
