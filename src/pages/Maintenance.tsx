import React, { useState } from 'react';
import { Settings, Droplets, History, Activity, Calendar, User as UserIcon, CheckSquare, Square, Truck, ChevronRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { TransportUnit, ServiceRecord, FuelLoad } from '../types';

interface MaintenanceProps {
  units?: TransportUnit[];
  services?: ServiceRecord[];
  fuel?: FuelLoad[];
  currentUserEmail?: string;
  onSave: (collectionName: string, data: any) => void;
}

const COMMON_PARTS = [
  'Aceite de Motor',
  'Filtro de Aceite',
  'Filtro de Aire',
  'Filtro de Combustible',
  'Filtro de Habitáculo',
  'Líquido Refrigerante',
  'Engrase General',
  'Revisión de Frenos',
  'Rotación de Neumáticos'
];

export const MaintenanceView: React.FC<MaintenanceProps> = ({ 
  units = [], 
  services = [], 
  fuel = [], 
  currentUserEmail = 'usuario@desconocido.com', 
  onSave 
}) => {
  const [selectedUnit, setSelectedUnit] = useState<TransportUnit | null>(null);
  const [activeTab, setActiveTab] = useState<'km' | 'fuel' | 'service' | 'history'>('km');
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());

  const safeFormatNumber = (val: any) => {
    if (val === null || val === undefined || isNaN(Number(val))) return '';
    return Number(val).toLocaleString('es-AR');
  };

  const formatDate = (dateStr: any) => {
    if (!dateStr) return '';
    try { return new Date(dateStr).toLocaleDateString('es-AR', { timeZone: 'UTC' }); } 
    catch (e) { return dateStr; }
  };

  const formatDateTime = (ts: any) => {
    if (!ts) return '';
    try { return new Date(ts).toLocaleString('es-AR'); } 
    catch (e) { return ''; }
  };

  const handleOpenUnit = (unit: TransportUnit) => {
    setSelectedUnit(unit);
    setActiveTab('km');
    setSelectedParts(new Set());
  };

  const togglePart = (part: string) => {
    setSelectedParts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(part)) newSet.delete(part);
      else newSet.add(part);
      return newSet;
    });
  };

  const handleSaveKm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;
    const fd = new FormData(e.target as HTMLFormElement);
    
    onSave('services', {
      unitId: selectedUnit.id,
      type: 'km_update',
      date: fd.get('date'),
      currentKmOrHours: Number(fd.get('currentKmOrHours')),
      notes: fd.get('notes'),
      userEmail: currentUserEmail
    });

    onSave('units', {
      ...selectedUnit,
      currentKm: Number(fd.get('currentKmOrHours'))
    });

    setSelectedUnit(null);
  };

  const handleSaveFuel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;
    const fd = new FormData(e.target as HTMLFormElement);
    
    onSave('fuel', {
      unitId: selectedUnit.id,
      date: fd.get('date'),
      liters: Number(fd.get('liters')),
      pricePerLiter: 0, 
      total: 0,
      station: fd.get('station') || 'Carga Rápida (Satelital)',
      currentKm: Number(fd.get('currentKm')),
      userEmail: currentUserEmail
    });

    if (fd.get('currentKm')) {
      onSave('units', { ...selectedUnit, currentKm: Number(fd.get('currentKm')) });
    }

    setSelectedUnit(null);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;
    const fd = new FormData(e.target as HTMLFormElement);
    
    const serviceNotes = fd.get('notes') as string;
    const serviceDate = fd.get('date') as string;
    const currentKm = Number(fd.get('currentKmOrHours'));
    
    // 1. Guardar la ficha técnica
    onSave('services', {
      unitId: selectedUnit.id,
      type: 'service',
      date: serviceDate,
      currentKmOrHours: currentKm,
      serviceInterval: Number(fd.get('serviceInterval')),
      partsReplaced: Array.from(selectedParts),
      notes: serviceNotes,
      userEmail: currentUserEmail
    });

    // 2. Actualizar los KM de la unidad
    onSave('units', { ...selectedUnit, currentKm: currentKm });

    // 3. ENVÍO A GASTOS COMO "PENDIENTE" (Monto 0)
    onSave('expenses', {
      date: serviceDate,
      unitId: selectedUnit.id,
      category: 'mantenimiento',
      description: `Service a los ${currentKm} km/hs. ${serviceNotes ? `(${serviceNotes})` : ''}`,
      amount: 0, // Se envía en 0 para que la administración lo cargue después
      userEmail: currentUserEmail
    });

    setSelectedUnit(null);
  };

  const getUnitHistory = (unitId: string) => {
    const safeServices = Array.isArray(services) ? services : [];
    const safeFuel = Array.isArray(fuel) ? fuel : [];

    const unitServices = safeServices.filter(s => s.unitId === unitId).map(s => ({ ...s, collection: 'services' }));
    const unitFuel = safeFuel.filter(f => f.unitId === unitId).map(f => ({ ...f, collection: 'fuel', type: 'fuel_load' }));
    
    return [...unitServices, ...unitFuel].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Mantenimiento y Flota</h2>
        <p className="text-slate-500 dark:text-slate-400">Control de services, actualización de horas/km e historial de auditoría</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {units.map(unit => (
          <div key={unit.id} onClick={() => handleOpenUnit(unit)} className="cursor-pointer group">
            <Card className="p-5 hover:shadow-md transition-shadow border-l-4 border-blue-500 h-full">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                    <Truck size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{unit.name}</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{unit.plate}</p>
                  </div>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" />
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center text-sm">
                <span className="text-slate-500">Último registro:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {unit.currentKm ? `${safeFormatNumber(unit.currentKm)} km/hs` : 'Sin datos'}
                </span>
              </div>
            </Card>
          </div>
        ))}
        {units.length === 0 && (
          <div className="col-span-full text-center py-10 text-slate-500">
            No hay unidades registradas en el sistema.
          </div>
        )}
      </div>

      <Modal 
        isOpen={!!selectedUnit} 
        onClose={() => setSelectedUnit(null)} 
        title={`Gestión: ${selectedUnit?.name || ''} (${selectedUnit?.plate || ''})`}
      >
        {selectedUnit && (
          <div className="flex flex-col h-full max-h-[70vh]">
            
            <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700 mb-4 pb-1 shrink-0 gap-2">
              <Button variant={activeTab === 'km' ? 'primary' : 'ghost'} onClick={() => setActiveTab('km')} className="whitespace-nowrap px-3 py-1.5 text-sm" icon={Activity}>Actualizar KM/Hs</Button>
              <Button variant={activeTab === 'fuel' ? 'primary' : 'ghost'} onClick={() => setActiveTab('fuel')} className="whitespace-nowrap px-3 py-1.5 text-sm text-orange-600 dark:text-orange-400" icon={Droplets}>Carga Gasoil</Button>
              <Button variant={activeTab === 'service' ? 'primary' : 'ghost'} onClick={() => setActiveTab('service')} className="whitespace-nowrap px-3 py-1.5 text-sm text-emerald-600 dark:text-emerald-400" icon={Settings}>Service</Button>
              <Button variant={activeTab === 'history' ? 'primary' : 'ghost'} onClick={() => setActiveTab('history')} className="whitespace-nowrap px-3 py-1.5 text-sm text-purple-600 dark:text-purple-400" icon={History}>Historial</Button>
            </div>

            <div className="overflow-y-auto pr-2 flex-1 pb-4">
              
              {activeTab === 'km' && (
                <form onSubmit={handleSaveKm} className="space-y-4 animate-in fade-in">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm text-blue-800 dark:text-blue-300 mb-4">
                    Actualiza los kilómetros u horas del motor según el rastreo satelital.
                  </div>
                  <Input label="Fecha del reporte" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                  <Input label="Nuevos Kilómetros / Horas Totales" name="currentKmOrHours" type="number" defaultValue={selectedUnit.currentKm} required />
                  <Input label="Observaciones (Opcional)" name="notes" type="textarea" placeholder="Ej: Tomado del panel GPS..." />
                  <Button type="submit" className="w-full mt-4">Guardar Actualización</Button>
                </form>
              )}

              {activeTab === 'fuel' && (
                <form onSubmit={handleSaveFuel} className="space-y-4 animate-in fade-in">
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg text-sm text-orange-800 dark:text-orange-300 mb-4">
                    Registro rápido de litros cargados. (Los costos exactos se pueden ajustar luego en la pestaña de Combustible).
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Fecha" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                    <Input label="Litros Cargados" name="liters" type="number" required />
                  </div>
                  <Input label="KM / Horas al momento de carga" name="currentKm" type="number" defaultValue={selectedUnit.currentKm} required />
                  <Button type="submit" className="w-full mt-4 bg-orange-600 hover:bg-orange-700">Registrar Combustible</Button>
                </form>
              )}

              {activeTab === 'service' && (
                <form onSubmit={handleSaveService} className="space-y-4 animate-in fade-in">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg text-sm text-emerald-800 dark:text-emerald-300 mb-4">
                    Registra la ficha técnica. El sistema enviará una alerta automática a Gastos para que la Administración cargue la factura.
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Fecha del Service" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                    <Input label="KM / Horas Actuales" name="currentKmOrHours" type="number" defaultValue={selectedUnit.currentKm} required />
                  </div>
                  
                  <Input label="Frecuencia Base (Ej: cada 2500 hs)" name="serviceInterval" type="number" placeholder="2500" required />
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Elementos Reemplazados / Revisados</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                      {COMMON_PARTS.map(part => (
                        <button
                          key={part}
                          type="button"
                          onClick={() => togglePart(part)}
                          className={`flex items-center gap-2 text-sm text-left px-2 py-1.5 rounded transition-colors ${selectedParts.has(part) ? 'text-emerald-700 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                        >
                          {selectedParts.has(part) ? <CheckSquare size={16} className="text-emerald-500" /> : <Square size={16} />}
                          {part}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Input label="Trabajos Adicionales / Observaciones" name="notes" type="textarea" placeholder="Ej: Se cambió correa del alternador..." />
                  
                  <Button type="submit" className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700">Guardar Ficha Técnica</Button>
                </form>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4 animate-in fade-in">
                  {getUnitHistory(selectedUnit.id).length === 0 ? (
                    <div className="text-center py-8 text-slate-500">No hay registros en el historial de esta unidad.</div>
                  ) : (
                    <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-6 pb-4">
                      {getUnitHistory(selectedUnit.id).map((record: any) => {
                        const isService = record.type === 'service';
                        const isFuel = record.type === 'fuel_load';
                        const isKm = record.type === 'km_update';
                        
                        let icon = <Activity size={14} />;
                        let colorClass = "bg-blue-100 text-blue-600 border-blue-200";
                        let title = "Actualización de KM/Hs";
                        
                        if (isService) {
                          icon = <Settings size={14} />;
                          colorClass = "bg-emerald-100 text-emerald-600 border-emerald-200";
                          title = "Service Realizado";
                        } else if (isFuel) {
                          icon = <Droplets size={14} />;
                          colorClass = "bg-orange-100 text-orange-600 border-orange-200";
                          title = "Carga de Combustible";
                        }

                        const timeString = formatDateTime(record.createdAt);
                        const timeOnly = timeString.includes(',') ? timeString.split(',')[1] : '';

                        return (
                          <div key={record.id} className="relative pl-6">
                            <div className={`absolute -left-[13px] top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center ${colorClass} bg-white dark:bg-slate-800`}>
                              {icon}
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-bold text-slate-900 dark:text-white">{title}</h4>
                                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                    <Calendar size={12} /> {formatDate(record.date)}
                                    <span className="text-slate-300">|</span>
                                    <UserIcon size={12} /> {record.userEmail || 'Usuario Desconocido'}
                                  </div>
                                </div>
                                <span className="text-xs text-slate-400">{timeOnly}</span>
                              </div>
                              
                              <div className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2 rounded mt-2">
                                {isKm && <p>Registrado en: <strong>{safeFormatNumber(record.currentKmOrHours)} km/hs</strong></p>}
                                {isFuel && <p>Se cargaron <strong>{record.liters} Lts</strong> a los {safeFormatNumber(record.currentKm)} km/hs.</p>}
                                {isService && (
                                  <>
                                    <p>Realizado a los: <strong>{safeFormatNumber(record.currentKmOrHours)} km/hs</strong></p>
                                    <p className="text-xs text-slate-500 mt-1">Base: cada {record.serviceInterval} hs</p>
                                    {record.partsReplaced && record.partsReplaced.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {record.partsReplaced.map((p: string) => (
                                          <span key={p} className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50">{p}</span>
                                        ))}
                                      </div>
                                    )}
                                  </>
                                )}
                                {record.notes && <p className="mt-2 italic text-slate-500 text-xs">" {record.notes} "</p>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
