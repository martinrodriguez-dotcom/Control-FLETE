import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Copy, Map, DollarSign, Clock, Truck, AlertCircle } from 'lucide-react';
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
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-AR', { timeZone: 'UTC' });

  // Lógica para enviar el formulario
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(fd.entries());
    
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

  // Lógica para duplicar un viaje
  const handleDuplicate = (trip: Trip) => {
    const { id, createdAt, ...tripData } = trip; 
    setEditingItem(tripData);
    setModalOpen(true);
  };

  // Opciones para los selectores
  const clientOptions = clients.map(c => ({ label: c.company || c.name, value: c.id }));
  const unitOptions = units.map(u => ({ label: `${u.name} (${u.plate})`, value: u.id }));

  // --- CÁLCULOS GLOBALES PARA EL RESUMEN ---
  const totalRevenue = trips.reduce((acc, t) => acc + Number(t.value), 0);
  const pendingRevenue = trips.filter(t => t.paymentStatus === 'pendiente').reduce((acc, t) => acc + Number(t.value), 0);

  // Agrupar viajes por unidad (y manejar viajes huérfanos si se borró la unidad)
  const tripsByUnit = units.map(unit => {
    const unitTrips = trips.filter(t => t.unitId === unit.id);
    const unitRevenue = unitTrips.reduce((acc, t) => acc + Number(t.value), 0);
    return { unit, trips: unitTrips, unitRevenue };
  }).filter(group => group.trips.length > 0); // Mostrar solo unidades que tengan viajes

  const orphanTrips = trips.filter(t => !units.find(u => u.id === t.unitId));

  return (
    <div className="space-y-6">
      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Viajes</h2>
          <p className="text-slate-500 dark:text-slate-400">Control operativo y facturación por unidad</p>
        </div>
        <Button icon={Plus} onClick={() => { setEditingItem({}); setModalOpen(true); }}>
          Registrar Viaje
        </Button>
      </div>

      {/* TARJETAS DE RESUMEN GLOBAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
            <Map size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Viajes Históricos</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{trips.length}</p>
          </div>
        </Card>
        
        <Card className="flex items-center gap-4 p-4 border-l-4 border-emerald-500">
          <div className="p-3 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Facturación Total</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalRevenue)}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4 border-l-4 border-orange-500">
          <div className="p-3 bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded-lg">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pendiente de Cobro</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(pendingRevenue)}</p>
          </div>
        </Card>
      </div>

      {/* LISTADO DE VIAJES AGRUPADOS POR UNIDAD */}
      <div className="space-y-6">
        {tripsByUnit.length === 0 && orphanTrips.length === 0 ? (
          <Card className="text-center py-12">
            <Map size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Aún no hay viajes registrados</h3>
            <p className="text-slate-500 mt-1">Comienza registrando un viaje para ver la información aquí.</p>
          </Card>
        ) : (
          tripsByUnit.map(group => (
            <Card key={group.unit.id} className="overflow-hidden p-0 border-t-4 border-t-blue-500 shadow-sm">
              {/* Cabecera de la Unidad */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 rounded-lg shadow-sm">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-none mb-1">
                      {group.unit.name}
                    </h3>
                    <p className="text-sm text-slate-500">Patente: {group.unit.plate}</p>
                  </div>
                </div>
                <div className="flex gap-4 text-right">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Viajes</p>
                    <p className="font-medium text-slate-900 dark:text-white">{group.trips.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Generado</p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(group.unitRevenue)}</p>
                  </div>
                </div>
              </div>

              {/* Tabla de Viajes de la Unidad */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                  <thead className="text-xs text-slate-500 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 font-medium">Fecha</th>
                      <th className="px-4 py-3 font-medium">Ruta (Origen - Destino)</th>
                      <th className="px-4 py-3 font-medium">Cliente</th>
                      <th className="px-4 py-3 font-medium text-right">Valor</th>
                      <th className="px-4 py-3 font-medium text-center">Estado</th>
                      <th className="px-4 py-3 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.trips.map(t => {
                      const client = clients.find(c => c.id === t.clientId);
                      return (
                        <tr key={t.id} className="border-b last:border-0 border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-slate-700 dark:text-slate-300">{formatDate(t.date)}</td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-slate-900 dark:text-white">{t.origin}</span>
                            <span className="mx-2 text-slate-400">→</span>
                            <span className="font-medium text-slate-900 dark:text-white">{t.destination}</span>
                            <div className="text-xs text-slate-400 mt-0.5">Recorrido: {t.km}km</div>
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{client?.company || client?.name || 'N/A'}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">
                            {formatCurrency(t.value)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${
                              t.paymentStatus === 'cobrado' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30' 
                                : 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/30'
                            }`}>
                              {t.paymentStatus === 'cobrado' ? 'Cobrado' : 'Pendiente'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <Button variant="ghost" icon={Copy} onClick={() => handleDuplicate(t)} className="p-1.5 text-blue-500 mr-1" title="Duplicar viaje" />
                            <Button variant="ghost" icon={Edit2} onClick={() => { setEditingItem(t); setModalOpen(true); }} className="p-1.5 mr-1" title="Editar viaje" />
                            <Button variant="ghost" icon={Trash2} onClick={() => onDelete('trips', t.id)} className="p-1.5 text-red-500" title="Eliminar viaje" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ))
        )}

        {/* VIAJES HUÉRFANOS (Unidad eliminada) */}
        {orphanTrips.length > 0 && (
          <Card className="overflow-hidden p-0 border-t-4 border-t-slate-500 shadow-sm opacity-80">
            <div className="bg-slate-100 dark:bg-slate-800/80 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <AlertCircle className="text-slate-500" />
              <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300">Viajes sin unidad asignada (Unidad eliminada)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                <tbody>
                  {orphanTrips.map(t => (
                    <tr key={t.id} className="border-b last:border-0 dark:border-slate-700">
                      <td className="px-4 py-3">{formatDate(t.date)}</td>
                      <td className="px-4 py-3">{t.origin} → {t.destination}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(t.value)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" icon={Edit2} onClick={() => { setEditingItem(t); setModalOpen(true); }} className="p-1" />
                        <Button variant="ghost" icon={Trash2} onClick={() => onDelete('trips', t.id)} className="p-1 text-red-500" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* MODAL DEL FORMULARIO */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        title={editingItem?.id ? "Editar Viaje" : "Registrar Nuevo Viaje"}
      >
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Fecha" name="date" type="date" defaultValue={editingItem?.date} required />
            <Input label="Unidad Asignada" name="unitId" type="select" options={unitOptions} defaultValue={editingItem?.unitId} required />
            <Input label="Cliente" name="clientId" type="select" options={clientOptions} defaultValue={editingItem?.clientId} required />
            <Input label="Estado de Cobro" name="paymentStatus" type="select" defaultValue={editingItem?.paymentStatus || 'pendiente'} options={[{label: 'Pendiente', value: 'pendiente'}, {label: 'Cobrado', value: 'cobrado'}]} required />
            
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <Input label="Origen" name="origin" defaultValue={editingItem?.origin} required />
              <Input label="Destino" name="destination" defaultValue={editingItem?.destination} required />
              <Input label="Distancia (km)" name="km" type="number" defaultValue={editingItem?.km} required />
              <Input label="Valor Cobrado ($)" name="value" type="number" defaultValue={editingItem?.value} required />
            </div>

            <div className="sm:col-span-2">
              <Input label="Método de Pago" name="paymentMethod" defaultValue={editingItem?.paymentMethod} />
            </div>
            <div className="sm:col-span-2">
              <Input label="Observaciones / Nro. de Remito" name="notes" type="textarea" defaultValue={editingItem?.notes} />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar Viaje</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
