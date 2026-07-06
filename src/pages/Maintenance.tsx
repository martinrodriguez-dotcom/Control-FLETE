import React, { useState } from 'react';
import { Settings, Droplets, History, Activity, Calendar, User as UserIcon, CheckSquare, Square, Truck, Database, ChevronRight, PlusCircle } from 'lucide-react';
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
  'Aceite de Motor', 'Filtro de Aceite', 'Filtro de Aire', 'Filtro de Combustible',
  'Filtro de Habitáculo', 'Líquido Refrigerante', 'Engrase General', 'Revisión de Frenos', 'Rotación de Neumáticos'
];

export const MaintenanceView: React.FC<MaintenanceProps> = ({ 
  units = [], services = [], fuel = [], currentUserEmail = 'usuario@desconocido.com', onSave 
}) => {
  const [selectedUnit, setSelectedUnit] = useState<TransportUnit | null>(null);
  const [activeTab, setActiveTab] = useState<'km' | 'fuel' | 'service' | 'history' | 'tank_add'>('km');
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());

  const tanks = units.filter(u => u.type === 'tanque' && u.status === 'activo');

  const safeFormatNumber = (val: any) => {
    if (val === null || val === undefined || isNaN(Number(val))) return '';
    return Number(val).toLocaleString('es-AR');
  };

  const formatDate = (dateStr: any) => {
    if (!dateStr) return '';
    try { return new Date(dateStr).toLocaleDateString('es-AR', { timeZone: 'UTC' }); } catch (e) { return dateStr; }
  };

  const formatDateTime = (ts: any) => {
    if (!ts) return '';
    try { return new Date(ts).toLocaleString('es-AR'); } catch (e) { return ''; }
  };

  const handleOpenUnit = (unit: TransportUnit) => {
    setSelectedUnit(unit);
    setActiveTab(unit.type === 'tanque' ? 'tank_add' : 'km');
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

  // --- 1. GUARDAR KM ---
  const handleSaveKm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;
    const fd = new FormData(e.target as HTMLFormElement);
    
    onSave('services', {
      unitId: selectedUnit.id, type: 'km_update', date: fd.get('date'),
      currentKmOrHours: Number(fd.get('currentKmOrHours')), notes: fd.get('notes'), userEmail: currentUserEmail
    });
    onSave('units', { ...selectedUnit, currentKm: Number(fd.get('currentKmOrHours')) });
    setSelectedUnit(null);
  };

  // --- 2. GUARDAR COMBUSTIBLE Y DESCONTAR DEL TANQUE ---
  const handleSaveFuel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;
    const fd = new FormData(e.target as HTMLFormElement);
    
    const liters = Number(fd.get('liters')) || 0;
    const sourceTankId = fd.get('sourceTankId') as string;
    const currentKm = Number(fd.get('currentKm')) || 0;
    
    // Primero: Descontar del tanque (si se eligió uno)
    if (sourceTankId && sourceTankId.trim() !== '') {
      const tank = units.find(u => u.id === sourceTankId);
      if (tank) {
        const currentLevel = tank.currentFuel || 0;
        const newFuelLevel = Math.max(0, currentLevel - liters); // Evita números negativos
        // Actualizamos el tanque en la base de datos
        onSave('units', { ...tank, currentFuel: newFuelLevel });
      }
    }

    // Segundo: Guardar el registro histórico de carga
    onSave('fuel', {
      unitId: selectedUnit.id,
      date: fd.get('date'),
      liters: liters,
      pricePerLiter: 0, 
      total: 0,
      station: sourceTankId ? 'Tanque Interno Propio' : 'Estación de Servicio Externa',
      sourceTankId: sourceTankId || null,
      currentKm: currentKm,
      userEmail: currentUserEmail
    });

    // Tercero: Actualizar los KM del vehículo
    if (currentKm > 0) {
      onSave('units', { ...selectedUnit, currentKm: currentKm });
    }

    setSelectedUnit(null);
  };

  // --- 3. INGRESAR LITROS AL TANQUE (COMPRAS) ---
  const handleSaveFuelToTank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;
    const fd = new FormData(e.target as HTMLFormElement);
    const litersToAdd = Number(fd.get('liters')) || 0;
    const date = fd.get('date') as string;

    const currentLevel = selectedUnit.currentFuel || 0;
    const newLevel = currentLevel + litersToAdd;
    
    if (selectedUnit.fuelCapacity && newLevel > selectedUnit.fuelCapacity) {
      if (!window.confirm(`¡Atención! La capacidad es de ${selectedUnit.fuelCapacity} Lts. Con esta carga llegarías a ${newLevel} Lts. ¿Continuar?`)) {
        return;
      }
    }

    onSave('units', { ...selectedUnit, currentFuel: newLevel });

    onSave('fuel', {
      unitId: selectedUnit.id,
      date: date,
      liters: litersToAdd,
      pricePerLiter: 0, total: 0,
      station: 'Ingreso Manual (Compra a Proveedor)',
      currentKm: 0,
      userEmail: currentUserEmail
    });

    setSelectedUnit(null);
  };

  // --- 4. GUARDAR SERVICE ---
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;
    const fd = new FormData(e.target as HTMLFormElement);
    const currentKm = Number(fd.get('currentKmOrHours'));
    const serviceNotes = fd.get('notes') as string;
    const serviceDate = fd.get('date') as string;
    
    onSave('services', {
      unitId: selectedUnit.id, type: 'service', date: serviceDate,
      currentKmOrHours: currentKm, serviceInterval: Number(fd.get('serviceInterval')),
      partsReplaced: Array.from(selectedParts), notes: serviceNotes, userEmail: currentUserEmail
    });

    onSave('units', { ...selectedUnit, currentKm: currentKm });
    
    onSave('expenses', {
      date: serviceDate, unitId: selectedUnit.id, category: 'mantenimiento',
      description: `Service a los ${currentKm} km/hs. ${serviceNotes ? `(${serviceNotes})` : ''}`,
      amount: 0, userEmail: currentUserEmail
    });

    setSelectedUnit(null);
  };

  const getUnitHistory = (unitId: string) => {
    const safeServices = Array.isArray(services) ? services : [];
    const safeFuel = Array.isArray(fuel) ? fuel : [];
    const unitServices = safeServices.filter(s => s.unitId === unitId).map(s => ({ ...s, collection: 'services' }));
    const unitFuel = safeFuel.filter(f => f.unitId === unitId || f.sourceTankId === unitId).map(f => ({ ...f, collection: 'fuel', type: 'fuel_load' }));
    return [...unitServices, ...unitFuel].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Mantenimiento Operativo</h2>
        <p className="text-slate-500 dark:text-slate-400">Control de services, surtidores de combustible internos e historial</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {units.map(unit => {
          const isTank = unit.type === 'tanque';
          const Icon = isTank ? Database : Truck;
          const colorClass = isTank ? 'text-orange-600 bg-orange-50 border-orange-500' : 'text-blue-600 bg-blue-50 border-blue-500';

          return (
            <div key={unit.id} onClick={() => handleOpenUnit(unit)} className="cursor-pointer group">
              <Card className={`p-5 hover:shadow-md transition-shadow border-l-4 h-full ${colorClass}`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${isTank ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                      <Icon size={24} className={isTank ? 'text-orange-600' : 'text-blue-600'} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">{unit.name}</h3>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{unit.plate}</p>
                    </div>
                  </div>
                  <ChevronRight className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center text-sm">
                  <span className="text-slate-500">{isTank ? 'Gasoil Disponible:' : 'Último registro:'}</span>
                  <span className={`font-bold ${isTank ? 'text-orange-600' : 'text-slate-700 dark:text-slate-300'}`}>
                    {isTank 
                      ? `${safeFormatNumber(unit.currentFuel || 0)} / ${safeFormatNumber(unit.fuelCapacity || 0)} Lts`
                      : (unit.currentKm ? `${safeFormatNumber(unit.currentKm)} km/hs` : 'Sin datos')
                    }
                  </span>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      <Modal 
        isOpen={!!selectedUnit} 
        onClose={() => setSelectedUnit(null)} 
        title={`Gestión: ${selectedUnit?.name || ''} ${selectedUnit?.type === 'tanque' ? '(Tanque)' : ''}`}
      >
        {selectedUnit && (
          <div className="flex flex-col h-full max-h-[70vh]">
            
            <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700 mb-4 pb-1 shrink-0 gap-2">
              {selectedUnit.type === 'tanque' ? (
                <>
                  <Button variant={activeTab === 'tank_add' ? 'primary' : 'ghost'} onClick={() => setActiveTab('tank_add')} className="whitespace-nowrap px-3 py-1.5 text-sm bg-orange-50 text-orange-700" icon={PlusCircle}>Ingresar Combustible</Button>
                  <Button variant={activeTab === 'history' ? 'primary' : 'ghost'} onClick={() => setActiveTab('history')} className="whitespace-nowrap px-3 py-1.5 text-sm" icon={History}>Movimientos</Button>
                </>
              ) : (
                <>
                  <Button variant={activeTab === 'km' ? 'primary' : 'ghost'} onClick={() => setActiveTab('km')} className="whitespace-nowrap px-3 py-1.5 text-sm" icon={Activity}>Actualizar KM</Button>
                  <Button variant={activeTab === 'fuel' ? 'primary' : 'ghost'} onClick={() => setActiveTab('fuel')} className="whitespace-nowrap px-3 py-1.5 text-sm text-orange-600" icon={Droplets}>Carga Gasoil</Button>
                  <Button variant={activeTab === 'service' ? 'primary' : 'ghost'} onClick={() => setActiveTab('service')} className="whitespace-nowrap px-3 py-1.5 text-sm text-emerald-600" icon={Settings}>Service</Button>
                  <Button variant={activeTab === 'history' ? 'primary' : 'ghost'} onClick={() => setActiveTab('history')} className="whitespace-nowrap px-3 py-1.5 text-sm text-purple-600" icon={History}>Historial</Button>
                </>
              )}
            </div>

            <div className="overflow-y-auto pr-2 flex-1 pb-4">
              
              {activeTab === 'tank_add' && (
                <form onSubmit={handleSaveFuelToTank} className="space-y-4 animate-in fade-in">
                  <div className="bg-orange-50 p-3 rounded-lg text-sm text-orange-800 mb-4">
                    Registra la cantidad de litros que ingresan al tanque (Ej: Compra a YPF mayorista).
                    Capacidad máxima: {selectedUnit.fuelCapacity} Lts.
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Fecha de Recepción" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                    <Input label="Litros Recibidos" name="liters" type="number" required />
                  </div>
                  <Button type="submit" className="w-full mt-4 bg-orange-600 hover:bg-orange-700">Guardar Ingreso de Combustible</Button>
                </form>
              )}

              {activeTab === 'km' && (
                <form onSubmit={handleSaveKm} className="space-y-4 animate-in fade-in">
                  <Input label="Fecha del reporte" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                  <Input label="Nuevos Kilómetros / Horas" name="currentKmOrHours" type="number" defaultValue={selectedUnit.currentKm} required />
                  <Input label="Observaciones" name="notes" type="textarea" />
                  <Button type="submit" className="w-full mt-4">Guardar Actualización</Button>
                </form>
              )}

              {activeTab === 'fuel' && (
                <form onSubmit={handleSaveFuel} className="space-y-4 animate-in fade-in">
                  <div className="bg-orange-50 p-3 rounded-lg text-sm text-orange-800 mb-4">
                    Si seleccionas un Tanque Interno, los litros se descontarán automáticamente del mismo.
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Fecha" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                    <Input label="Litros Cargados" name="liters" type="number" required />
                  </div>
                  <Input label="KM / Horas al momento de carga" name="currentKm" type="number" defaultValue={selectedUnit.currentKm} />

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Origen del Combustible</label>
                    {/* AQUÍ ESTABA EL PROBLEMA: Le quité el atributo "required" para que deje guardar si cargas afuera */}
                    <select name="sourceTankId" className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      <option value="">Estación de Servicio Externa (YPF, Axion, etc)</option>
                      {tanks.length > 0 && <optgroup label="Surtidores Internos">
                        {tanks.map(t => (
                          <option key={t.id} value={t.id}>{t.name} (Disp: {t.currentFuel || 0} Lts)</option>
                        ))}
                      </optgroup>}
                    </select>
                  </div>
                  <Button type="submit" className="w-full mt-4 bg-orange-600 hover:bg-orange-700">Registrar Consumo</Button>
                </form>
              )}

              {activeTab === 'service' && (
                <form onSubmit={handleSaveService} className="space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Fecha del Service" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                    <Input label="KM / Horas Actuales" name="currentKmOrHours" type="number" defaultValue={selectedUnit.currentKm} required />
                  </div>
                  <Input label="Frecuencia Base (Ej: cada 2500 hs)" name="serviceInterval" type="number" placeholder="2500" required />
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Elementos Reemplazados</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      {COMMON_PARTS.map(part => (
                        <button key={part} type="button" onClick={() => togglePart(part)} className="flex items-center gap-2 text-sm text-left">
                          {selectedParts.has(part) ? <CheckSquare size={16} className="text-emerald-500" /> : <Square size={16} />}
                          {part}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input label="Observaciones" name="notes" type="textarea" />
                  <Button type="submit" className="w-full mt-4 bg-emerald-600">Guardar Ficha Técnica</Button>
                </form>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4 animate-in fade-in">
                  {getUnitHistory(selectedUnit.id).length === 0 ? (
                    <div className="text-center py-8 text-slate-500">No hay movimientos registrados.</div>
                  ) : (
                    <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-6 pb-4">
                      {getUnitHistory(selectedUnit.id).map((record: any) => {
                        const isTankView = selectedUnit.type === 'tanque';
                        const isService = record.type === 'service';
                        const isKm = record.type === 'km_update';
                        
                        const isExtraction = isTankView && record.unitId !== selectedUnit.id;
                        
                        let icon = <Activity size={14} />;
                        let colorClass = "bg-blue-100 text-blue-600 border-blue-200";
                        let title = "Registro";

                        if (isTankView) {
                           icon = <Database size={14} />;
                           if (isExtraction) {
                             colorClass = "bg-red-100 text-red-600 border-red-200";
                             title = "Combustible Extraído";
                           } else {
                             colorClass = "bg-emerald-100 text-emerald-600 border-emerald-200";
                             title = "Combustible Ingresado";
                           }
                        } else {
                          if (isService) {
                            icon = <Settings size={14} />; colorClass = "bg-emerald-100 text-emerald-600"; title = "Service";
                          } else if (record.type === 'fuel_load') {
                            icon = <Droplets size={14} />; colorClass = "bg-orange-100 text-orange-600"; title = "Carga Gasoil";
                          } else {
                            title = "Actualización KM";
                          }
                        }

                        return (
                          <div key={record.id} className="relative pl-6">
                            <div className={`absolute -left-[13px] top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center ${colorClass} bg-white`}>
                              {icon}
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-bold">{title}</h4>
                                  <div className="text-xs text-slate-500 flex gap-2">
                                    <Calendar size={12}/> {formatDate(record.date)} | <UserIcon size={12}/> {record.userEmail}
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm bg-slate-50 p-2 rounded mt-2">
                                {isTankView ? (
                                  isExtraction 
                                    ? <p>Se despacharon <strong className="text-red-500">-{record.liters} Lts</strong> para el vehículo {units.find(u=>u.id===record.unitId)?.name}.</p>
                                    : <p>Ingresaron <strong className="text-emerald-600">+{record.liters} Lts</strong> al tanque.</p>
                                ) : (
                                  <>
                                    {isKm && <p>Registrado: <strong>{safeFormatNumber(record.currentKmOrHours)} km/hs</strong></p>}
                                    {record.type === 'fuel_load' && <p>Se cargaron <strong>{record.liters} Lts</strong> ({record.station})</p>}
                                    {isService && <p>Service a los: <strong>{safeFormatNumber(record.currentKmOrHours)} km/hs</strong></p>}
                                  </>
                                )}
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
