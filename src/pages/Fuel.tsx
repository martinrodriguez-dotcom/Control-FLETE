import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Droplets, AlertCircle, Database } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { FuelLoad, TransportUnit } from '../types';

interface FuelProps {
  fuel: FuelLoad[];
  units: TransportUnit[];
  onSave: (collectionName: string, data: any) => void;
  onDelete: (collectionName: string, id: string) => void;
}

export const FuelView: React.FC<FuelProps> = ({ fuel, units, onSave, onDelete }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FuelLoad | null>(null);

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val || 0);
  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString('es-AR', { timeZone: 'UTC' }); } catch { return dateStr; }
  };

  const getUnitName = (id: string) => units.find(u => u.id === id)?.name || 'Desconocida';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    
    const liters = Number(fd.get('liters'));
    const pricePerLiter = Number(fd.get('pricePerLiter'));
    const total = liters * pricePerLiter;
    
    onSave('fuel', {
      ...editingItem,
      date: fd.get('date'),
      unitId: fd.get('unitId'),
      liters,
      pricePerLiter,
      total,
      station: fd.get('station'),
      currentKm: Number(fd.get('currentKm')),
      sourceTankId: fd.get('sourceTankId') || null
    });
    
    setModalOpen(false);
    setEditingItem(null);
  };

  // Botón rápido para cargar costos de despachos rápidos de Mantenimiento
  const handleLoadCost = (item: FuelLoad) => {
    const priceStr = window.prompt(`Ingresa el PRECIO POR LITRO abonado por los ${item.liters} Lts:`);
    if (priceStr) {
      const price = Number(priceStr);
      if (!isNaN(price) && price > 0) {
        onSave('fuel', { ...item, pricePerLiter: price, total: price * item.liters });
      } else {
        alert('Precio inválido.');
      }
    }
  };

  const tanks = units.filter(u => u.type === 'tanque');
  const vehicles = units.filter(u => u.type !== 'tanque');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Droplets className="text-blue-600" /> Registro de Combustible
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Control de cargas externas y consumo de tanques propios</p>
        </div>
        <Button onClick={() => { setEditingItem(null); setModalOpen(true); }} icon={Plus}>
          Nueva Carga
        </Button>
      </div>

      <Card className="p-0 overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold">Fecha</th>
                <th className="px-6 py-4 font-semibold">Unidad</th>
                <th className="px-6 py-4 font-semibold">Origen / Estación</th>
                <th className="px-6 py-4 font-semibold text-right">Litros</th>
                <th className="px-6 py-4 font-semibold text-right">Costo Total</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {fuel.map((item) => {
                const isFromTank = !!item.sourceTankId;
                const isPendingCost = !isFromTank && item.total === 0;

                return (
                  <tr key={item.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">{formatDate(item.date)}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      {getUnitName(item.unitId)}
                      <span className="block text-xs text-slate-400 font-normal mt-0.5">{item.currentKm ? `${item.currentKm} km` : ''}</span>
                    </td>
                    <td className="px-6 py-4">
                      {isFromTank ? (
                        <span className="flex items-center gap-1.5 text-orange-600 font-semibold text-xs bg-orange-50 px-2 py-1 rounded-md w-fit">
                          <Database size={14} /> {getUnitName(item.sourceTankId!)}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-blue-600 font-semibold text-xs bg-blue-50 px-2 py-1 rounded-md w-fit">
                          <Droplets size={14} /> {item.station || 'Estación Externa'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">{item.liters} L</td>
                    <td className="px-6 py-4 text-right">
                      {isFromTank ? (
                        <span className="text-slate-400 text-xs italic">Abonado en tanque</span>
                      ) : isPendingCost ? (
                        <span className="flex items-center justify-end gap-1 text-red-600 font-bold text-xs">
                          <AlertCircle size={14} /> PENDIENTE
                        </span>
                      ) : (
                        <div className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(item.total)}
                          <span className="block text-[10px] text-slate-400 font-normal">{formatCurrency(item.pricePerLiter)} / L</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {isPendingCost ? (
                        <Button onClick={() => handleLoadCost(item)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-xs rounded-lg shadow-sm">
                          Cargar Precio
                        </Button>
                      ) : (
                        <Button variant="ghost" onClick={() => { setEditingItem(item); setModalOpen(true); }} className="text-blue-600 p-2">
                          <Edit2 size={16} />
                        </Button>
                      )}
                      <Button variant="ghost" onClick={() => onDelete('fuel', item.id)} className="text-red-600 p-2">
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {fuel.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No hay registros de combustible.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setModalOpen(false); setEditingItem(null); }} 
        title={editingItem ? 'Editar Carga' : 'Registrar Combustible'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Fecha" name="date" type="date" defaultValue={editingItem?.date || new Date().toISOString().split('T')[0]} required />
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Unidad que recibe</label>
            <select name="unitId" defaultValue={editingItem?.unitId || ''} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white" required>
              <option value="">Seleccione una unidad...</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.plate})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Origen del Combustible</label>
            <select name="sourceTankId" defaultValue={editingItem?.sourceTankId || ''} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
              <option value="">Estación de Servicio Externa (YPF, Axion, etc)</option>
              {tanks.length > 0 && <optgroup label="Surtidores Internos Propios">
                {tanks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </optgroup>}
            </select>
          </div>

          <Input label="Estación (Si es externa)" name="station" type="text" defaultValue={editingItem?.station || ''} placeholder="Ej: YPF Ruta 9" />
          
          <div className="grid grid-cols-2 gap-4">
            <Input label="Litros Cargados" name="liters" type="number" defaultValue={editingItem?.liters || ''} required />
            <Input label="Precio por Litro ($)" name="pricePerLiter" type="number" defaultValue={editingItem?.pricePerLiter || ''} required />
          </div>

          <Input label="KM / Horas de la Unidad" name="currentKm" type="number" defaultValue={editingItem?.currentKm || ''} required />

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" type="button" onClick={() => { setModalOpen(false); setEditingItem(null); }}>Cancelar</Button>
            <Button type="submit">Guardar Registro</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
