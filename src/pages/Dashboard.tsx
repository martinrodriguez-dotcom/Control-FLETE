import React from 'react';
import { Card } from '../components/ui/Card';
import { Trip, Expense, FuelLoad, TransportUnit } from '../types';

interface DashboardProps {
  trips: Trip[];
  expenses: Expense[];
  fuel: FuelLoad[];
  units: TransportUnit[];
}

export const DashboardView: React.FC<DashboardProps> = ({ trips, expenses, fuel, units }) => {
  const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
  
  const revenue = trips.reduce((acc, t) => acc + Number(t.value), 0);
  const expensesTotal = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const fuelTotal = fuel.reduce((acc, f) => acc + Number(f.total), 0);
  const netProfit = revenue - expensesTotal - fuelTotal;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Resumen Operativo</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <div className="text-slate-500 text-sm font-medium">Facturación Bruta</div>
          <div className="text-3xl font-bold mt-1">{formatCurrency(revenue)}</div>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <div className="text-slate-500 text-sm font-medium">Gastos Operativos</div>
          <div className="text-3xl font-bold mt-1">{formatCurrency(expensesTotal)}</div>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <div className="text-slate-500 text-sm font-medium">Combustible</div>
          <div className="text-3xl font-bold mt-1">{formatCurrency(fuelTotal)}</div>
        </Card>
        <Card className={`border-l-4 ${netProfit >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
          <div className="text-slate-500 text-sm font-medium">Ganancia Neta</div>
          <div className="text-3xl font-bold mt-1">{formatCurrency(netProfit)}</div>
        </Card>
      </div>
    </div>
  );
};
