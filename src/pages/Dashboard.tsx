import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Trip, Expense, FuelLoad, TransportUnit } from '../types';

interface DashboardProps {
  trips: Trip[];
  expenses: Expense[];
  fuel: FuelLoad[];
  units: TransportUnit[];
}

export const DashboardView: React.FC<DashboardProps> = ({ trips, expenses, fuel, units }) => {
  // Utilidades
  const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-AR');
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filtrar datos solo del mes actual
  const isCurrentMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };

  const monthlyTrips = trips.filter(t => isCurrentMonth(t.date));
  const monthlyExpenses = expenses.filter(e => isCurrentMonth(e.date));
  const monthlyFuel = fuel.filter(f => isCurrentMonth(f.date));

  // Cálculos financieros
  const revenue = monthlyTrips.reduce((acc, t) => acc + Number(t.value), 0);
  const expensesTotal = monthlyExpenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const fuelTotal = monthlyFuel.reduce((acc, f) => acc + Number(f.total), 0);
  const netProfit = revenue - expensesTotal - fuelTotal;

  // Lógica de Alertas: Seguros a punto de vencer (próximos 30 días) o vencidos
  const expiringInsurance = units.filter(u => {
    if (u.status !== 'activo') return false;
    const exp = new Date(u.insuranceExpiry);
    const diff = exp.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days >= -30 && days <= 30; // Muestra vencidos (hasta 30 días) y por vencer (30 días)
  });

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Resumen Operativo</h2>
        <p className="text-slate-500 dark:text-slate-400">
          Métricas del mes actual ({now.toLocaleString('es', { month: 'long' })})
        </p>
      </div>

      {/* Tarjetas de Métricas (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <div className="text-slate-500 text-sm font-medium">Facturación Bruta</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(revenue)}</div>
          <div className="text-xs text-slate-400 mt-2">{monthlyTrips.length} viajes realizados</div>
        </Card>
        
        <Card className="border-l-4 border-l-red-500">
          <div className="text-slate-500 text-sm font-medium">Gastos Operativos</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(expensesTotal)}</div>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <div className="text-slate-500 text-sm font-medium">Combustible</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(fuelTotal)}</div>
        </Card>
        
        <Card className={`border-l-4 ${netProfit >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
          <div className="text-slate-500 text-sm font-medium">Ganancia Neta</div>
          <div className={`text-3xl font-bold mt-1 ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(netProfit)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Margen: {revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0}%
          </div>
        </Card>
      </div>

      {/* Gráficos y Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Flujo de Caja */}
        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white">Flujo de Caja Simplificado</h3>
          <div className="space-y-4">
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-8 flex overflow-hidden">
              <div 
                className="bg-blue-500 h-full flex items-center px-2 text-xs text-white font-bold transition-all duration-500" 
                style={{ width: revenue ? '100%' : '0%' }}
              >
                Ingresos
              </div>
            </div>
            <div className="w-full flex h-8 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div 
                className="bg-red-500 h-full flex items-center px-2 text-xs text-white font-bold transition-all duration-500" 
                style={{ width: revenue ? `${(expensesTotal / revenue) * 100}%` : '0%' }}
              >
                Gastos
              </div>
              <div 
                className="bg-orange-500 h-full flex items-center px-2 text-xs text-white font-bold transition-all duration-500 border-l border-white/20" 
                style={{ width: revenue ? `${(fuelTotal / revenue) * 100}%` : '0%' }}
              >
                Comb.
              </div>
              <div 
                className="bg-emerald-500 h-full flex items-center px-2 text-xs text-white font-bold transition-all duration-500 border-l border-white/20" 
                style={{ width: revenue && netProfit > 0 ? `${(netProfit / revenue) * 100}%` : '0%' }}
              >
                Neto
              </div>
            </div>
          </div>
        </Card>

        {/* Panel de Alertas */}
        <Card>
          <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white flex items-center gap-2">
            <AlertCircle size={20} className="text-orange-500"/> Alertas
          </h3>
          {expiringInsurance.length > 0 ? (
            <ul className="space-y-3">
              {expiringInsurance.map(u => {
                const isExpired = new Date(u.insuranceExpiry).getTime() < now.getTime();
                return (
                  <li 
                    key={u.id} 
                    className={`flex flex-col justify-between text-sm p-3 rounded-lg border ${
                      isExpired 
                        ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/30'
                        : 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800/30'
                    }`}
                  >
                    <span className="font-medium">
                      {isExpired ? 'Seguro Vencido:' : 'Próximo a Vencer:'} 
                    </span>
                    <span>{u.name} ({u.plate}) - {formatDate(u.insuranceExpiry)}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No hay alertas activas. Todo está en orden.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};
