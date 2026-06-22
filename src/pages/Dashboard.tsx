import React, { useState, useMemo } from 'react';
import { LayoutDashboard, TrendingUp, TrendingDown, Filter, DollarSign, Activity, CheckCircle2, Circle, Map, Receipt, Calendar, Database, Droplets, AlertTriangle, PieChart as PieChartIcon } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Trip, Expense, FuelLoad, TransportUnit, Client } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
  trips: Trip[];
  expenses: Expense[];
  fuel: FuelLoad[];
  units: TransportUnit[];
  clients: Client[];
}

export const DashboardView: React.FC<DashboardProps> = ({ trips, expenses, fuel, units, clients }) => {
  const [period, setPeriod] = useState<string>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [excludedUnits, setExcludedUnits] = useState<Set<string>>(new Set());

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val || 0);
  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString('es-AR', { timeZone: 'UTC' }); } catch { return dateStr; }
  };
  const formatNumber = (val: number) => new Intl.NumberFormat('es-AR').format(val || 0);

  const toggleUnitFilter = (unitId: string) => {
    setExcludedUnits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(unitId)) newSet.delete(unitId);
      else newSet.add(unitId);
      return newSet;
    });
  };

  const vehicles = units.filter(u => u.type !== 'tanque');
  const activeTanks = units.filter(u => u.type === 'tanque' && u.status === 'activo');

  const filterByDate = (itemDate: string) => {
    if (period === 'all') return true;
    const date = new Date(itemDate);
    const now = new Date();
    
    if (period === 'month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
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

  const filteredTrips = trips.filter(t => filterByDate(t.date));
  const filteredExpenses = expenses.filter(e => filterByDate(e.date));
  const filteredFuel = fuel.filter(f => filterByDate(f.date));

  const globalRevenue = filteredTrips.reduce((acc, t) => acc + Number(t.value || 0), 0);
  const globalExpenses = filteredExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0) + filteredFuel.reduce((acc, f) => acc + Number(f.total || 0), 0);
  const globalNet = globalRevenue - globalExpenses;

  const barChartData = useMemo(() => {
    const data = vehicles.map(unit => {
      const uTrips = filteredTrips.filter(t => t.unitId === unit.id);
      const uExpenses = filteredExpenses.filter(e => e.unitId === unit.id);
      const uFuel = filteredFuel.filter(f => f.unitId === unit.id);

      const Ingresos = uTrips.reduce((sum, t) => sum + Number(t.value || 0), 0);
      const Egresos = uExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0) + uFuel.reduce((sum, f) => sum + Number(f.total || 0), 0);

      return { id: unit.id, name: unit.name, Ingresos, Egresos };
    });
    return data.filter(d => !excludedUnits.has(d.id));
  }, [vehicles, filteredTrips, filteredExpenses, filteredFuel, excludedUnits]);

  const pieChartData = useMemo(() => {
    let totalFuel = filteredFuel.reduce((sum, f) => sum + Number(f.total || 0), 0);
    let expGroup = filteredExpenses.reduce((acc, curr) => {
      const cat = curr.category || 'otros';
      acc[cat] = (acc[cat] || 0) + Number(curr.amount);
      return acc;
    }, {} as Record<string, number>);

    const data = Object.keys(expGroup).map(k => ({ 
      name: k.charAt(0).toUpperCase() + k.slice(1), 
      value: expGroup[k] 
    }));
    
    if (totalFuel > 0) data.push({ name: 'Combustible', value: totalFuel });
    return data.sort((a,b) => b.value - a.value);
  }, [filteredExpenses, filteredFuel]);

  const COLORS = ['#f97316', '#ef4444', '#3b82f6', '#8b5cf6', '#10b981', '#64748b', '#ec4899'];

  const recentTrips = [...filteredTrips].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5);
  const recentExpenses = [...filteredExpenses].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5);

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Desconocido';
  const getUnitName = (id: string) => units.find(u => u.id === id)?.name || 'Desconocida';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
          {label && <p className="font-bold text-slate-900 dark:text-white mb-2">{label}</p>}
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutDashboard className="text-blue-600" /> Panel Principal
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Resumen operativo y análisis gráfico del período</p>
        </div>

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
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 outline-none" />
              <span className="text-slate-400">-</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 outline-none" />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4 p-5 shadow-sm border-l-4 border-emerald-500">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg"><TrendingUp size={24} /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Facturación Total</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(globalRevenue)}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 shadow-sm border-l-4 border-red-500">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg"><TrendingDown size={24} /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Costos Operativos</p>
            <p className="text-2xl font-bold text-red-600">-{formatCurrency(globalExpenses)}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5 shadow-sm border-l-4 border-blue-500">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><DollarSign size={24} /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Balance Neto</p>
            <p className={`text-2xl font-bold ${globalNet >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(globalNet)}</p>
          </div>
        </Card>
      </div>

      {activeTanks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Database className="text-orange-500" size={20} /> Estado de Tanques Propios
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTanks.map(tank => {
              const capacity = tank.fuelCapacity || 1;
              const current = tank.currentFuel || 0;
              const pct = Math.min(100, Math.max(0, (current / capacity) * 100));
              const alertPct = tank.fuelAlertPercentage || 15;
              const isLow = pct <= alertPct;

              return (
                <Card key={tank.id} className={`p-5 border-l-4 shadow-sm ${isLow ? 'border-red-500 bg-red-50/30 dark:bg-red-900/10' : 'border-orange-500'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Droplets size={18} className={isLow ? 'text-red-500' : 'text-orange-500'} /> {tank.name}
                    </h4>
                    <span className="text-xs font-mono text-slate-500">{tank.plate}</span>
                  </div>
                  
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-semibold text-slate-500">Stock Actual</span>
                    <span className={`text-sm font-black ${isLow ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                      {formatNumber(current)} / {formatNumber(capacity)} Lts
                    </span>
                  </div>
                  
                  <div className="w-full h-5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative border border-slate-300 dark:border-slate-600 shadow-inner">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out ${isLow ? 'bg-red-500' : 'bg-gradient-to-r from-orange-400 to-orange-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                    <div className="absolute top-0 bottom-0 w-0.5 bg-red-600 z-10" style={{ left: `${alertPct}%` }} title={`Alerta al ${alertPct}%`} />
                  </div>
                  {isLow && (
                    <p className="text-xs text-red-600 font-bold flex items-center gap-1 mt-2 animate-pulse">
                      <AlertTriangle size={14} /> Nivel Crítico. Se requiere reabastecimiento.
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-0 overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="text-blue-600" size={20} /> Ingresos vs Egresos por Vehículo
            </h3>
            
            <div className="mt-4 flex flex-wrap gap-2">
              <div className="flex items-center gap-2 mr-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                <Filter size={16} /> Mostrar:
              </div>
              {vehicles.map(unit => {
                const isExcluded = excludedUnits.has(unit.id);
                return (
                  <button
                    key={unit.id}
                    onClick={() => toggleUnitFilter(unit.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${
                      !isExcluded 
                        ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400' 
                        : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800'
                    }`}
                  >
                    {!isExcluded ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                    {unit.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="p-5 h-80 w-full flex-1">
            {barChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500">No hay datos para mostrar.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(val: number) => `$${(val / 1000)}k`} 
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  <Bar dataKey="Egresos" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-0 overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChartIcon className="text-orange-500" size={20} /> Origen de Egresos
            </h3>
          </div>
          <div className="p-5 h-80 w-full flex-1">
            {pieChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500">Sin gastos registrados.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieChartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    formatter={(value: string) => <span className="text-xs text-slate-600 dark:text-slate-300">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-0 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
            <Map className="text-emerald-500" size={20} />
            <h3 className="font-bold text-slate-900">Viajes del Período</h3>
          </div>
          <div className="p-0">
            {recentTrips.length > 0 ? (
              <table className="w-full text-sm text-left">
                <tbody>
                  {recentTrips.map(trip => (
                    <tr key={trip.id} className="border-b last:border-0 border-slate-100">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{getClientName(trip.clientId)}</p>
                        <p className="text-xs text-slate-500">{formatDate(trip.date)} | {getUnitName(trip.unitId)}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatCurrency(trip.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="p-6 text-center text-slate-500 text-sm">No hay viajes recientes.</div>}
          </div>
        </Card>

        <Card className="p-0 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
            <Receipt className="text-red-500" size={20} />
            <h3 className="font-bold text-slate-900">Gastos del Período</h3>
          </div>
          <div className="p-0">
            {recentExpenses.length > 0 ? (
              <table className="w-full text-sm text-left">
                <tbody>
                  {recentExpenses.map(exp => (
                    <tr key={exp.id} className="border-b last:border-0 border-slate-100">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 capitalize">{exp.category}</p>
                        <p className="text-xs text-slate-500">{formatDate(exp.date)} | {getUnitName(exp.unitId)}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-red-500">-{formatCurrency(exp.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="p-6 text-center text-slate-500 text-sm">No hay gastos recientes.</div>}
          </div>
        </Card>
      </div>

    </div>
  );
};
