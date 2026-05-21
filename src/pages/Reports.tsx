import React from 'react';
import { Download } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TransportUnit, Trip, Expense, FuelLoad } from '../types';

interface ReportsProps {
  units: TransportUnit[];
  trips: Trip[];
  expenses: Expense[];
  fuel: FuelLoad[];
}

export const ReportsView: React.FC<ReportsProps> = ({ units, trips, expenses, fuel }) => {
  const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  // Calcular la data consolidada por cada unidad
  const reportData = units.map(unit => {
    const unitTrips = trips.filter(t => t.unitId === unit.id);
    const unitExpenses = expenses.filter(e => e.unitId === unit.id);
    const unitFuel = fuel.filter(f => f.unitId === unit.id);

    const totalRevenue = unitTrips.reduce((sum, t) => sum + Number(t.value), 0);
    const totalExpenses = unitExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalFuel = unitFuel.reduce((sum, f) => sum + Number(f.total), 0);
    const netProfit = totalRevenue - totalExpenses - totalFuel;

    return {
      ...unit,
      totalRevenue,
      totalExpenses,
      totalFuel,
      netProfit,
      tripsCount: unitTrips.length
    };
  }).sort((a, b) => b.netProfit - a.netProfit); // Ordenar por la más rentable

  // Función para exportar a Excel/CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Unidad,Patente,Viajes,Ingresos,Gastos,Combustible,Ganancia Neta\n";
    
    reportData.forEach(row => {
      csvContent += `"${row.name}","${row.plate}",${row.tripsCount},${row.totalRevenue},${row.totalExpenses},${row.totalFuel},${row.netProfit}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_Rentabilidad_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Reporte de Rentabilidad</h2>
          <p className="text-slate-500 dark:text-slate-400">Análisis histórico completo por unidad</p>
        </div>
        <Button icon={Download} onClick={handleExportCSV}>Exportar CSV</Button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
            <tr>
              <th className="px-4 py-3">Unidad</th>
              <th className="px-4 py-3 text-center">Viajes</th>
              <th className="px-4 py-3 text-right">Ingresos Brutos</th>
              <th className="px-4 py-3 text-right text-red-500">Gastos</th>
              <th className="px-4 py-3 text-right text-orange-500">Combustible</th>
              <th className="px-4 py-3 text-right text-emerald-500">Ganancia Neta</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map(row => (
              <tr key={row.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900 dark:text-white">{row.name}</div>
                  <div className="text-xs text-slate-500">{row.plate}</div>
                </td>
                <td className="px-4 py-3 text-center font-medium">{row.tripsCount}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">{formatCurrency(row.totalRevenue)}</td>
                <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">{formatCurrency(row.totalExpenses)}</td>
                <td className="px-4 py-3 text-right text-orange-600 dark:text-orange-400">{formatCurrency(row.totalFuel)}</td>
                <td className={`px-4 py-3 text-right font-bold ${row.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(row.netProfit)}
                </td>
              </tr>
            ))}
            {reportData.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-6 text-slate-500">No hay unidades para generar reportes</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
