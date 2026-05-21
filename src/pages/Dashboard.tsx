import React from 'react';
import { 
  TrendingUp, TrendingDown, AlertCircle, Truck, Map, 
  Receipt, Clock, DollarSign, Activity, PieChart
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Trip, Expense, FuelLoad, TransportUnit, Client } from '../types';

interface DashboardProps {
  trips: Trip[];
  expenses: Expense[];
  fuel: FuelLoad[];
  units: TransportUnit[];
  clients?: Client[]; // Lo hacemos opcional por si aún no lo pasaste desde App.tsx
}

export const DashboardView: React.FC<DashboardProps> = ({ trips, expenses, fuel, units, clients = [] }) => {
  // Utilidades de formato
  const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-AR', { timeZone: 'UTC' });

  // Lógica de fechas (Mes actual y Mes anterior usando YYYY-MM para evitar problemas de zona horaria)
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  let lastMonthYear = now.getFullYear();
  let lastMonth = now.getMonth();
  if (lastMonth === 0) { lastMonth = 12; lastMonthYear -= 1; }
  const lastMonthStr = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}`;

  // Filtros de datos por mes
  const currentTrips = trips.filter(t => t.date.startsWith(currentMonthStr));
  const currentExpenses = expenses.filter(e => e.date.startsWith(currentMonthStr));
  const currentFuel = fuel.filter(f => f.date.startsWith(currentMonthStr));

  const lastTrips = trips.filter(t => t.date.startsWith(lastMonthStr));
  const lastExpenses = expenses.filter(e => e.date.startsWith(lastMonthStr));
  const lastFuel = fuel.filter(f => f.date.startsWith(lastMonthStr));

  // Cálculos Mes Actual
  const currentRevenue = currentTrips.reduce((acc, t) => acc + Number(t.value), 0);
  const currentExpTotal = currentExpenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const currentFuelTotal = currentFuel.reduce((acc, f) => acc + Number(f.total), 0);
  const currentNetProfit = currentRevenue - currentExpTotal - currentFuelTotal;

  // Cálculos Mes Anterior
  const lastRevenue = lastTrips.reduce((acc, t) => acc + Number(t.value), 0);
  const lastExpTotal = lastExpenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const lastFuelTotal = lastFuel.reduce((acc, f) => acc + Number(f.total), 0);
  const lastNetProfit = lastRevenue - lastExpTotal - lastFuelTotal;

  // Función para calcular tendencia (porcentaje de crecimiento)
  const calculateTrend = (current: number, last: number) => {
    if (last === 0) return current > 0 ? 100 : 0;
    return ((current - last) / last) * 100;
  };

  const revenueTrend = calculateTrend(currentRevenue, lastRevenue);
  const netProfitTrend = calculateTrend(currentNetProfit, lastNetProfit);

  // Top 3 Unidades del mes actual
  const topUnits = units.map(u => {
    const uTrips = currentTrips.filter(t => t.unitId === u.id).reduce((sum, t) => sum + Number(t.value), 0);
    const uExp = currentExpenses.filter(e => e.unitId === u.id).reduce((sum, e) => sum + Number(e.amount), 0);
    const uFuel = currentFuel.filter(f => f.unitId === u.id).reduce((sum, f) => sum + Number(f.total), 0);
    return { ...u, netProfit: uTrips - uExp - uFuel, revenue: uTrips };
  }).filter(u => u.revenue > 0) // Solo mostrar las que trabajaron
    .sort((a, b) => b.netProfit - a.netProfit)
    .slice(0, 3);

  // Distribución de Gastos (Mes Actual)
  const expenseCategories = currentExpenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount);
    return acc;
  }, {} as Record<string, number>);
  const sortedCategories = Object.entries(expenseCategories).sort((a, b) => b[1] - a[1]);

  // Alertas: Seguros y Cobros Pendientes
  const pendingTrips = trips.filter(t => t.paymentStatus === 'pendiente');
  const pendingTotal = pendingTrips.reduce((sum, t) => sum + Number(t.value), 0);
  
  const expiringInsurance = units.filter(u => {
    if (u.status !== 'activo' || !u.insuranceExpiry) return false;
    const [y, m, d] = u.insuranceExpiry.split('-');
    const exp = new Date(Number(y), Number(m) - 1, Number(d));
    const diff = exp.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days >= -30 && days <= 30; 
  });

  // Últimos 5 viajes históricos
  const recentTrips = [...trips].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  // Componente visual para la tendencia (Flecha verde/roja)
  const TrendIndicator = ({ value, invertColors = false }: { value: number, invertColors?: boolean }) => {
    const isPositive = value >= 0;
    // Si invertimos colores (ej. para gastos, donde + es malo), cambiamos la lógica de color
    const isGood = invertColors ? !isPositive : isPositive; 
    if (value === 0) return <span className="text-slate-400 text-xs ml-2 font-normal">Igual al mes pasado</span>;
    
    return (
      <span className={`text-xs ml-2 font-medium flex items-center inline-flex ${isGood ? 'text-emerald-500' : 'text-red-500'}`}>
        {isPositive ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
        {Math.abs(value).toFixed(1)}% vs anterior
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-600/20">
          <Activity size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Panel de Control Operativo</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Resumen en tiempo real del mes de <strong>{now.toLocaleString('es', { month: 'long' })}</strong>
          </p>
        </div>
      </div>

      {/* TARJETAS PRINCIPALES (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="text-slate-500 text-sm font-medium">Facturación Bruta</div>
            <DollarSign size={16} className="text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{formatCurrency(currentRevenue)}</div>
          <div className="mt-2"><TrendIndicator value={revenueTrend} /></div>
        </Card>
        
        <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="text-slate-500 text-sm font-medium">Gastos Operativos</div>
            <Receipt size={16} className="text-red-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{formatCurrency(currentExpTotal)}</div>
          <div className="mt-2"><TrendIndicator value={calculateTrend(currentExpTotal, lastExpTotal)} invertColors /></div>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="text-slate-500 text-sm font-medium">Combustible</div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{formatCurrency(currentFuelTotal)}</div>
          </div>
          <div className="mt-2"><TrendIndicator value={calculateTrend(currentFuelTotal, lastFuelTotal)} invertColors /></div>
        </Card>
        
        <Card className={`border-l-4 ${currentNetProfit >= 0 ? 'border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-l-red-500 bg-red-50/30 dark:bg-red-900/10'} hover:shadow-md transition-shadow`}>
          <div className="flex justify-between items-start">
            <div className="text-slate-500 text-sm font-medium">Ganancia Neta</div>
          </div>
          <div className={`text-3xl font-bold mt-2 ${currentNetProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(currentNetProfit)}
          </div>
          <div className="mt-2"><TrendIndicator value={netProfitTrend} /></div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA (Top Unidades y Últimos Viajes) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Top 3 Unidades */}
          <Card>
            <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white flex items-center gap-2">
              <Truck size={20} className="text-blue-500" /> Rendimiento de Unidades (Top del Mes)
            </h3>
            {topUnits.length > 0 ? (
              <div className="space-y-4">
                {topUnits.map((unit, index) => (
                  <div key={unit.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${index === 0 ? 'bg-amber-400' : index === 1 ? 'bg-slate-400' : 'bg-amber-600'}`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{unit.name}</p>
                        <p className="text-xs text-slate-500">{unit.plate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Rentabilidad Neta</p>
                      <p className={`font-bold ${unit.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(unit.netProfit)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">Aún no hay actividad de unidades en este mes.</p>
            )}
          </Card>

          {/* Últimos Viajes Registrados */}
          <Card>
            <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white flex items-center gap-2">
              <Map size={20} className="text-blue-500" /> Últimos Viajes Registrados
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <tbody>
                  {recentTrips.map(t => {
                    const client = clients?.find(c => c.id === t.clientId);
                    return (
                      <tr key={t.id} className="border-b last:border-0 border-slate-100 dark:border-slate-700">
                        <td className="py-3 px-2 text-slate-500">{formatDate(t.date)}</td>
                        <td className="py-3 px-2 font-medium text-slate-900 dark:text-white">{t.origin} → {t.destination}</td>
                        <td className="py-3 px-2 text-slate-600 dark:text-slate-400">{client?.company || client?.name || 'Cliente'}</td>
                        <td className="py-3 px-2 text-right font-medium text-emerald-600">{formatCurrency(t.value)}</td>
                      </tr>
                    );
                  })}
                  {recentTrips.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500">No hay viajes registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* COLUMNA DERECHA (Alertas y Gastos) */}
        <div className="space-y-6">
          
          {/* Panel de Alertas y Cobranzas */}
          <Card className="border-t-4 border-t-orange-500">
            <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle size={20} className="text-orange-500"/> Centro de Alertas
            </h3>
            
            <div className="space-y-4">
              {/* Alerta de Cobros Pendientes */}
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30 rounded-xl">
                <div className="flex items-center gap-2 text-orange-800 dark:text-orange-300 mb-1">
                  <Clock size={18} />
                  <span className="font-semibold text-sm">Pendiente de Cobro</span>
                </div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(pendingTotal)}</p>
                <p className="text-xs text-orange-700/70 dark:text-orange-400/70 mt-1">De {pendingTrips.length} viajes pendientes</p>
              </div>

              {/* Alertas de Seguros */}
              {expiringInsurance.length > 0 ? (
                <ul className="space-y-2">
                  {expiringInsurance.map(u => {
                    const isExpired = new Date(u.insuranceExpiry).getTime() < now.getTime();
                    return (
                      <li key={u.id} className={`flex flex-col text-sm p-3 rounded-lg border ${isExpired ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-300' : 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800/30 dark:text-yellow-300'}`}>
                        <span className="font-bold">{isExpired ? '¡SEGURO VENCIDO!' : 'Próximo a Vencer:'}</span>
                        <span>{u.name} ({u.plate}) - {formatDate(u.insuranceExpiry)}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-sm text-emerald-600 dark:text-emerald-400 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center gap-2 border border-emerald-100 dark:border-emerald-800/30">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Seguros al día.
                </div>
              )}
            </div>
          </Card>

          {/* Distribución de Gastos */}
          <Card>
            <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart size={20} className="text-blue-500" /> Gastos del Mes
            </h3>
            {sortedCategories.length > 0 ? (
              <div className="space-y-4">
                {sortedCategories.map(([category, amount], index) => {
                  const percentage = ((amount / currentExpTotal) * 100).toFixed(1);
                  // Colores dinámicos para las barras
                  const colors = ['bg-blue-500', 'bg-red-500', 'bg-orange-500', 'bg-emerald-500', 'bg-purple-500', 'bg-slate-500'];
                  const colorClass = colors[index % colors.length];

                  return (
                    <div key={category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize font-medium text-slate-700 dark:text-slate-300">{category}</span>
                        <span className="text-slate-500">{formatCurrency(amount)} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                        <div className={`${colorClass} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-6">No hay gastos registrados este mes.</p>
            )}
          </Card>

        </div>
      </div>
    </div>
  );
};
