import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

interface FieldDef {
  key: string;
  label: string;
  format?: (val: any) => string;
}

interface SimpleCRUDProps {
  title: string;
  collectionName: string;
  fields: FieldDef[];
  data: any[];
  FormContent: React.ReactNode;
  onSave: (collectionName: string, data: any) => void;
  onDelete: (collectionName: string, id: string) => void;
}

export const SimpleCRUDView: React.FC<SimpleCRUDProps> = ({ 
  title, 
  collectionName, 
  fields, 
  data, 
  FormContent,
  onSave,
  onDelete
}) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const formData = Object.fromEntries(fd.entries());
    
    // Convertir automáticamente a número los campos conocidos que lo requieran
    Object.keys(formData).forEach(k => {
      if (['amount', 'liters', 'pricePerLiter', 'total', 'currentKm'].includes(k)) {
         formData[k] = Number(formData[k]);
      }
    });

    onSave(collectionName, { ...editingItem, ...formData });
    setModalOpen(false);
    setEditingItem(null);
  };

  // Quitar la 's' final para el botón "Nuevo..." (ej: Clientes -> Cliente)
  const singularTitle = title.endsWith('s') ? title.slice(0, -1) : title;

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
        <Button icon={Plus} onClick={() => { setEditingItem({}); setModalOpen(true); }}>
          Nuevo {singularTitle}
        </Button>
      </div>

      {/* Tabla dinámica */}
      <Card className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
           <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
              <tr>
                {fields.map((f) => (
                  <th key={f.key} className="px-4 py-3">{f.label}</th>
                ))}
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
           </thead>
           <tbody>
             {data.map((item) => (
               <tr key={item.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                 {fields.map((f) => (
                   <td key={f.key} className="px-4 py-3 text-slate-900 dark:text-slate-100">
                     {/* Si el campo tiene un formateador (ej. moneda), lo usa; si no, imprime el valor normal */}
                     {f.format ? f.format(item[f.key]) : item[f.key]}
                   </td>
                 ))}
                 <td className="px-4 py-3 text-right">
                    <Button 
                      variant="ghost" 
                      icon={Edit2} 
                      onClick={() => { setEditingItem(item); setModalOpen(true); }} 
                      className="p-1 mr-1" 
                    />
                    <Button 
                      variant="ghost" 
                      icon={Trash2} 
                      onClick={() => onDelete(collectionName, item.id)} 
                      className="p-1 text-red-500" 
                    />
                 </td>
               </tr>
             ))}
             {data.length === 0 && (
               <tr>
                 <td colSpan={fields.length + 1} className="text-center py-6 text-slate-500">
                   No hay registros para mostrar
                 </td>
               </tr>
             )}
           </tbody>
        </table>
      </Card>

      {/* Modal dinámico */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        title={editingItem?.id ? `Editar ${singularTitle}` : `Nuevo ${singularTitle}`}
      >
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* FormContent es inyectado desde el componente padre (App.tsx) */}
            {FormContent}
          </div>
          
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
