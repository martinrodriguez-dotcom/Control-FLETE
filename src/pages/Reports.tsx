import React, { useState } from 'react';
import { 
  PieChart, TrendingUp, TrendingDown, Truck, ChevronDown, ChevronUp, 
  Droplets, Receipt, Settings, Map, Activity, DollarSign, BarChart3, ChevronRight, Calendar, Printer, ArrowLeft 
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TransportUnit, Trip, Expense, FuelLoad, ServiceRecord } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

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
  const [selectedUnit, setSelectedUnit] = useState<TransportUnit | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  const [period, setPeriod] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val || 0);
  const formatNumber = (val: number) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(val || 0);
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try { return new Date(dateStr).toLocaleDateString('es-AR', { timeZone: 'UTC' }); } catch { return dateStr; }
  };

  const filterByDate = (itemDate: string) => {
    if (period === 'all') return true;
    if (!itemDate) return false;
    
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

  const globalRevenue = filteredTrips.reduce((sum, t) => sum + Number(t.value || 0), 0);
  const globalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const globalFuelCost = filteredFuel.reduce((sum, f) => sum + Number(f.total || 0), 0);
  const globalTotalCosts = globalExpenses + globalFuelCost;
  const globalNetProfit = globalRevenue - globalTotalCosts;

  const getUnitDetails = (unitId: string) => {
    const uTrips = filteredTrips.filter(t => t.unitId === unitId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const uExpenses = filteredExpenses.filter(e => e.unitId === unitId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const uFuel = filteredFuel.filter(f => f.unitId === unitId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const uServices = services.filter(s => s.unitId === unitId && s.type === 'service').sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));

    const totalKm = uTrips.reduce((sum, t) => sum + Number(t.km || 0), 0);
    const uRevenue = uTrips.reduce((sum, t) => sum + Number(t.value || 0), 0);
    const uExpTotal = uExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const uFuelTotal = uFuel.reduce((sum, f) => sum + Number(f.total || 0), 0);
    const uFuelLiters = uFuel.reduce((sum, f) => sum + Number(f.liters || 0), 0);
    
    const uTotalCosts = uExpTotal + uFuelTotal;
    const uNet = uRevenue - uTotalCosts;
    
    // NUEVO CÁLCULO: Litros cada 100km
    const litersPer100Km = totalKm > 0 ? (uFuelLiters / totalKm) * 100 : 0;
    
    const costPerKm = totalKm > 0 ? (uTotalCosts / totalKm) : 0;
    const lastService = uServices.length > 0 ? uServices[0] : null;

    const expensesByCategory = uExpenses.reduce((acc, curr) => {
      const cat = curr.category || 'otros';
      if (!acc[cat]) acc[cat] = { total: 0, items: [] };
      acc[cat].total += Number(curr.amount);
      acc[cat].items.push(curr);
      return acc;
    }, {} as Record<string, { total: number, items: Expense[] }>);

    type ChartItem = { dateLabel: string, Ingresos: number, Egresos: number, rawDate: string };
    const chartDataObj: Record<string, ChartItem> = {};

    const processChartItem = (dateStr: string, ing: number, eg: number) => {
      if (!dateStr) return;
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return;
        
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        
        if (!chartDataObj[monthKey]) {
          const monthName = d.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
          chartDataObj[monthKey] = { 
            dateLabel: monthName.charAt(0).toUpperCase() + monthName.slice(1), 
            rawDate: monthKey, 
            Ingresos: 0, 
            Egresos: 0 
          };
        }
        
        chartDataObj[monthKey].Ingresos += ing;
        chartDataObj[monthKey].Egresos += eg;
      } catch (e) { /* ignorar fechas mal formadas */ }
    };

    uTrips.forEach(t => processChartItem(t.date, Number(t.value || 0), 0));
    uExpenses.forEach(e => processChartItem(e.date, 0, Number(e.amount || 0)));
    uFuel.forEach(f => processChartItem(f.date, 0, Number(f.total || 0)));

    const timeSeriesData = Object.values(chartDataObj).sort((a: ChartItem, b: ChartItem) => a.rawDate.localeCompare(b.rawDate));

    return { uTrips, uFuel, uRevenue, uFuelTotal, uTotalCosts, uNet, totalKm, litersPer100Km, costPerKm, lastService, expensesByCategory, timeSeriesData };
  };

  const vehicles = units.filter(u => u.type !== 'tanque');

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="font-bold text-slate-900 dark:text-white mb-2 capitalize">{label}</p>
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

  // ============================================================================
  // VISTA 1: PANEL GLOBAL DE REPORTES
  // ============================================================================
  if (!selectedUnit) {
    return (
      <div className="space-y-6 print:m-0 print:p-0 animate-in fade-in slide-in-from-left-4 duration-300">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="text-blue-600" /> Reportes Analíticos
            </h2>
            <p className="text-slate-500 dark:text-slate-400">Análisis detallado de rendimiento por vehículo</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap gap-2 items-center w-full sm:w-auto">
            <Calendar size={18} className="text-slate-400 ml-2" />
            <select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent border-none text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer outline-none"
            >
              <option value="all">Todo el Historial</option>
              <option value="month">Este Mes</option>
              <option value="last_month">Mes Pasado</option>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
          <Card className="p-4 border-l-4 border-emerald-500 shadow-sm">
            <p className="text-sm font-medium text-slate-500 flex items-center gap-2"><TrendingUp size={16}/> Ingresos Totales</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(globalRevenue)}</p>
          </Card>
          <Card className="p-4 border-l-4 border-red-500 shadow-sm">
            <p className="text-sm font-medium text-slate-500 flex items-center gap-2"><TrendingDown size={16}/> Costos Operativos</p>
            <p className="text-2xl font-bold text-red-600 mt-1">-{formatCurrency(globalTotalCosts)}</p>
          </Card>
          <Card className="p-4 border-l-4 border-blue-500 shadow-sm">
            <p className="text-sm font-medium text-slate-500 flex items-center gap-2"><PieChart size={16}/> Rentabilidad Neta</p>
            <p className={`text-2xl font-bold mt-1 ${globalNetProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(globalNetProfit)}
            </p>
          </Card>
          <Card className="p-4 border-l-4 border-orange-500 shadow-sm bg-orange-50/50 dark:bg-orange-900/10">
            <p className="text-sm font-medium text-slate-500 flex items-center gap-2"><Activity size={16}/> Margen de Ganancia</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">
              {globalRevenue > 0 ? formatNumber((globalNetProfit / globalRevenue) * 100) : 0}%
            </p>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 print:hidden">
          {vehicles.map(unit => {
            const uTrips = filteredTrips.filter(t => t.unitId === unit.id);
            const uExpenses = filteredExpenses.filter(e => e.unitId === unit.id);
            const uFuel = filteredFuel.filter(f => f.unitId === unit.id);

            const uRevenue = uTrips.reduce((sum, t) => sum + Number(t.value || 0), 0);
            const uTotalCosts = uExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0) + uFuel.reduce((sum, f) => sum + Number(f.total || 0), 0);
            const uNet = uRevenue - uTotalCosts;

            return (
              <div key={unit.id} onClick={() => { setSelectedUnit(unit); setExpandedCategories({}); }} className="cursor-pointer group">
                <Card className={`p-5 hover:shadow-lg transition-all duration-200 h-full border-l-4 ${uNet >= 0 ? 'border-emerald-500' : 'border-red-500'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${uNet >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-red-50 text-red-600 dark:bg-red-900/30'}`}>
                        <Truck size={28} />
                      </div>
                      <div>
                        <h3 className="font-black text-xl text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{unit.name}</h3>
                        <p className="text-sm font-medium text-slate-500">{unit.plate}</p>
                      </div>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">Balance Neto Periodo:</span>
                      <span className={`font-black text-xl ${uNet >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(uNet)}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
          {vehicles.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              No hay vehículos registrados para analizar.
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // VISTA 2: DETALLE COMPLETO DEL VEHÍCULO SELECCIONADO
  // ============================================================================
  const details = getUnitDetails(selectedUnit.id);

  return (
    <div className="space-y-6 print:m-0 print:p-0 animate-in fade-in slide-in-from-right-4 duration-300" id="printable-report">
      
      {/* BARRA DE NAVEGACIÓN Y ACCIONES */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedUnit(null)} 
            className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg transition-colors flex items-center gap-2 font-semibold text-sm"
          >
            <ArrowLeft size={18} /> Volver
          </button>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="text-blue-600" /> {selectedUnit.name}
            </h2>
            <p className="text-sm text-slate-500 font-medium">Patente: {selectedUnit.plate}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="text-right hidden md:block mr-2">
            <p className="text-[10px] uppercase font-bold text-slate-400">Filtro Activo</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {period === 'all' ? 'Historial Completo' : period === 'month' ? 'Mes Actual' : period === 'last_month' ? 'Mes Pasado' : 'Período Personalizado'}
            </p>
          </div>
          <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto" icon={Printer}>
            Imprimir Reporte
          </Button>
        </div>
      </div>

      {/* CABECERA EXCLUSIVA PARA PDF */}
      <div className="hidden print:block text-center mb-6 pb-4 border-b-2 border-slate-200">
        <h1 className="text-3xl font-black text-slate-900">REPORTE OPERATIVO Y FINANCIERO</h1>
        <h2 className="text-xl text-slate-700 mt-1">{selectedUnit.name} - Patente: {selectedUnit.plate}</h2>
        <p className="text-sm text-slate-500 mt-2">Generado por el Sistema Logístico SII PALLETS FLETE</p>
      </div>

      {/* KPI GRID - SE MANTIENEN EN FILA AL IMPRIMIR (print:grid-cols-4) */}
      <div className="grid grid-cols-2 md:grid-cols-4 print:grid-cols-4 gap-4">
        <Card className="p-5 border-t-4 border-emerald-500 shadow-sm bg-white dark:bg-slate-800">
          <p className="text-xs uppercase font-bold text-slate-400 mb-1">Ingresos Facturados</p>
          <p className="text-2xl font-black text-emerald-600">{formatCurrency(details.uRevenue)}</p>
        </Card>
        <Card className="p-5 border-t-4 border-red-500 shadow-sm bg-white dark:bg-slate-800">
          <p className="text-xs uppercase font-bold text-slate-400 mb-1">Egresos Totales</p>
          <p className="text-2xl font-black text-red-500">-{formatCurrency(details.uTotalCosts)}</p>
        </Card>
        <Card className="p-5 border-t-4 border-blue-500 shadow-sm bg-blue-50/30 dark:bg-blue-900/10">
          <p className="text-xs uppercase font-bold text-slate-400 mb-1">Resultado Neto</p>
          <p className={`text-3xl font-black ${details.uNet >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(details.uNet)}</p>
        </Card>
        <Card className="p-5 border-t-4 border-orange-500 shadow-sm bg-white dark:bg-slate-800">
          <p className="text-xs uppercase font-bold text-slate-400 mb-1">Margen</p>
          <p className="text-2xl font-black text-orange-600">
            {details.uRevenue > 0 ? formatNumber((details.uNet / details.uRevenue) * 100) : 0}%
          </p>
        </Card>
      </div>

      {/* KPI SECUNDARIOS TÉCNICOS */}
      <div className="grid grid-cols-2 md:grid-cols-4 print:grid-cols-4 gap-4">
        <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2 text-slate-500"><Map size={16}/> <span className="text-sm font-semibold">KM en Viajes</span></div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{formatNumber(details.totalKm)} <span className="text-sm font-normal text-slate-400">km</span></p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2 text-slate-500"><Droplets size={16}/> <span className="text-sm font-semibold">Consumo c/ 100km</span></div>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatNumber(details.litersPer100Km)} <span className="text-sm font-normal text-slate-400">L/100km</span></p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2 text-slate-500"><DollarSign size={16}/> <span className="text-sm font-semibold">Costo x KM</span></div>
          <p className="text-xl font-bold text-red-500">{formatCurrency(details.costPerKm)}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2 text-slate-500"><Settings size={16}/> <span className="text-sm font-semibold">Último Service</span></div>
          {details.lastService ? (
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatNumber(details.lastService.currentKmOrHours)} <span className="text-sm font-normal text-slate-400">km/hs</span></p>
          ) : (
            <p className="text-lg font-bold text-slate-400">Sin registros</p>
          )}
        </div>
      </div>

      {/* GRÁFICO DE EVOLUCIÓN TEMPORAL - AHORA SE IMPRIME TAMBIÉN */}
      <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm print:shadow-none print:border-0 print:mb-6">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center print:bg-transparent print:border-b-2">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Activity size={20} className="text-blue-500" /> Historial de Evolución Financiera Mensual
          </h4>
        </div>
        <div style={{ height: '350px' }} className="w-full p-4 pt-6">
          {details.timeSeriesData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400">No hay datos suficientes para graficar en este período.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={details.timeSeriesData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.4} />
                <XAxis dataKey="dateLabel" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} tickLine={false} axisLine={false} dy={10} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} tickLine={false} axisLine={false} tickFormatter={(val: number) => `$${(val / 1000)}k`} width={60} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 600, paddingBottom: '10px' }} />
                <Line type="monotone" name="Ingresos" dataKey="Ingresos" stroke="#10b981" strokeWidth={4} dot={{ r: 5, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 8 }} />
                <Line type="monotone" name="Egresos" dataKey="Egresos" stroke="#ef4444" strokeWidth={4} dot={{ r: 5, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* DESGLOSE EN TABLAS (ACORDEONES QUE SE DESPLIEGAN SOLOS EN LA IMPRESIÓN) */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">Desglose Operativo Detallado</h3>

        {/* VIAJES */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-800/50 overflow-hidden print:border-none print:shadow-none print:break-inside-avoid">
          <button onClick={() => toggleCategory(`trips`)} className="w-full flex justify-between items-center p-4 bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-50 transition-colors outline-none print:bg-transparent print:p-0 print:mb-2">
            <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400 font-bold text-base">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-800/50 rounded-lg print:hidden"><Map size={20} /></div>
              <span>Facturación de Viajes ({details.uTrips.length})</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-black text-lg text-emerald-600">{formatCurrency(details.uRevenue)}</span>
              <span className="print:hidden text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 p-1 rounded-md">
                {expandedCategories[`trips`] ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
              </span>
            </div>
          </button>
          <div className={`${expandedCategories[`trips`] ? 'block' : 'hidden'} print:block p-4 border-t border-emerald-100 dark:border-emerald-800/50 print:border-t-2 print:border-emerald-500 print:p-0 print:pt-2`}>
            {details.uTrips.length === 0 ? <p className="text-sm text-slate-500 py-4 text-center bg-slate-50 dark:bg-slate-800/50 rounded-lg">No hay viajes registrados.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400 print:text-black">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 print:bg-transparent">
                    <tr>
                      <th className="px-4 py-3 font-semibold rounded-tl-lg">Fecha</th>
                      <th className="px-4 py-3 font-semibold">Ruta (Origen → Destino)</th>
                      <th className="px-4 py-3 font-semibold text-right">Recorrido</th>
                      <th className="px-4 py-3 font-semibold text-right rounded-tr-lg">Facturado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.uTrips.map(t => (
                      <tr key={t.id} className="border-b last:border-0 border-slate-100 dark:border-slate-700 print:border-b-slate-300">
                        <td className="px-4 py-3 font-medium">{formatDate(t.date)}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-900 dark:text-white print:text-black">{t.origin}</span> → <span className="font-semibold text-slate-900 dark:text-white print:text-black">{t.destination}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs">{t.km || 0} km</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white print:text-black">{formatCurrency(t.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* COMBUSTIBLE */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-orange-200 dark:border-orange-800/50 overflow-hidden print:border-none print:shadow-none print:mt-6 print:break-inside-avoid">
          <button onClick={() => toggleCategory(`fuel`)} className="w-full flex justify-between items-center p-4 bg-orange-50/50 dark:bg-orange-900/10 hover:bg-orange-50 transition-colors outline-none print:bg-transparent print:p-0 print:mb-2">
            <div className="flex items-center gap-3 text-orange-700 dark:text-orange-400 font-bold text-base">
              <div className="p-2 bg-orange-100 dark:bg-orange-800/50 rounded-lg print:hidden"><Droplets size={20} /></div>
              <span>Consumo de Combustible ({details.uFuel.length})</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-black text-lg text-orange-600">-{formatCurrency(details.uFuelTotal)}</span>
              <span className="print:hidden text-orange-400 bg-orange-100 dark:bg-orange-900/50 p-1 rounded-md">
                {expandedCategories[`fuel`] ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
              </span>
            </div>
          </button>
          <div className={`${expandedCategories[`fuel`] ? 'block' : 'hidden'} print:block p-4 border-t border-orange-100 dark:border-orange-800/50 print:border-t-2 print:border-orange-500 print:p-0 print:pt-2`}>
            {details.uFuel.length === 0 ? <p className="text-sm text-slate-500 py-4 text-center bg-slate-50 dark:bg-slate-800/50 rounded-lg">No hay cargas registradas.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400 print:text-black">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 print:bg-transparent">
                    <tr>
                      <th className="px-4 py-3 font-semibold rounded-tl-lg">Fecha</th>
                      <th className="px-4 py-3 font-semibold">Litros</th>
                      <th className="px-4 py-3 font-semibold">Origen / Estación</th>
                      <th className="px-4 py-3 font-semibold text-right rounded-tr-lg">Costo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.uFuel.map(f => (
                      <tr key={f.id} className="border-b last:border-0 border-slate-100 dark:border-slate-700 print:border-b-slate-300">
                        <td className="px-4 py-3 font-medium">{formatDate(f.date)}</td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white print:text-black">{f.liters} Lts</td>
                        <td className="px-4 py-3">{f.station}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white print:text-black">{formatCurrency(f.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* GASTOS DINÁMICOS */}
        {Object.entries(details.expensesByCategory).map(([category, data]) => (
          <div key={category} className="bg-white dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-800/50 overflow-hidden print:border-none print:shadow-none print:mt-6 print:break-inside-avoid">
            <button onClick={() => toggleCategory(`exp-${category}`)} className="w-full flex justify-between items-center p-4 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 transition-colors outline-none print:bg-transparent print:p-0 print:mb-2">
              <div className="flex items-center gap-3 text-red-700 dark:text-red-400 font-bold text-base capitalize">
                <div className="p-2 bg-red-100 dark:bg-red-800/50 rounded-lg print:hidden"><Receipt size={20} /></div>
                <span>Gastos de {category} ({data.items.length})</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-black text-lg text-red-600">-{formatCurrency(data.total)}</span>
                <span className="print:hidden text-red-400 bg-red-100 dark:bg-red-900/50 p-1 rounded-md">
                  {expandedCategories[`exp-${category}`] ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                </span>
              </div>
            </button>
            <div className={`${expandedCategories[`exp-${category}`] ? 'block' : 'hidden'} print:block p-4 border-t border-red-100 dark:border-red-800/50 print:border-t-2 print:border-red-500 print:p-0 print:pt-2`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400 print:text-black">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 print:bg-transparent">
                    <tr>
                      <th className="px-4 py-3 font-semibold rounded-tl-lg">Fecha</th>
                      <th className="px-4 py-3 font-semibold">Descripción del Gasto</th>
                      <th className="px-4 py-3 font-semibold text-right rounded-tr-lg">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map(e => (
                      <tr key={e.id} className="border-b last:border-0 border-slate-100 dark:border-slate-700 print:border-b-slate-300">
                        <td className="px-4 py-3 font-medium">{formatDate(e.date)}</td>
                        <td className="px-4 py-3">{e.description}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white print:text-black">{formatCurrency(e.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
};
