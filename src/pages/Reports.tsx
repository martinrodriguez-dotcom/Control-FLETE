import React, { useState } from 'react';
import { Download, Printer, FileText, LayoutList } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { TransportUnit, Trip, Expense, FuelLoad } from '../types';

interface ReportsProps {
  units: TransportUnit[];
  trips: Trip[];
  expenses: Expense[];
  fuel: FuelLoad[];
}

export const ReportsView: React.FC<ReportsProps> = ({ units, trips, expenses, fuel }) => {
  // Configuración de fechas por defecto (Mes actual)
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const toYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [startDate, setStartDate] = useState(toYMD(startOfMonth));
  const [endDate, setEndDate] = useState(toYMD(today));
  const [reportType, setReportType] = useState<'resumen' | 'detallado'>('resumen');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-AR', { timeZone: 'UTC' });

  // Filtrar los datos globales por el rango de fechas seleccionado
  const filteredTrips = trips.filter(t => t.date >= startDate && t.date <= endDate);
  const filteredExpenses = expenses.filter(e => e.date >= startDate && e.date <= endDate);
  const filteredFuel = fuel.filter(f => f.date >= startDate && f.date <= endDate);

  // Calcular la data consolidada por cada unidad, aplicando el filtro de unidad
  const reportData = units
    .filter(u => selectedUnit === 'all' || u.id === selectedUnit)
    .map(unit => {
      const uTrips = filteredTrips.filter(t => t.unitId === unit.id);
      const uExpenses = filteredExpenses.filter(e => e.unitId === unit.id);
      const uFuel = filteredFuel.filter(f => f.unitId === unit.id);

      const totalRevenue = uTrips.reduce((sum, t) => sum + Number(t.value), 0);
      const totalExpenses = uExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const totalFuel = uFuel.reduce((sum, f) => sum + Number(f.total), 0);
      const netProfit = totalRevenue - totalExpenses - totalFuel;

      return {
        ...unit,
        totalRevenue,
        totalExpenses,
        totalFuel,
        netProfit,
        tripsCount: uTrips.length,
        details: {
          trips: uTrips,
          expenses: uExpenses,
          fuel: uFuel
        }
      };
    }).sort((a, b) => b.netProfit - a.netProfit); // Ordenar por la más rentable

  // Función para exportar a CSV (Exporta un resumen o el detallado según la vista actual)
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (reportType === 'resumen') {
      csvContent += "Unidad,Patente,Viajes,Ingresos,Gastos,Combustible,Ganancia Neta\n";
      reportData.forEach(row => {
        csvContent += `"${row.name}","${row.plate}",${row.tripsCount},${row.totalRevenue},${row.totalExpenses},${row.totalFuel},${row.netProfit}\n`;
      });
    } else {
      csvContent += "Unidad,Fecha,Tipo,Detalle,Monto\n";
      reportData.forEach(row => {
        row.details.trips.forEach(t => csvContent += `"${row.name}",${t.date},Viaje,"${t.origin} a ${t.destination}",${t.value}\n`);
        row.details.expenses.forEach(e => csvContent += `"${row.name}",${e.date},Gasto,"${e.category} - ${e.description}",-${e.amount}\n`);
        row.details.fuel.forEach(f => csvContent += `"${row.name}",${f.date},Combustible,"${f.station} - ${f.liters}L",-${f.total}\n`);
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_${reportType}_${startDate}_al_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función nativa para imprimir (Usa las clases print: de tailwind para formatear la página)
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:space-y-4 print:m-0 print:p-0 print:bg-white">
      
      {/* Cabecera y Botones (Se ocultan al imprimir) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Reportes y Rentabilidad</h2>
          <p className="text-slate-500 dark:text-slate-400">Análisis operativo de la flota</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={Printer} onClick={handlePrint}>Imprimir</Button>
          <Button icon={Download} onClick={handleExportCSV}>Exportar CSV</Button>
        </div>
      </div>

      {/* Título exclusivo para impresión */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Reporte LogisFlow</h1>
        <p className="text-slate-600">Período: {formatDate(startDate)} al {formatDate(endDate)}</p>
        <p className="text-slate-600">Tipo de reporte: {reportType === 'resumen' ? 'Resumen Consolidado' : 'Detallado por Unidad'}</p>
      </div>

      {/* Panel de Filtros (Se oculta al imprimir) */}
      <Card className="print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input 
            label="Fecha Inicio" 
            type="date" 
            value={startDate} 
            onChange={(e: any) => setStartDate(e.target.value)} 
          />
          <Input 
            label="Fecha Fin" 
            type="date" 
            value={endDate} 
            onChange={(e: any) => setEndDate(e.target.value)} 
          />
          <Input 
            label="Filtrar Unidad" 
            type="select" 
            value={selectedUnit} 
            onChange={(e: any) => setSelectedUnit(e.target.value)} 
            options={[
              { label: 'Todas las unidades', value: 'all' },
              ...units.map(u => ({ label: `${u.name} (${u.plate})`, value: u.id }))
            ]} 
          />
          <div className="flex items-end mb-4">
            <div className="flex w-full bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setReportType('resumen')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${reportType === 'resumen' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <LayoutList size={16} /> Resumen
              </button>
              <button
                onClick={() => setReportType('detallado')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${reportType === 'detallado' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <FileText size={16} /> Detallado
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* VISTA 1: RESUMEN */}
      {reportType === 'resumen' && (
        <Card className="overflow-x-auto print:shadow-none print:border-none print:p-0">
          <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400 print:text-black">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300 print:bg-transparent print:border-b-2 print:border-black">
              <tr>
                <th className="px-4 py-3 print:px-2">Unidad</th>
                <th className="px-4 py-3 text-center print:px-2">Viajes</th>
                <th className="px-4 py-3 text-right print:px-2">Ingresos</th>
                <th className="px-4 py-3 text-right text-red-500 print:text-black print:px-2">Gastos</th>
                <th className="px-4 py-3 text-right text-orange-500 print:text-black print:px-2">Combustible</th>
                <th className="px-4 py-3 text-right text-emerald-500 print:text-black print:px-2">Neto</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map(row => (
                <tr key={row.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 print:border-slate-300">
                  <td className="px-4 py-3 print:px-2">
                    <div className="font-medium text-slate-900 dark:text-white print:text-black">{row.name}</div>
                    <div className="text-xs text-slate-500 print:text-slate-700">{row.plate}</div>
                  </td>
                  <td className="px-4 py-3 text-center font-medium print:px-2">{row.tripsCount}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white print:text-black print:px-2">{formatCurrency(row.totalRevenue)}</td>
                  <td className="px-4 py-3 text-right text-red-600 dark:text-red-400 print:text-black print:px-2">{formatCurrency(row.totalExpenses)}</td>
                  <td className="px-4 py-3 text-right text-orange-600 dark:text-orange-400 print:text-black print:px-2">{formatCurrency(row.totalFuel)}</td>
                  <td className={`px-4 py-3 text-right font-bold print:px-2 print:text-black ${row.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(row.netProfit)}
                  </td>
                </tr>
              ))}
              {reportData.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-500 print:text-black">No hay actividad en el período seleccionado</td>
                </tr>
              )}
            </tbody>
            {/* Fila de Totales Generales */}
            {reportData.length > 0 && (
              <tfoot className="bg-slate-50 dark:bg-slate-800/50 print:bg-transparent font-bold text-slate-900 dark:text-white print:text-black print:border-t-2 print:border-black">
                <tr>
                  <td className="px-4 py-3 print:px-2">TOTALES</td>
                  <td className="px-4 py-3 text-center print:px-2">{reportData.reduce((acc, r) => acc + r.tripsCount, 0)}</td>
                  <td className="px-4 py-3 text-right print:px-2">{formatCurrency(reportData.reduce((acc, r) => acc + r.totalRevenue, 0))}</td>
                  <td className="px-4 py-3 text-right print:px-2">{formatCurrency(reportData.reduce((acc, r) => acc + r.totalExpenses, 0))}</td>
                  <td className="px-4 py-3 text-right print:px-2">{formatCurrency(reportData.reduce((acc, r) => acc + r.totalFuel, 0))}</td>
                  <td className="px-4 py-3 text-right print:px-2">{formatCurrency(reportData.reduce((acc, r) => acc + r.netProfit, 0))}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </Card>
      )}

      {/* VISTA 2: DETALLADO */}
      {reportType === 'detallado' && (
        <div className="space-y-8 print:space-y-6">
          {reportData.map(unit => {
            // Ocultar unidades que no tengan ninguna actividad en este periodo
            if (unit.tripsCount === 0 && unit.details.expenses.length === 0 && unit.details.fuel.length === 0) return null;

            return (
              <Card key={unit.id} className="print:shadow-none print:border print:border-slate-300 print:p-4 break-inside-avoid">
                {/* Cabecera de la Unidad */}
                <div className="border-b border-slate-200 dark:border-slate-700 pb-4 mb-4 flex justify-between items-end print:border-black">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white print:text-black">{unit.name}</h3>
                    <p className="text-sm text-slate-500 print:text-slate-800">Patente: {unit.plate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500 print:text-slate-800">Resultado Neto</p>
                    <p className={`text-xl font-bold print:text-black ${unit.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(unit.netProfit)}
                    </p>
                  </div>
                </div>

                {/* Tabla de Viajes */}
                {unit.details.trips.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 print:text-black">Viajes Registrados</h4>
                    <table className="w-full text-sm text-left border border-slate-100 dark:border-slate-700 print:border-slate-300">
                      <thead className="bg-slate-50 dark:bg-slate-800 print:bg-slate-100">
                        <tr>
                          <th className="px-3 py-2 print:border-b print:border-slate-300">Fecha</th>
                          <th className="px-3 py-2 print:border-b print:border-slate-300">Ruta (Origen - Destino)</th>
                          <th className="px-3 py-2 print:border-b print:border-slate-300 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unit.details.trips.map(t => (
                          <tr key={t.id} className="border-t border-slate-100 dark:border-slate-700 print:border-slate-300">
                            <td className="px-3 py-1.5">{formatDate(t.date)}</td>
                            <td className="px-3 py-1.5">{t.origin} a {t.destination} <span className="text-xs text-slate-400">({t.km}km)</span></td>
                            <td className="px-3 py-1.5 text-right font-medium">{formatCurrency(t.value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
                  {/* Tabla de Gastos */}
                  {unit.details.expenses.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 print:text-black">Gastos Operativos</h4>
                      <table className="w-full text-sm text-left border border-slate-100 dark:border-slate-700 print:border-slate-300">
                        <thead className="bg-slate-50 dark:bg-slate-800 print:bg-slate-100">
                          <tr>
                            <th className="px-3 py-2 print:border-b print:border-slate-300">Fecha</th>
                            <th className="px-3 py-2 print:border-b print:border-slate-300">Categoría/Detalle</th>
                            <th className="px-3 py-2 print:border-b print:border-slate-300 text-right">Monto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {unit.details.expenses.map(e => (
                            <tr key={e.id} className="border-t border-slate-100 dark:border-slate-700 print:border-slate-300">
                              <td className="px-3 py-1.5">{formatDate(e.date)}</td>
                              <td className="px-3 py-1.5">
                                <span className="capitalize">{e.category}</span>
                                <div className="text-xs text-slate-400">{e.description}</div>
                              </td>
                              <td className="px-3 py-1.5 text-right font-medium text-red-600 print:text-black">-{formatCurrency(e.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Tabla de Combustible */}
                  {unit.details.fuel.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 print:text-black">Combustible</h4>
                      <table className="w-full text-sm text-left border border-slate-100 dark:border-slate-700 print:border-slate-300">
                        <thead className="bg-slate-50 dark:bg-slate-800 print:bg-slate-100">
                          <tr>
                            <th className="px-3 py-2 print:border-b print:border-slate-300">Fecha</th>
                            <th className="px-3 py-2 print:border-b print:border-slate-300">Estación/Litros</th>
                            <th className="px-3 py-2 print:border-b print:border-slate-300 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {unit.details.fuel.map(f => (
                            <tr key={f.id} className="border-t border-slate-100 dark:border-slate-700 print:border-slate-300">
                              <td className="px-3 py-1.5">{formatDate(f.date)}</td>
                              <td className="px-3 py-1.5">
                                <span>{f.liters} Lts</span>
                                <div className="text-xs text-slate-400">{f.station || 'N/A'}</div>
                              </td>
                              <td className="px-3 py-1.5 text-right font-medium text-orange-600 print:text-black">-{formatCurrency(f.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
          {reportData.every(u => u.tripsCount === 0 && u.details.expenses.length === 0 && u.details.fuel.length === 0) && (
             <div className="text-center py-10 text-slate-500 print:text-black">
                No se encontraron registros de viajes, gastos ni combustible para el rango y unidad seleccionados.
             </div>
          )}
        </div>
      )}
    </div>
  );
};
