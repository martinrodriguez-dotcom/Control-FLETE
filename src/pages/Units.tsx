import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { TransportUnit } from '../types';

interface UnitsProps {
  units: TransportUnit[];
  onSave: (collectionName: string, data: any) => void;
  onDelete: (collectionName: string, id: string) => void;
}

export const UnitsView: React.FC<UnitsProps> = ({ units, onSave, onDelete }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<TransportUnit> | null>(null);

  // Formatear fecha para mostrar en la tabla
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-AR');

  // Lógica para enviar el formulario
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(fd.entries());
    
    // Asegurar que el año se guarde como número
    const payload = {
      ...editingItem,
      ...data,
      year: Number(data.year)
    };

    onSave('units', payload);
    setModalOpen(false);
    setEditingItem(null);
  };

  // Calcular color del estado del seguro
  const getStatusColor = (expiryDate: string) => {
    const days = (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    if (days < 0) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    if (days <= 30) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
  };

  return (
    <div className="space-y-4">
      {/* Cabecera de la vista */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Flota de Unidades</h2>
        <Button icon={Plus} onClick={() => { setEditingItem({}); setModalOpen(true); }}>
          Nueva Unidad
        </Button>
      </div>

      {/* Tabla de datos */}
      <Card className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
            <tr>
              <th className="px-4 py-3">Nombre/Patente</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Marca/Año</th>
              <th className="px-4 py-3">Seguro Vto.</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {units.map(u => (
              <tr key={u.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                  <div>{u.name}</div>
                  <div className="text-xs text-slate-500">{u.plate}</div>
                </td>
                <td className="px-4 py-3 capitalize">{u.type}</td>
                <td className="px-4 py-3">{u.brand} ({u.year})</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(u.insuranceExpiry)}`}>
                    {formatDate(u.insuranceExpiry)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${u.status === 'activo' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" icon={Edit2} onClick={() => { setEditingItem(u); setModalOpen(true); }} className="p-1" />
                  <Button variant="ghost" icon={Trash2} onClick={() => onDelete('units', u.id)} className="p-1 text-red-500" />
                </td>
              </tr>
            ))}
            {units.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-6 text-slate-500">
                  No hay unidades registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Modal para Crear / Editar */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        title={editingItem?.id ? "Editar Unidad" : "Nueva Unidad"}
      >
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nombre Interno" name="name" defaultValue={editingItem?.name} required />
            <Input label="Patente" name="plate" defaultValue={editingItem?.plate} required />
            <Input 
              label="Tipo" 
              name="type" 
              type="select" 
              defaultValue={editingItem?.type || 'camion'} 
              options={[
                {label: 'Camión', value: 'camion'}, 
                {label: 'Semirremolque', value: 'semirremolque'}
              ]} 
            />
            <Input label="Marca" name="brand" defaultValue={editingItem?.brand} required />
            <Input label="Modelo" name="model" defaultValue={editingItem?.model} required />
            <Input label="Año" name="year" type="number" defaultValue={editingItem?.year} required />
            <Input label="Aseguradora" name="insuranceCompany" defaultValue={editingItem?.insuranceCompany} required />
            <Input label="Vto. Seguro" name="insuranceExpiry" type="date" defaultValue={editingItem?.insuranceExpiry} required />
            <Input 
              label="Estado" 
              name="status" 
              type="select" 
              defaultValue={editingItem?.status || 'activo'} 
              options={[
                {label: 'Activo', value: 'activo'}, 
                {label: 'Inactivo', value: 'inactivo'}
              ]} 
            />
          </div>
          <div className="mt-2">
            <Input label="Observaciones" name="notes" type="textarea" defaultValue={editingItem?.notes} />
          </div>
          
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar Unidad</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
