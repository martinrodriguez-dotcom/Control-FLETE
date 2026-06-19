import React, { useState } from 'react';
import { 
  PieChart, TrendingUp, TrendingDown, Truck, ChevronDown, ChevronUp, 
  Droplets, Receipt, Settings, Map, Activity, DollarSign, BarChart3, ChevronRight 
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { TransportUnit, Trip, Expense, FuelLoad, ServiceRecord } from '../types';

interface ReportsProps {
  units?: TransportUnit[];
  trips?: Trip[];
  expenses?: Expense[];
  fuel?: FuelLoad[];
  services?: ServiceRecord[];
}

export const ReportsView: React.FC<ReportsProps> = ({ 
  units = [], trips = [], expenses = [], fuel = [], services = [] 
}) => {
  // Estado para el Modal y los Acordeones internos
  const [selectedUnit, setSelectedUnit] = useState<TransportUnit | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Utilidades de formato
  const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val || 0);
  const formatNumber = (val: number) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(val || 0);
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try { return new Date(dateStr).toLocaleDateString('es-AR', { timeZone: 'UTC' }); } catch { return dateStr; }
  };

  // --- CÁLCULOS GLOBALES DE TODA LA FLOTA ---
  const globalRevenue = trips.reduce((sum, t) => sum + Number(t.value || 0), 0);
  const globalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const globalFuelCost = fuel.reduce((sum, f) => sum + Number(f.total || 0), 0);
  const globalTotalCosts = globalExpenses + globalFuelCost;
  const globalNetProfit = globalRevenue - globalTotalCosts;

  // --- CÁLCULOS PARA EL MODAL (Unidad Seleccionada) ---
  const getUnitDetails = (unitId: string) => {
    const uTrips = trips.filter(t => t.unitId === unitId);
    const uExpenses = expenses.filter(e => e.unitId === unitId);
    const uFuel = fuel.filter(f => f.unitId === unitId);
    const uServices = services.filter(s => s.unitId === unitId && s.type === 'service').sort((a,b) => b.createdAt - a.createdAt);

    const totalKm = uTrips.reduce((sum, t) => sum + Number(t.km || 0), 0);
    const uRevenue = uTrips.reduce((sum, t) => sum + Number(t.value || 0), 0);
    const uExpTotal = uExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const uFuelTotal = uFuel.reduce((sum, f) => sum + Number(f.total || 0), 0);
    const uFuelLiters = uFuel.reduce((sum, f) => sum + Number(f.liters || 0), 0);
    
    const uTotalCosts = uExpTotal + uFuelTotal;
    const uNet = uRevenue - uTotalCosts;
    
    const kmPerLiter = uFuelLiters > 0 ? (totalKm / uFuelLiters) : 0;
    const costPerKm = totalKm > 0 ? (uTotalCosts / totalKm) : 0;
    const lastService = uServices.length > 0 ? uServices[0] : null;

    const expensesByCategory = uExpenses.reduce((acc, curr) => {
      const cat = curr.category || 'otros';
      if (!acc[cat]) acc[cat] = { total: 0, items: [] };
      acc[cat].total += Number(curr.amount);
      acc[cat].items.push(curr);
      return acc;
    }, {} as Record<string, { total: number, items: Expense[] }>);

    return { uTrips, uFuel, uRevenue, uFuelTotal, uTotalCosts, uNet, totalKm, kmPerLiter, costPerKm, lastService, expensesByCategory };
  };

  return (
    <div className="space-y-6">
      
      {/* TÍTULO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="text-blue-600" /> Inteligencia de Negocio
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Análisis de rentabilidad, costos y rendimiento por unidad</p>
        </div>
      </div>

      {/* TARJETAS DE RESUMEN GLOBAL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-emerald-500 shadow-sm">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2"><TrendingUp size={16}/> Ingresos Totales</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(globalRevenue)}</p>
        </Card>
        <Card className="p-4 border-l-4 border-red-500 shadow-sm">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2"><TrendingDown size={16}/> Costos Operativos</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">-{formatCurrency(globalTotalCosts)}</p>
        </Card>
        <Card className="p-4 border-l-4 border-blue-500 shadow-sm">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2"><PieChart size={16}/> Rentabilidad Neta</p>
          <p className={`text-2xl font-bold mt-1 ${globalNetProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}`}>
            {formatCurrency(globalNetProfit)}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-orange-500 shadow-sm bg-orange-50/50 dark:bg-orange-900/10">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2"><Activity size={16}/> Margen de Ganancia</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
            {globalRevenue > 0 ? formatNumber((globalNetProfit / globalRevenue) * 100) : 0}%
          </p>
        </Card>
      </div>

      <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-2">Reportes por Unidad</h3>
      
      {/* GRILLA DE UNIDADES (TARJETAS CUADRADAS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {units.map(unit => {
          // Calculamos solo lo básico para la tarjeta
          const uTrips = trips.filter(t => t.unitId === unit.id);
          const uExpenses = expenses.filter(e => e.unitId === unit.id);
          const uFuel = fuel.filter(f => f.unitId === unit.id);

          const uRevenue = uTrips.reduce((sum, t) => sum + Number(t.value || 0), 0);
          const uTotalCosts = uExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0) + uFuel.reduce((sum, f) => sum + Number(f.total || 0), 0);
          const uNet = uRevenue - uTotalCosts;

          return (
            <div key={unit.id} onClick={() => { setSelectedUnit(unit); setExpandedCategories({}); }} className="cursor-pointer group">
              <Card className={`p-5 hover:shadow-md transition-shadow h-full border-l-4 ${uNet >= 0 ? 'border-emerald-500' : 'border-red-500'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${uNet >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-red-50 text-red-600 dark:bg-red-900/30'}`}>
                      <Truck size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">{unit.name}</h3>
                      <p className="text-sm font-medium text-slate-500">{unit.plate}</p>
                    </div>
                  </div>
                  <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                </div>
                
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Balance Neto:</span>
                    <span className={`font-black text-lg ${uNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(uNet)}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
        {units.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            No hay unidades registradas para analizar.
          </div>
        )}
      </div>

      {/* MODAL CON EL REPORTE DETALLADO DE LA UNIDAD */}
      <Modal 
        isOpen={!!selectedUnit} 
        onClose={() => setSelectedUnit(null)} 
        title={`Reporte Inteligente: ${selectedUnit?.name || ''}`}
      >
        {selectedUnit && (() => {
          // Extraemos los datos completos solo cuando el modal se abre
          const details = getUnitDetails(selectedUnit.id);

          return (
            <div className="flex flex-col h-full max-h-[75vh] overflow-y-auto pr-2 pb-4 space-y-6 animate-in fade-in">
              
              {/* RESUMEN FINANCIERO DEL VEHÍCULO */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-center border-r border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Ingresos</p>
                  <p className="font-semibold text-emerald-600">{formatCurrency(details.uRevenue)}</p>
                </div>
                <div className="text-center border-r border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Egresos</p>
                  <p className="font-semibold text-red-500">-{formatCurrency(details.uTotalCosts)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Neto</p>
                  <p className={`font-bold ${details.uNet >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(details.uNet)}</p>
                </div>
              </div>

              {/* MINI-DASHBOARD DE ESTADÍSTICAS */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Map size={12}/> Recorrido (Est.)</p>
                  <p className="font-bold text-slate-900 dark:text-white">{formatNumber(details.totalKm)} km</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Droplets size={12}/> Consumo Prom.</p>
                  <p className="font-bold text-blue-600 dark:text-blue-400">{formatNumber(details.kmPerLiter)} km/L</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><DollarSign size={12}/> Costo x Km</p>
                  <p className="font-bold text-red-500">{formatCurrency(details.costPerKm)}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Settings size={12}/> Último Service</p>
                  {details.lastService ? (
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{formatNumber(details.lastService.currentKmOrHours)} km/hs</p>
                  ) : (
                    <p className="font-bold text-slate-400 text-sm">Sin registro</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">Detalle Operativo</h4>

                {/* ACORDEÓN: VIAJES */}
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-emerald-200 dark:border-emerald-800/50 overflow-hidden">
                  <button 
                    onClick={() => toggleCategory(`trips`)}
                    className="w-full flex justify-between items-center p-3 bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                      <Map size={18} /> Facturación de Viajes ({details.uTrips.length})
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-emerald-600">{formatCurrency(details.uRevenue)}</span>
                      {expandedCategories[`trips`] ? <ChevronUp size={16} className="text-emerald-500"/> : <ChevronDown size={16} className="text-emerald-500"/>}
                    </div>
                  </button>
                  {expandedCategories[`trips`] && (
                    <div className="p-3 border-t border-emerald-100 dark:border-emerald-800/50">
                      {details.uTrips.length === 0 ? <p className="text-xs text-slate-500 text-center py-2">No hay viajes registrados.</p> : (
                        <table className="w-full text-xs text-left text-slate-600 dark:text-slate-400">
                          <tbody>
                            {details.uTrips.map(t => (
                              <tr key={t.id} className="border-b last:border-0 border-slate-100 dark:border-slate-700">
                                <td className="py-2 w-20">{formatDate(t.date)}</td>
                                <td className="py-2">{t.origin} → {t.destination}</td>
                                <td className="py-2 text-right font-semibold text-slate-900 dark:text-white">{formatCurrency(t.value)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>

                {/* ACORDEÓN: COMBUSTIBLE */}
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-orange-200 dark:border-orange-800/50 overflow-hidden">
                  <button 
                    onClick={() => toggleCategory(`fuel`)}
                    className="w-full flex justify-between items-center p-3 bg-orange-50/50 dark:bg-orange-900/10 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-bold text-sm">
                      <Droplets size={18} /> Consumo Combustible ({details.uFuel.length})
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-orange-600">-{formatCurrency(details.uFuelTotal)}</span>
                      {expandedCategories[`fuel`] ? <ChevronUp size={16} className="text-orange-500"/> : <ChevronDown size={16} className="text-orange-500"/>}
                    </div>
                  </button>
                  {expandedCategories[`fuel`] && (
                    <div className="p-3 border-t border-orange-100 dark:border-orange-800/50">
                      {details.uFuel.length === 0 ? <p className="text-xs text-slate-500 text-center py-2">No hay cargas registradas.</p> : (
                        <table className="w-full text-xs text-left text-slate-600 dark:text-slate-400">
                          <tbody>
                            {details.uFuel.map(f => (
                              <tr key={f.id} className="border-b last:border-0 border-slate-100 dark:border-slate-700">
                                <td className="py-2 w-20">{formatDate(f.date)}</td>
                                <td className="py-2">{f.liters} Lts</td>
                                <td className="py-2 text-right font-semibold text-slate-900 dark:text-white">{formatCurrency(f.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>

                {/* ACORDEONES DINÁMICOS POR CATEGORÍA DE GASTO */}
                {Object.entries(details.expensesByCategory).map(([category, data]) => (
                  <div key={category} className="bg-white dark:bg-slate-800 rounded-lg border border-red-200 dark:border-red-800/50 overflow-hidden">
                    <button 
                      onClick={() => toggleCategory(`exp-${category}`)}
                      className="w-full flex justify-between items-center p-3 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-sm capitalize">
                        <Receipt size={18} /> Gasto: {category} ({data.items.length})
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-red-600">-{formatCurrency(data.total)}</span>
                        {expandedCategories[`exp-${category}`] ? <ChevronUp size={16} className="text-red-500"/> : <ChevronDown size={16} className="text-red-500"/>}
                      </div>
                    </button>
                    {expandedCategories[`exp-${category}`] && (
                      <div className="p-3 border-t border-red-100 dark:border-red-800/50">
                        <table className="w-full text-xs text-left text-slate-600 dark:text-slate-400">
                          <tbody>
                            {data.items.map(e => (
                              <tr key={e.id} className="border-b last:border-0 border-slate-100 dark:border-slate-700">
                                <td className="py-2 w-20">{formatDate(e.date)}</td>
                                <td className="py-2">{e.description}</td>
                                <td className="py-2 text-right font-semibold text-slate-900 dark:text-white">{formatCurrency(e.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </div>
          );
        })()}
      </Modal>
    </div>
  );
};
