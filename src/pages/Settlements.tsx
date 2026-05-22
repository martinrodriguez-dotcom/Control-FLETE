import React, { useState } from 'react';
import { Truck, ChevronDown, ChevronUp, CheckSquare, Square, FileText, Trash2, Calendar } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Trip, TransportUnit, Settlement, Client } from '../types';

interface SettlementsProps {
  units: TransportUnit[];
  trips: Trip[];
  clients: Client[];
  settlements: Settlement[];
  onSave: (collectionName: string, data: any) => void;
  onDelete: (collectionName: string, id: string) => void;
}

export const SettlementsView: React.FC<SettlementsProps> = ({ units, trips, clients, settlements, onSave, onDelete }) => {
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});
  const [activeTabs, setActiveTabs] = useState<Record<string, 'pendientes' | 'historial'>>({});
  
  // Guardamos qué viajes están tildados (seleccionados) para cada unidad
  const [selectedTrips, setSelectedTrips] = useState<Record<string, Set<string>>>({});
  
  // Modal de confirmación de liquidación
  const [isModalOpen, setModalOpen] = useState(false);
  const [settlingUnitId, setSettlingUnitId] = useState<string | null>(null);

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-AR', { timeZone: 'UTC' });

  // Array plano con TODOS los IDs de viajes que ya fueron liquidados históricamente
  const settledTripIds = new Set(settlements.flatMap(s => s.tripIds));

  const toggleUnit = (unitId: string) => {
    setExpandedUnits(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const setTab = (unitId: string, tab: 'pendientes' | 'historial') => {
    setActiveTabs(prev => ({ ...prev, [unitId]: tab }));
  };

  const toggleTripSelection = (unitId: string, tripId: string) => {
    setSelectedTrips(prev => {
      const unitSelection = new Set(prev[unitId] || []);
      if (unitSelection.has(tripId)) unitSelection.delete(tripId);
      else unitSelection.add(tripId);
      return { ...prev, [unitId]: unitSelection };
    });
  };

  const selectAllTrips = (unitId: string, tripIds: string[]) => {
    setSelectedTrips(prev => {
      const unitSelection = new Set(prev[unitId] || []);
      if (unitSelection.size === tripIds.length) {
        unitSelection.clear(); // Si están todos seleccionados, los deselecciona
      } else {
        tripIds.forEach(id => unitSelection.add(id)); // Si no, selecciona todos
      }
      return { ...prev, [unitId]: unitSelection };
    });
  };

  const openSettlementModal = (unitId: string) => {
    setSettlingUnitId(unitId);
    setModalOpen(true);
  };

  const handleConfirmSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingUnitId) return;

    const fd = new FormData(e.target as HTMLFormElement);
    const date = fd.get('date') as string;
    const notes = fd.get('notes') as string;

    const tripIdsToSettle = Array.from(selectedTrips[settlingUnitId] || []);
    
    // Calcular el total de los viajes seleccionados
    const totalAmount = trips
      .filter(t => tripIdsToSettle.includes(t.id))
      .reduce((sum, t) => sum + Number(t.value), 0);

    const payload = {
      unitId: settlingUnitId,
      date,
      notes,
      tripIds: tripIdsToSettle,
      totalAmount
    };

    onSave('settlements', payload);
    
    // Limpiar selección y cerrar
    setSelectedTrips(prev => {
      const newState = { ...prev };
      delete newState[settlingUnitId];
      return newState;
    });
    setModalOpen(false);
    setSettlingUnitId(null);
    setTab(settlingUnitId, 'historial'); // Cambiar a la pestaña historial para ver la liquidación creada
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Liquidaciones de Unidades</h2>
          <p className="text-slate-500 dark:text-slate-400">Rendición de viajes y control de pagos</p>
        </div>
      </div>

      <div className="space-y-4">
        {units.map(unit => {
          const isOpen = !!expandedUnits[unit.id];
          const activeTab = activeTabs[unit.id] || 'pendientes';
          
          // Filtramos los viajes de esta unidad que NO están en el array de liquidados
          const pendingTrips = trips
            .filter(t => t.unitId === unit.id && !settledTripIds.has(t.id))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Del más viejo al más nuevo
            
          const unitSettlements = settlements
            .filter(s => s.unitId === unit.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Del más nuevo al más viejo

          const selectedSet = selectedTrips[unit.id] || new Set();
          const selectedTotalAmount = pendingTrips
            .filter(t => selectedSet.has(t.id))
            .reduce((sum, t) => sum + Number(t.value), 0);

          return (
            <div key={unit.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/70 shadow-sm overflow-hidden transition-all">
              
              {/* CABECERA DE LA UNIDAD */}
              <button
                onClick={() => toggleUnit(unit.id)}
                className="w-full p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors text-left outline-none"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 rounded-lg">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-none mb-1">
                      {unit.name} <span className="text-sm font-normal text-slate-500">({unit.plate})</span>
                    </h3>
                    {pendingTrips.length > 0 ? (
                      <p className="text-xs text-orange-600 dark:text-orange-400 font-medium flex items-center gap-1">
                        <FileText size={12} /> {pendingTrips.length} viajes pendientes de liquidar
                      </p>
                    ) : (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <CheckSquare size={12} /> Todo al día
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-slate-400 p-1">
                  {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>

              {/* CONTENIDO DESPLEGABLE */}
              {isOpen && (
                <div className="border-t border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-top-2">
                  
                  {/* TABS (Pestañas) */}
                  <div className="flex border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-4">
                    <button
                      onClick={() => setTab(unit.id, 'pendientes')}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pendientes' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                      Viajes a Liquidar ({pendingTrips.length})
                    </button>
                    <button
                      onClick={() => setTab(unit.id, 'historial')}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'historial' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                      Historial ({unitSettlements.length})
                    </button>
                  </div>

                  {/* PESTAÑA 1: PENDIENTES */}
                  {activeTab === 'pendientes' && (
                    <div className="p-4">
                      {pendingTrips.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">No hay viajes pendientes de liquidar para esta unidad.</div>
                      ) : (
                        <>
                          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                            <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
                              <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                  <th className="px-4 py-3 w-10">
                                    <button onClick={() => selectAllTrips(unit.id, pendingTrips.map(t => t.id))} className="text-slate-400 hover:text-blue-600 transition-colors">
                                      {selectedSet.size === pendingTrips.length ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
                                    </button>
                                  </th>
                                  <th className="px-4 py-3">Fecha</th>
                                  <th className="px-4 py-3">Ruta</th>
                                  <th className="px-4 py-3">Cliente</th>
                                  <th className="px-4 py-3">Cobro</th>
                                  <th className="px-4 py-3 text-right">Valor</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pendingTrips.map(t => {
                                  const isSelected = selectedSet.has(t.id);
                                  const client = clients.find(c => c.id === t.clientId);
                                  return (
                                    <tr 
                                      key={t.id} 
                                      onClick={() => toggleTripSelection(unit.id, t.id)}
                                      className={`border-b last:border-0 dark:border-slate-700/50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                    >
                                      <td className="px-4 py-3">
                                        {isSelected ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} className="text-slate-400" />}
                                      </td>
                                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{formatDate(t.date)}</td>
                                      <td className="px-4 py-3">{t.origin} → {t.destination}</td>
                                      <td className="px-4 py-3">{client?.company || 'N/A'}</td>
                                      <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-1 rounded-full ${t.paymentStatus === 'cobrado' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}`}>
                                          {t.paymentStatus}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                                        {formatCurrency(t.value)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          
                          {/* Resumen y Botón de Acción */}
                          <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div>
                              <p className="text-sm text-slate-500">Viajes seleccionados: <strong className="text-slate-900 dark:text-white">{selectedSet.size}</strong> de {pendingTrips.length}</p>
                              <p className="text-lg text-slate-900 dark:text-white">Total a Liquidar: <strong className="text-blue-600 dark:text-blue-400">{formatCurrency(selectedTotalAmount)}</strong></p>
                            </div>
                            <Button 
                              onClick={() => openSettlementModal(unit.id)} 
                              disabled={selectedSet.size === 0}
                              className={selectedSet.size === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                            >
                              Generar Liquidación
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* PESTAÑA 2: HISTORIAL */}
                  {activeTab === 'historial' && (
                    <div className="p-4">
                      {unitSettlements.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">Aún no hay liquidaciones históricas.</div>
                      ) : (
                        <div className="space-y-3">
                          {unitSettlements.map(s => (
                            <div key={s.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-300 transition-colors bg-white dark:bg-slate-800">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Calendar size={16} className="text-slate-400" />
                                  <h4 className="font-bold text-slate-900 dark:text-white">{formatDate(s.date)}</h4>
                                </div>
                                <p className="text-sm text-slate-500">Se liquidaron <strong>{s.tripIds.length} viajes</strong>.</p>
                                {s.notes && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 italic">"{s.notes}"</p>}
                              </div>
                              <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className="text-right flex-1 sm:flex-none">
                                  <p className="text-xs text-slate-400 uppercase font-semibold">Total Liquidado</p>
                                  <p className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{formatCurrency(s.totalAmount)}</p>
                                </div>
                                <Button variant="ghost" icon={Trash2} onClick={() => onDelete('settlements', s.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" title="Eliminar liquidación (Vuelve los viajes a Pendientes)" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}
            </div>
          );
        })}

        {units.length === 0 && (
          <Card className="text-center py-10 text-slate-500">
            No tienes unidades registradas para realizar liquidaciones.
          </Card>
        )}
      </div>

      {/* MODAL PARA CONFIRMAR LA LIQUIDACIÓN */}
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Confirmar Liquidación">
        <form onSubmit={handleConfirmSettlement}>
          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-lg mb-6 text-sm border border-blue-100 dark:border-blue-800/30">
            Estás por generar una liquidación (recibo) por los viajes seleccionados. Los mismos se marcarán como "Liquidados" y pasarán al historial de esta unidad.
          </div>
          
          <div className="space-y-4">
            <Input 
              label="Fecha de la Liquidación" 
              name="date" 
              type="date" 
              defaultValue={new Date().toISOString().split('T')[0]} 
              required 
            />
            <Input 
              label="Observaciones (Opcional)" 
              name="notes" 
              type="textarea" 
              defaultValue=""
              placeholder="Ej: Transferencia al Banco, Efectivo, Descuento por peajes, etc." 
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Confirmar y Liquidar</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
