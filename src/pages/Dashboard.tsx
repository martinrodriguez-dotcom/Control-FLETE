import React, { useState, useMemo } from 'react';
import { LayoutDashboard, TrendingUp, TrendingDown, Filter, DollarSign, Activity, CheckCircle2, Circle, Map, Receipt, Calendar } from 'lucide-react';
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
  // --- ESTADOS ---
  // 1. Filtro de Fechas (Recuperado)
  const [period, setPeriod] = useState<string>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 2. Filtro del Gráfico
  const [excludedUnits, setExcludedUnits] = useState<Set<string>>(new Set());

  // --- UTILIDADES ---
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

  // --- LÓGICA DE FILTRADO DE FECHAS ---
  const filterByDate = (itemDate: string) => {
    if (period === 'all') return true;
    
    const date = new Date(itemDate);
    const now = new Date();
    
    if (period === 'month') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    if (period === 'last_month') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
    }
    if (period === 'custom' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return date >= start && date <= end;
    }
    return true;
  };

  // Aplicar filtro a todos los datos
  const filteredTrips = trips.filter(t => filterByDate(t.date));
  const filteredExpenses = expenses.filter(e => filterByDate(e.date));
  const filteredFuel = fuel.filter(f => filterByDate(f.date));

  // --- CÁLCULOS GLOBALES (Basados en las fechas filtradas) ---
  const globalRevenue = filteredTrips.reduce((acc, t) => acc + Number(t.value || 0), 0);
  const globalExpenses = filteredExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0) + filteredFuel.reduce((acc, f) => acc + Number(f.total || 0), 0);
  const globalNet = globalRevenue - globalExpenses;

  // --- CÁLCULOS DEL GRÁFICO ---
  const chartData = useMemo(() => {
    const data = units.map(unit => {
      const uTrips = filteredTrips.filter(t => t.unitId === unit.id);
      const uExpenses = filteredExpenses.filter(e => e.unitId === unit.id);
      const uFuel = filteredFuel.filter(f => f.unitId === unit.id);

      const revenue = uTrips.reduce((sum, t) => sum + Number(t.value || 0), 0);
      const costs = uExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0) + uFuel.reduce((sum, f) => sum + Number(f.total || 0), 0);
      const net = revenue - costs;

      return { unit, revenue, costs, net };
    });
    return data.filter(d => !excludedUnits.has(d.unit.id));
  }, [units, filteredTrips, filteredExpenses, filteredFuel, excludedUnits]);

  const maxMetric = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.max(...chartData.map(d => Math.max(d.revenue, d.costs)));
  }, [chartData]);

  // --- DATOS RECIENTES (Tablas) ---
  const recentTrips = [...filteredTrips].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5);
  const recentExpenses = [...filteredExpenses].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5);

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Desconocido';
  const getUnitName = (id: string) => units.find(u => u.id === id)?.name || 'Desconocida';

  return (
    <div className="space-y-6">
      
      {/* CABECERA Y FILTRO DE FECHAS (Recuperado) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutDashboard className="text-blue-600" /> Panel Principal
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Resumen operativo según período seleccionado</p>
        </div>

        {/* SELECTOR DE PERÍODO */}
        <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap gap-2 items-center w-full sm:w-auto">
          <Calendar size={18} className="text-slate-400 ml-2" />
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-transparent border-none text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer outline-none"
          >
            <option value="month">Este Mes</option>
            <option value="last_month">Mes Pasado</option>
            <option value="all">Todo el Historial</option>
            <option value="custom">Personalizado</option>
          </select>

          {period === 'custom' && (
            <div className="flex items-center gap-2 px-2 border-l border-slate-200 dark:border-slate-700 ml-2">
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 outline-none dark:color-scheme-dark"
              />
              <span className="text-slate-400">-</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 outline-none dark:color-scheme-dark"
              />
            </div>
          )}
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
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Balance Neto</p>
            <p className={`text-2xl font-bold ${globalNet >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600'}`}>
              {formatCurrency(globalNet)}
            </p>
          </div>
        </Card>
      </div>

      {/* GRÁFICO DE RENTABILIDAD INTEGRAD0 */}
      <Card className="p-0 overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="text-blue-600" size={20} /> Rentabilidad por Vehículo
          </h3>
          <p className="text-sm text-slate-500 mt-1">Comparativa de Ingresos vs. Egresos en el período seleccionado. Clickea para excluir unidades.</p>
          
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
            <div className="text-center py-8 text-slate-500">No hay datos o unidades para mostrar en este período.</div>
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

      {/* ACTIVIDAD RECIENTE (TABLAS RECUPERADAS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ÚLTIMOS VIAJES */}
        <Card className="p-0 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
            <Map className="text-emerald-500" size={20} />
            <h3 className="font-bold text-slate-900 dark:text-white">Viajes del Período</h3>
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
              <div className="p-6 text-center text-slate-500 text-sm">No hay viajes en este período.</div>
            )}
          </div>
        </Card>

        {/* ÚLTIMOS GASTOS */}
        <Card className="p-0 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
            <Receipt className="text-red-500" size={20} />
            <h3 className="font-bold text-slate-900 dark:text-white">Gastos del Período</h3>
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
              <div className="p-6 text-center text-slate-500 text-sm">No hay gastos en este período.</div>
            )}
          </div>
        </Card>

      </div>

    </div>
  );
};
