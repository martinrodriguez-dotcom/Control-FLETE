import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

interface SimpleCRUDProps {
  title: string;
  collectionName: string;
  data: any[];
  fields: { key: string; label: string; format?: (val: any) => string }[];
  FormContent: React.ReactNode;
  onSave: (collectionName: string, data: any) => void;
  onDelete: (collectionName: string, id: string) => void;
}

export const SimpleCRUDView: React.FC<SimpleCRUDProps> = ({ 
  title, collectionName, data, fields, FormContent, onSave, onDelete 
}) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const formDataObj = Object.fromEntries(fd.entries());
    
    // Unimos los datos viejos (si existen) con los nuevos del formulario
    onSave(collectionName, { ...editingItem, ...formDataObj });
    setModalOpen(false);
  };

  // MAGIA: Función recursiva que inyecta automáticamente los valores guardados en los inputs del formulario
  const renderFormContent = (nodes: React.ReactNode): React.ReactNode => {
    return React.Children.map(nodes, (child) => {
      if (!React.isValidElement(child)) return child;

      // 1. Si es un Fragmento (<>...</>), bajar al siguiente nivel de elementos
      if (child.type === React.Fragment) {
        return renderFormContent(child.props.children);
      }

      // 2. Si el elemento tiene un atributo "name" (como nuestros Inputs), inyectarle el valor
      if (child.props.name) {
        return React.cloneElement(child as React.ReactElement, {
          defaultValue: editingItem ? editingItem[child.props.name] : ''
        });
      }

      // 3. Si es un div u otro contenedor, buscar dentro de sus hijos para inyectar
      if (child.props.children) {
        return React.cloneElement(child as React.ReactElement, {
          children: renderFormContent(child.props.children)
        });
      }

      return child;
    });
  };

  return (
    <div className="space-y-6">
      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Directorio de {title}</h2>
        <Button onClick={() => { setEditingItem(null); setModalOpen(true); }} icon={Plus}>
          Nuevo Registro
        </Button>
      </div>

      {/* TABLA DE REGISTROS */}
      <Card className="p-0 overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                {fields.map(f => (
                  <th key={f.key} className="px-6 py-4 font-semibold">{f.label}</th>
                ))}
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  {fields.map(f => (
                    <td key={f.key} className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      {f.format ? f.format(item[f.key]) : item[f.key] || '-'}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <Button variant="ghost" onClick={() => { setEditingItem(item); setModalOpen(true); }} className="text-blue-600 p-2 mr-2" title="Editar">
                      <Edit2 size={16} />
                    </Button>
                    <Button variant="ghost" onClick={() => onDelete(collectionName, item.id)} className="text-red-600 p-2" title="Eliminar">
                      <Trash2 size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={fields.length + 1} className="px-6 py-8 text-center text-slate-500">
                    No hay registros cargados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL DEL FORMULARIO */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setModalOpen(false); setEditingItem(null); }} 
        title={editingItem ? `Editar Registro` : `Nuevo Registro`}
      >
        {/* El atributo KEY fuerza al formulario a reiniciarse por completo cada vez que cambias de cliente */}
        <form key={editingItem ? editingItem.id : 'new-item'} onSubmit={handleSubmit} className="space-y-4">
          
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
            {renderFormContent(FormContent)}
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" type="button" onClick={() => { setModalOpen(false); setEditingItem(null); }}>
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
