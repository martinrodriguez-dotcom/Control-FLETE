import React, { useState, useMemo } from 'react';
import { LayoutDashboard, TrendingUp, TrendingDown, Filter, DollarSign, Activity, CheckCircle2, Circle, Map, Receipt } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Trip, Expense, FuelLoad, TransportUnit, Client } from '../types';

interface DashboardProps {
  trips: Trip[];
  expenses: Expense[];
  fuel: FuelLoad[];
  units: TransportUnit[];
  clients: Client[];
}

export const DashboardView: React.FC<DashboardProps> = ({ trips, expenses, fuel, units, clients }) => {
  const [excludedUnits, setExcludedUnits] = useState<Set<string>>(new Set());

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val || 0);
  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString('es-AR', { timeZone: 'UTC' }); } catch { return dateStr; }
  };

  const toggleUnitFilter = (unitId: string) => {
    setExcludedUnits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(unitId)) newSet.delete(unitId);
      else newSet.add(unitId);
      return newSet;
    });
  };

  // 1. Cálculos globales rápidos
  const globalRevenue = trips.reduce((acc, t) => acc + Number(t.value || 0), 0);
  const globalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0) + fuel.reduce((acc, f) => acc + Number(f.total || 0), 0);
  const globalNet = globalRevenue - globalExpenses;

  // 2. Cálculos de Rentabilidad por Unidad (Gráfico)
  const chartData = useMemo(() => {
    const data = units.map(unit => {
      const uTrips = trips.filter(t => t.unitId === unit.id);
      const uExpenses = expenses.filter(e => e.unitId === unit.id);
      const uFuel = fuel.filter(f => f.unitId === unit.id);

      const revenue = uTrips.reduce((sum, t) => sum + Number(t.value || 0), 0);
      const costs = uExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0) + uFuel.reduce((sum, f) => sum + Number(f.total || 0), 0);
      const net = revenue - costs;

      return { unit, revenue, costs, net };
    });
    return data.filter(d => !excludedUnits.has(d.unit.id));
  }, [units, trips, expenses, fuel, excludedUnits]);

  const maxMetric = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.max(...chartData.map(d => Math.max(d.revenue, d.costs)));
  }, [chartData]);

  // 3. Obtener últimos movimientos (Top 5)
  const recentTrips = [...trips].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5);
  const recentExpenses = [...expenses].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5);

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Desconocido';
  const getUnitName = (id: string) => units.find(u => u.id === id)?.name || 'Desconocida';

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutDashboard className="text-blue-600" /> Panel Principal
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Resumen global y análisis de rentabilidad operativa</p>
        </div>
      </div>

      {/* TARJETAS GLOBALES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4 p-5 shadow-sm border-l-4 border-emerald-500">
          <div className="p-3 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Facturación Total</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(globalRevenue)}</p>
          </div>
        </Card>
        
        <Card className="flex items-center gap-4 p-5 border-l-4 border-red-500 shadow-sm">
          <div className="p-3 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Costos Operativos</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">-{formatCurrency(globalExpenses)}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5 border-l-4 border-blue-500 shadow-sm">
          <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Balance Neto Global</p>
            <p className={`text-2xl font-bold ${globalNet >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600'}`}>
              {formatCurrency(globalNet)}
            </p>
          </div>
        </Card>
      </div>

      {/* GRÁFICO DE RENTABILIDAD */}
      <Card className="p-0 overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="text-blue-600" size={20} /> Rentabilidad por Vehículo
          </h3>
          <p className="text-sm text-slate-500 mt-1">Comparativa de Ingresos vs. Egresos. Haz clic en las unidades para filtrarlas.</p>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="flex items-center gap-2 mr-2 text-sm font-medium text-slate-600 dark:text-slate-400">
              <Filter size={16} /> Mostrar:
            </div>
            {units.map(unit => {
              const isExcluded = excludedUnits.has(unit.id);
              return (
                <button
                  key={unit.id}
                  onClick={() => toggleUnitFilter(unit.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${
                    !isExcluded 
                      ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' 
                      : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                  }`}
                >
                  {!isExcluded ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                  {unit.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5 space-y-6">
          {chartData.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No hay unidades seleccionadas.</div>
          ) : (
            chartData.map(data => {
              const revenuePct = maxMetric > 0 ? (data.revenue / maxMetric) * 100 : 0;
              const costsPct = maxMetric > 0 ? (data.costs / maxMetric) * 100 : 0;

              return (
                <div key={data.unit.id} className="relative">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{data.unit.name}</span>
                      <span className="text-xs text-slate-400 ml-2 font-mono">{data.unit.plate}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 mr-2">Resultado Neto:</span>
                      <span className={`font-black ${data.net >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrency(data.net)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="w-16 text-xs font-semibold text-slate-500 text-right">Ingresos</span>
                    <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-800 rounded-r-md overflow-hidden flex items-center">
                      <div className="h-full bg-emerald-500 transition-all duration-1000 ease-out rounded-r-md" style={{ width: `${revenuePct}%`, minWidth: data.revenue > 0 ? '4px' : '0' }} />
                    </div>
                    <span className="w-24 text-right text-xs font-bold text-emerald-600">{formatCurrency(data.revenue)}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="w-16 text-xs font-semibold text-slate-500 text-right">Egresos</span>
                    <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-800 rounded-r-md overflow-hidden flex items-center">
                      <div className="h-full bg-red-500 transition-all duration-1000 ease-out rounded-r-md" style={{ width: `${costsPct}%`, minWidth: data.costs > 0 ? '4px' : '0' }} />
                    </div>
                    <span className="w-24 text-right text-xs font-bold text-red-500">-{formatCurrency(data.costs)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* ACTIVIDAD RECIENTE (Tablas devueltas) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ÚLTIMOS VIAJES */}
        <Card className="p-0 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
            <Map className="text-emerald-500" size={20} />
            <h3 className="font-bold text-slate-900 dark:text-white">Últimos Viajes Registrados</h3>
          </div>
          <div className="p-0">
            {recentTrips.length > 0 ? (
              <table className="w-full text-sm text-left">
                <tbody>
                  {recentTrips.map(trip => (
                    <tr key={trip.id} className="border-b last:border-0 border-slate-100 dark:border-slate-800">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 dark:text-white">{getClientName(trip.clientId)}</p>
                        <p className="text-xs text-slate-500">{formatDate(trip.date)} | {getUnitName(trip.unitId)}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">
                        {formatCurrency(trip.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-slate-500 text-sm">No hay viajes recientes.</div>
            )}
          </div>
        </Card>

        {/* ÚLTIMOS GASTOS */}
        <Card className="p-0 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
            <Receipt className="text-red-500" size={20} />
            <h3 className="font-bold text-slate-900 dark:text-white">Últimos Gastos Registrados</h3>
          </div>
          <div className="p-0">
            {recentExpenses.length > 0 ? (
              <table className="w-full text-sm text-left">
                <tbody>
                  {recentExpenses.map(exp => (
                    <tr key={exp.id} className="border-b last:border-0 border-slate-100 dark:border-slate-800">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 dark:text-white capitalize">{exp.category}</p>
                        <p className="text-xs text-slate-500">{formatDate(exp.date)} | {getUnitName(exp.unitId)}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-red-500">
                        -{formatCurrency(exp.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-slate-500 text-sm">No hay gastos recientes.</div>
            )}
          </div>
        </Card>

      </div>

    </div>
  );
};
