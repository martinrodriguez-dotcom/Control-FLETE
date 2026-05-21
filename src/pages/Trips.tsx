import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Trip, Client, TransportUnit } from '../types';

interface TripsProps {
  trips: Trip[];
  clients: Client[];
  units: TransportUnit[];
  onSave: (collectionName: string, data: any) => void;
  onDelete: (collectionName: string, id: string) => void;
}

export const TripsView: React.FC<TripsProps> = ({ trips, clients, units, onSave, onDelete }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Trip> | null>(null);

  // Utilidades de formato
  const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
  
  // Corrección de zona horaria aplicada aquí para los viajes:
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-AR', { timeZone: 'UTC' });

  // Lógica para enviar el formulario
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(fd.entries());
    
    // Asegurar que los valores numéricos se guarden como números
    const payload = {
      ...editingItem,
      ...data,
      value: Number(data.value),
      km: Number(data.km)
    };

    onSave('trips', payload);
    setModalOpen(false);
    setEditingItem(null);
  };

  // Opciones para los selectores del formulario
  const clientOptions = clients.map(c => ({ label: c.company || c.name, value: c.id }));
  const unitOptions = units.map(u => ({ label: `${u.name} (${u.plate})`, value: u.id }));

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Viajes</h2>
        <Button icon={Plus} onClick={() => { setEditingItem({}); setModalOpen(true); }}>
          Registrar Viaje
        </Button>
      </div>

      {/* Tabla de Viajes */}
      <Card className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Ruta</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Unidad</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3">Cobro</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {trips.map(t => {
              // Buscar el nombre del cliente y de la unidad cruzando los IDs
              const client = clients.find(c => c.id === t.clientId);
              const unit = units.find(u => u.id === t.unitId);
              
              return (
                <tr key={t.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(t.date)}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 dark:text-white">{t.origin}</div>
                    <div className="text-xs text-slate-500">a {t.destination} ({t.km}km)</div>
                  </td>
                  <td className="px-4 py-3">{client?.company || 'N/A'}</td>
                  <td className="px-4 py-3">{unit?.name || 'N/A'}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">
                    {formatCurrency(t.value)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      t.paymentStatus === 'cobrado' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' 
                        : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                    }`}>
                      {t.paymentStatus === 'cobrado' ? 'Cobrado' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" icon={Edit2} onClick={() => { setEditingItem(t); setModalOpen(true); }} className="p-1" />
                    <Button variant="ghost" icon={Trash2} onClick={() => onDelete('trips', t.id)} className="p-1 text-red-500" />
                  </td>
                </tr>
              );
            })}
            {trips.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-6 text-slate-500">
                  No hay viajes registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Modal del Formulario */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        title={editingItem?.id ? "Editar Viaje" : "Registrar Viaje"}
      >
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Fecha" name="date" type="date" defaultValue={editingItem?.date} required />
            <Input label="Cliente" name="clientId" type="select" options={clientOptions} defaultValue={editingItem?.clientId} required />
            <Input label="Unidad" name="unitId" type="select" options={unitOptions} defaultValue={editingItem?.unitId} required />
            <Input label="Origen" name="origin" defaultValue={editingItem?.origin} required />
            <Input label="Destino" name="destination" defaultValue={editingItem?.destination} required />
            <Input label="Kilómetros" name="km" type="number" defaultValue={editingItem?.km} required />
            <Input label="Valor Cobrado ($)" name="value" type="number" defaultValue={editingItem?.value} required />
            <Input 
              label="Estado de Cobro" 
              name="paymentStatus" 
              type="select" 
              defaultValue={editingItem?.paymentStatus || 'pendiente'} 
              options={[{label: 'Pendiente', value: 'pendiente'}, {label: 'Cobrado', value: 'cobrado'}]} 
            />
            <div className="sm:col-span-2">
              <Input label="Método de Pago" name="paymentMethod" defaultValue={editingItem?.paymentMethod} />
            </div>
            <div className="sm:col-span-2">
              <Input label="Observaciones" name="notes" type="textarea" defaultValue={editingItem?.notes} />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar Viaje</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
