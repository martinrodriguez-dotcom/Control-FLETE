import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Truck, Database, Droplets, AlertTriangle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { TransportUnit } from '../types';

interface UnitsProps {
  units: TransportUnit[];
  onSave: (collectionName: string, data: any) => void;
  onDelete: (collectionName: string, id: string) => void;
}

export const UnitsView: React.FC<UnitsProps> = ({ units, onSave, onDelete }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TransportUnit | null>(null);
  
  // Estado para controlar qué formulario mostrar (Camión vs Tanque)
  const [unitType, setUnitType] = useState<'camion' | 'semirremolque' | 'tanque'>('camion');

  const handleOpenNew = () => {
    setEditingItem(null);
    setUnitType('camion');
    setModalOpen(true);
  };

  const handleOpenEdit = (unit: TransportUnit) => {
    setEditingItem(unit);
    setUnitType(unit.type || 'camion');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    
    // Datos base que comparten todos
    const payload: any = {
      ...editingItem,
      name: fd.get('name'),
      plate: fd.get('plate'),
      status: fd.get('status'),
      type: unitType,
      notes: fd.get('notes')
    };

    // Datos específicos según el tipo
    if (unitType === 'tanque') {
      payload.fuelCapacity = Number(fd.get('fuelCapacity'));
      payload.fuelAlertPercentage = Number(fd.get('fuelAlertPercentage'));
      
      // Actualizamos el combustible solo si el usuario escribió algo
      const updatedFuel = fd.get('currentFuel');
      if (updatedFuel !== null && updatedFuel !== '') {
        payload.currentFuel = Number(updatedFuel);
      }
    } else {
      payload.brand = fd.get('brand');
      payload.model = fd.get('model');
      payload.year = Number(fd.get('year'));
      payload.insuranceCompany = fd.get('insuranceCompany');
      payload.insuranceExpiry = fd.get('insuranceExpiry');
    }

    onSave('units', payload);
    setModalOpen(false);
    setEditingItem(null);
  };

  // Separar los tanques de los vehículos normales para mostrarlos mejor
  const vehicles = units.filter(u => u.type !== 'tanque');
  const tanks = units.filter(u => u.type === 'tanque');

  const formatNumber = (val: number) => new Intl.NumberFormat('es-AR').format(val || 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="text-blue-600" /> Flota y Tanques
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Gestión de camiones, semirremolques y tanques internos de combustible</p>
        </div>
        <Button onClick={handleOpenNew} icon={Plus}>
          Nueva Unidad / Tanque
        </Button>
      </div>

      {/* SECCIÓN DE TANQUES DE COMBUSTIBLE */}
      {tanks.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
            <Database className="text-orange-500" size={20} /> Tanques Propios
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tanks.map(tank => {
              const capacity = tank.fuelCapacity || 1;
              const current = tank.currentFuel || 0;
              const pct = Math.min(100, Math.max(0, (current / capacity) * 100));
              const alertPct = tank.fuelAlertPercentage || 15;
              const isLow = pct <= alertPct;

              return (
                <Card key={tank.id} className="p-5 flex flex-col hover:shadow-md transition-shadow border-l-4 border-orange-500">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-orange-100 text-orange-600 dark:bg-orange-900/30 rounded-lg">
                        <Database size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{tank.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${tank.status === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {tank.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" onClick={() => handleOpenEdit(tank)} className="p-2 text-blue-600"><Edit2 size={16} /></Button>
                      <Button variant="ghost" onClick={() => onDelete('units', tank.id)} className="p-2 text-red-600"><Trash2 size={16} /></Button>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Droplets size={14} className="text-blue-500"/> Nivel de Gasoil
                      </span>
                      <span className={`text-sm font-bold ${isLow ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                        {formatNumber(current)} / {formatNumber(capacity)} Lts
                      </span>
                    </div>
                    
                    {/* BARRA DE PROGRESO DEL TANQUE */}
                    <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2 relative border border-slate-200 dark:border-slate-700">
                      <div 
                        className={`h-full transition-all duration-500 ${isLow ? 'bg-red-500' : 'bg-blue-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                      {/* Marca visual de alerta */}
                      <div className="absolute top-0 bottom-0 w-0.5 bg-red-500/50" style={{ left: `${alertPct}%` }} title={`Alerta al ${alertPct}%`} />
                    </div>

                    {isLow && (
                      <p className="text-xs text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                        <AlertTriangle size={12} /> Nivel crítico (Debajo del {alertPct}%)
                      </p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* SECCIÓN DE VEHÍCULOS */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
          <Truck className="text-blue-500" size={20} /> Vehículos y Semirremolques
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((unit) => (
            <Card key={unit.id} className="p-5 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{unit.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${unit.status === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {unit.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 inline-block px-2 py-0.5 rounded mt-1">
                    {unit.plate}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" onClick={() => handleOpenEdit(unit)} className="p-2 text-blue-600 hover:bg-blue-50">
                    <Edit2 size={16} />
                  </Button>
                  <Button variant="ghost" onClick={() => onDelete('units', unit.id)} className="p-2 text-red-600 hover:bg-red-50">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-y-2 text-sm mt-auto border-t border-slate-100 dark:border-slate-700 pt-4">
                <div className="text-slate-500">Tipo:</div>
                <div className="font-medium text-right capitalize dark:text-slate-300">{unit.type}</div>
                
                <div className="text-slate-500">Marca/Modelo:</div>
                <div className="font-medium text-right dark:text-slate-300">{unit.brand} {unit.model} ({unit.year})</div>
                
                <div className="text-slate-500">Seguro:</div>
                <div className="font-medium text-right dark:text-slate-300">{unit.insuranceCompany}</div>
                
                <div className="text-slate-500">Vto. Seguro:</div>
                <div className="font-medium text-right dark:text-slate-300">
                  {new Date(unit.insuranceExpiry).toLocaleDateString('es-AR', { timeZone: 'UTC' })}
                </div>
              </div>
            </Card>
          ))}
          {vehicles.length === 0 && (
            <div className="col-span-full text-center py-8 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              No hay vehículos registrados.
            </div>
          )}
        </div>
      </div>

      {/* MODAL CREAR / EDITAR */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setModalOpen(false); setEditingItem(null); }} 
        title={editingItem ? 'Editar Registro' : 'Nuevo Registro'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 mb-4">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">¿Qué deseas registrar?</label>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => setUnitType('camion')} className={`py-2 px-1 text-xs font-bold rounded border transition-colors ${unitType === 'camion' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white border-slate-300 text-slate-600'}`}>Camión / Chasis</button>
              <button type="button" onClick={() => setUnitType('semirremolque')} className={`py-2 px-1 text-xs font-bold rounded border transition-colors ${unitType === 'semirremolque' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white border-slate-300 text-slate-600'}`}>Semirremolque</button>
              <button type="button" onClick={() => setUnitType('tanque')} className={`py-2 px-1 text-xs font-bold rounded border transition-colors ${unitType === 'tanque' ? 'bg-orange-100 border-orange-500 text-orange-700' : 'bg-white border-slate-300 text-slate-600'}`}>Tanque Combustible</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nombre de Identificación" name="name" defaultValue={editingItem?.name} placeholder={unitType === 'tanque' ? "Ej: Tanque Central" : "Ej: Scania 1"} required />
            <Input label={unitType === 'tanque' ? "Ubicación / Código" : "Dominio (Patente)"} name="plate" defaultValue={editingItem?.plate} placeholder={unitType === 'tanque' ? "Ej: Base Norte" : "AB 123 CD"} required />
          </div>

          {/* CAMPOS EXCLUSIVOS PARA TANQUE */}
          {unitType === 'tanque' ? (
            <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-lg border border-orange-200 dark:border-orange-800/30 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Capacidad Total (Litros)" name="fuelCapacity" type="number" defaultValue={editingItem?.fuelCapacity || ''} placeholder="Ej: 1000" required />
                <Input label="Alerta de Stock Crítico (%)" name="fuelAlertPercentage" type="number" defaultValue={editingItem?.fuelAlertPercentage || 15} placeholder="Ej: 15" required />
              </div>
              <Input 
                label={editingItem ? "Ajuste Manual de Litros Actuales (Dejar en blanco para no modificar)" : "Litros Actuales (Stock Inicial)"} 
                name="currentFuel" 
                type="number" 
                defaultValue={!editingItem ? '' : ''} 
                placeholder={editingItem ? `${editingItem.currentFuel || 0} Lts actuales` : "Ej: 500"} 
                required={!editingItem} 
              />
            </div>
          ) : (
            /* CAMPOS EXCLUSIVOS PARA VEHÍCULOS */
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input label="Marca" name="brand" defaultValue={editingItem?.brand} required />
                <Input label="Modelo" name="model" defaultValue={editingItem?.model} required />
                <Input label="Año" name="year" type="number" defaultValue={editingItem?.year} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Compañía de Seguro" name="insuranceCompany" defaultValue={editingItem?.insuranceCompany} required />
                <Input label="Vencimiento Seguro" name="insuranceExpiry" type="date" defaultValue={editingItem?.insuranceExpiry ? new Date(editingItem.insuranceExpiry).toISOString().split('T')[0] : ''} required />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Estado</label>
            <select name="status" defaultValue={editingItem?.status || 'activo'} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo / Fuera de Servicio</option>
            </select>
          </div>
          
          <Input label="Observaciones" name="notes" type="textarea" defaultValue={editingItem?.notes} />
          
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" type="button" onClick={() => { setModalOpen(false); setEditingItem(null); }}>Cancelar</Button>
            <Button type="submit">{editingItem ? 'Guardar Cambios' : 'Registrar'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
