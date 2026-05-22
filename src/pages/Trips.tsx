import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Copy, Map, DollarSign, Clock, Truck, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
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
  
  // Estado para controlar qué unidades están expandidas (desplegadas)
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});

  // Utilidades de formato
  const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-AR', { timeZone: 'UTC' });

  // Alternar el despliegue de una unidad
  const toggleUnit = (unitId: string) => {
    setExpandedUnits(prev => ({
      ...prev,
      [unitId]: !prev[unitId]
    }));
  };

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

  // Agrupar viajes por unidad, ordenándolos estrictamente por fecha (más reciente primero)
  const tripsByUnit = units.map(unit => {
    const unitTrips = trips
      .filter(t => t.unitId === unit.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // ORDENADO POR FECHA

    const unitRevenue = unitTrips.reduce((acc, t) => acc + Number(t.value), 0);
    return { unit, trips: unitTrips, unitRevenue };
  }).filter(group => group.trips.length > 0);

  // Viajes huérfanos (si se borró una unidad) ordenados por fecha
  const orphanTrips = trips
    .filter(t => !units.find(u => u.id === t.unitId))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
        <Card className="flex items-center gap-4 p-4 shadow-sm">
          <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
            <Map size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Viajes Históricos</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{trips.length}</p>
          </div>
        </Card>
        
        <Card className="flex items-center gap-4 p-4 border-l-4 border-emerald-500 shadow-sm">
          <div className="p-3 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Facturación Total</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalRevenue)}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4 border-l-4 border-orange-500 shadow-sm">
          <div className="p-3 bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded-lg">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pendiente de Cobro</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(pendingRevenue)}</p>
          </div>
        </Card>
      </div>

      {/* LISTADO DE VIAJES AGRUPADOS CON DESPLEGABLES */}
      <div className="space-y-3">
        {tripsByUnit.length === 0 && orphanTrips.length === 0 ? (
          <Card className="text-center py-12 shadow-sm">
            <Map size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Aún no hay viajes registrados</h3>
            <p className="text-slate-500 mt-1">Comienza registrando un viaje para ver la información aquí.</p>
          </Card>
        ) : (
          tripsByUnit.map(group => {
            const isOpen = !!expandedUnits[group.unit.id];
            return (
              <div 
                key={group.unit.id} 
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/70 shadow-sm overflow-hidden transition-all duration-200"
              >
                {/* CABECERA SELECCIONABLE (ACORDEÓN) */}
                <button
                  onClick={() => toggleUnit(group.unit.id)}
                  className="w-full p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors text-left outline-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 rounded-lg">
                      <Truck size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                        {group.unit.name}
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({group.unit.plate})</span>
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar size={12} /> {group.trips.length} viajes registrados
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 ml-auto sm:ml-0">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Facturado</p>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(group.unitRevenue)}</p>
                    </div>
                    <div className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors p-1 bg-slate-100 dark:bg-slate-700 rounded-md">
                      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </button>

                {/* CONTENIDO DESPLEGABLE (TABLA DE VIAJES) */}
                {isOpen && (
                  <div className="border-t border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-500 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700">
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
                              <tr key={t.id} className="border-b last:border-0 border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">{formatDate(t.date)}</td>
                                <td className="px-4 py-3">
                                  <span className="font-semibold text-slate-900 dark:text-white">{t.origin}</span>
                                  <span className="mx-2 text-slate-400">→</span>
                                  <span className="font-semibold text-slate-900 dark:text-white">{t.destination}</span>
                                  {t.notes && <div className="text-xs text-slate-400 mt-0.5 font-normal italic">Obs: {t.notes}</div>}
                                </td>
                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{client?.company || client?.name || 'N/A'}</td>
                                <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                                  {formatCurrency(t.value)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                    t.paymentStatus === 'cobrado' 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30' 
                                      : 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/30'
                                  }`}>
                                    {t.paymentStatus === 'cobrado' ? 'Cobrado' : 'Pendiente'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                  <Button variant="ghost" icon={Copy} onClick={() => handleDuplicate(t)} className="p-1.5 text-blue-500 mr-1" title="Duplicar" />
                                  <Button variant="ghost" icon={Edit2} onClick={() => { setEditingItem(t); setModalOpen(true); }} className="p-1.5 mr-1" title="Editar" />
                                  <Button variant="ghost" icon={Trash2} onClick={() => onDelete('trips', t.id)} className="p-1.5 text-red-500" title="Eliminar" />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* VIAJES HUÉRFANOS (Unidad eliminada) */}
        {orphanTrips.length > 0 && (
          <Card className="overflow-hidden p-0 border-t-4 border-t-slate-400 shadow-sm opacity-80">
            <div className="bg-slate-100 dark:bg-slate-800/80 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <Truck className="text-slate-500" />
              <h3 className="font-bold text-base text-slate-700 dark:text-slate-300">Viajes de unidades desasignadas u eliminadas</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <tbody>
                  {orphanTrips.map(t => (
                    <tr key={t.id} className="border-b last:border-0 dark:border-slate-700">
                      <td className="px-4 py-3 font-medium">{formatDate(t.date)}</td>
                      <td className="px-4 py-3 font-semibold">{t.origin} → {t.destination}</td>
                      <td className="px-4 py-3 text-right font-bold">{formatCurrency(t.value)}</td>
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
