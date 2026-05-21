import React, { useState } from 'react';
import { Download, Printer, FileText, Calendar, ArrowLeft, TrendingUp, TrendingDown, Truck, Activity } from 'lucide-react';
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
  // Estados para fechas y modos de vista
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const toYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [dateMode, setDateMode] = useState<'historico' | 'rango'>('historico');
  const [startDate, setStartDate] = useState(toYMD(startOfMonth));
  const [endDate, setEndDate] = useState(toYMD(today));
  
  // Modos de navegación: 'tarjetas' (pantallazo) o 'detallado'
  const [viewMode, setViewMode] = useState<'tarjetas' | 'detallado'>('tarjetas');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-AR', { timeZone: 'UTC' });

  // 1. Filtrar los datos globales según el modo de fecha (Histórico ignora las fechas)
  const activeTrips = dateMode === 'historico' ? trips : trips.filter(t => t.date >= startDate && t.date <= endDate);
  const activeExpenses = dateMode === 'historico' ? expenses : expenses.filter(e => e.date >= startDate && e.date <= endDate);
  const activeFuel = dateMode === 'historico' ? fuel : fuel.filter(f => f.date >= startDate && f.date <= endDate);

  // 2. Calcular la data consolidada por cada unidad
  const reportData = units
    .filter(u => selectedUnit === 'all' || u.id === selectedUnit)
    .map(unit => {
      const uTrips = activeTrips.filter(t => t.unitId === unit.id);
      const uExpenses = activeExpenses.filter(e => e.unitId === unit.id);
      const uFuel = activeFuel.filter(f => f.unitId === unit.id);

      const totalRevenue = uTrips.reduce((sum, t) => sum + Number(t.value), 0);
      const totalExpenses = uExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const totalFuel = uFuel.reduce((sum, f) => sum + Number(f.total), 0);
      const netProfit = totalRevenue - totalExpenses - totalFuel;
      
      const margin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

      return {
        ...unit,
        totalRevenue,
        totalExpenses,
        totalFuel,
        netProfit,
        margin,
        tripsCount: uTrips.length,
        details: { trips: uTrips, expenses: uExpenses, fuel: uFuel }
      };
    }).sort((a, b) => b.netProfit - a.netProfit);

  // Acción: Ver Detalle de un camión específico
  const handleVerDetalle = (unitId: string) => {
    setSelectedUnit(unitId);
    setViewMode('detallado');
  };

  // Acción: Volver al pantallazo general
  const handleVolver = () => {
    setSelectedUnit('all');
    setViewMode('tarjetas');
  };

  // Función nativa para imprimir
  const handlePrint = () => window.print();

  // Exportar a CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (viewMode === 'tarjetas') {
      csvContent += "Unidad,Patente,Viajes,Ingresos Brutos,Gastos Operativos,Combustible,Ganancia Neta,Margen(%)\n";
      reportData.forEach(row => {
        csvContent += `"${row.name}","${row.plate}",${row.tripsCount},${row.totalRevenue},${row.totalExpenses},${row.totalFuel},${row.netProfit},${row.margin}%\n`;
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
    link.setAttribute("download", `Reporte_LogisFlow_${dateMode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 print:space-y-4 print:m-0 print:p-0 print:bg-white">
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="text-blue-600" />
            Balance y Rentabilidad
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            {dateMode === 'historico' ? 'Análisis de rendimiento histórico de toda la flota' : 'Análisis por rango de fechas seleccionado'}
          </p>
        </div>
        <div className="flex gap-2">
          {viewMode === 'detallado' && (
            <Button variant="secondary" icon={ArrowLeft} onClick={handleVolver}>Volver al Resumen</Button>
          )}
          <Button variant="secondary" icon={Printer} onClick={handlePrint}>Imprimir</Button>
          <Button icon={Download} onClick={handleExportCSV}>Exportar</Button>
        </div>
      </div>

      {/* Título de Impresión */}
      <div className="hidden print:block mb-6 border-b-2 border-black pb-2">
        <h1 className="text-2xl font-bold text-slate-900">Balance LogisFlow - {viewMode === 'tarjetas' ? 'Resumen General' : 'Detalle de Unidad'}</h1>
        <p className="text-slate-600">
          Período: {dateMode === 'historico' ? 'Histórico Total (Desde el origen)' : `${formatDate(startDate)} al ${formatDate(endDate)}`}
        </p>
      </div>

      {/* BARRA DE FILTROS (Oculta en modo detallado para enfocarse en la info y oculta al imprimir) */}
      {viewMode === 'tarjetas' && (
        <Card className="print:hidden">
          <div className="flex flex-col md:flex-row items-center gap-6">
            
            {/* Toggle Histórico / Rango */}
            <div className="w-full md:w-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 flex">
              <button
                onClick={() => setDateMode('historico')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium rounded-md transition-all ${dateMode === 'historico' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <Activity size={16} /> Histórico Total
              </button>
              <button
                onClick={() => setDateMode('rango')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium rounded-md transition-all ${dateMode === 'rango' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <Calendar size={16} /> Buscar por Fecha
              </button>
            </div>

            {/* Inputs de fecha (solo si modo es rango) */}
            {dateMode === 'rango' && (
              <div className="flex items-center gap-4 w-full md:w-auto animate-in fade-in slide-in-from-left-4">
                <Input label="Desde" type="date" value={startDate} onChange={(e: any) => setStartDate(e.target.value)} />
                <Input label="Hasta" type="date" value={endDate} onChange={(e: any) => setEndDate(e.target.value)} />
              </div>
            )}

          </div>
        </Card>
      )}


      {/* VISTA 1: PANTALLAZO GENERAL (TARJETAS) */}
      {viewMode === 'tarjetas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportData.map(unit => {
            const isProfitable = unit.netProfit >= 0;
            return (
              <Card key={unit.id} className="flex flex-col relative overflow-hidden group print:break-inside-avoid print:border-black print:shadow-none">
                {/* Banda de color superior según rentabilidad */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${isProfitable ? 'bg-emerald-500' : 'bg-red-500'}`} />
                
                {/* Cabecera Tarjeta */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Truck size={20} className="text-slate-400" />
                      {unit.name}
                    </h3>
                    <p className="text-sm text-slate-500">{unit.plate} • {unit.brand}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-bold ${isProfitable ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'}`}>
                    Margen: {unit.margin}%
                  </div>
                </div>

                {/* Cuerpo Tarjeta (Métricas) */}
                <div className="space-y-3 mb-6 flex-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Ingresos Brutos:</span>
                    <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(unit.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span className="text-red-500">Egresos (Gastos + Nafta):</span>
                    <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(unit.totalExpenses + unit.totalFuel)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Balance Neto:</span>
                    <span className={`text-xl font-bold flex items-center gap-1 ${isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {isProfitable ? <TrendingUp size={18}/> : <TrendingDown size={18}/>}
                      {formatCurrency(unit.netProfit)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 text-right">{unit.tripsCount} viajes registrados</p>
                </div>

                {/* Pie Tarjeta */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700 print:hidden">
                  <Button 
                    variant="secondary" 
                    className="w-full" 
                    icon={FileText} 
                    onClick={() => handleVerDetalle(unit.id)}
                  >
                    Ver Detalle Operativo
                  </Button>
                </div>
              </Card>
            );
          })}
          
          {reportData.length === 0 && (
             <div className="col-span-full text-center py-10 text-slate-500">
                No hay unidades registradas en el sistema o con datos en este período.
             </div>
          )}
        </div>
      )}

      {/* VISTA 2: DETALLADO (Despliegue del historial de la unidad) */}
      {viewMode === 'detallado' && (
        <div className="space-y-8 print:space-y-6">
          {reportData.map(unit => {
            if (unit.tripsCount === 0 && unit.details.expenses.length === 0 && unit.details.fuel.length === 0) {
              return (
                <Card key={unit.id} className="text-center py-10 text-slate-500">
                  La unidad <strong>{unit.name}</strong> no tiene movimientos registrados.
                </Card>
              );
            }

            return (
              <Card key={unit.id} className="print:shadow-none print:border print:border-slate-300 print:p-4 break-inside-avoid shadow-lg border-blue-100 dark:border-blue-900/50">
                
                {/* Cabecera de la Unidad en el Detalle */}
                <div className="border-b border-slate-200 dark:border-slate-700 pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 print:border-black">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white print:text-black flex items-center gap-2">
                      <Truck className="text-blue-600" />
                      {unit.name}
                    </h3>
                    <p className="text-slate-500 print:text-slate-800 mt-1">Patente: {unit.plate} | Tipo: {unit.type}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto text-right">
                    <p className="text-sm text-slate-500 print:text-slate-800 uppercase font-semibold mb-1">Amortización / Resultado Neto</p>
                    <p className={`text-3xl font-bold print:text-black ${unit.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(unit.netProfit)}
                    </p>
                  </div>
                </div>

                {/* Sub-Tablas del Detalle */}
                <div className="space-y-6">
                  
                  {/* Viajes */}
                  {unit.details.trips.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 print:text-black bg-slate-100 dark:bg-slate-800 py-2 px-3 rounded">
                        Ingresos: Historial de Viajes ({unit.tripsCount})
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border border-slate-100 dark:border-slate-700 print:border-slate-300">
                          <thead className="bg-slate-50 dark:bg-slate-800 print:bg-slate-100 text-slate-500">
                            <tr>
                              <th className="px-3 py-2 print:border-b print:border-slate-300">Fecha</th>
                              <th className="px-3 py-2 print:border-b print:border-slate-300">Ruta (Origen - Destino)</th>
                              <th className="px-3 py-2 print:border-b print:border-slate-300">Estado</th>
                              <th className="px-3 py-2 print:border-b print:border-slate-300 text-right">Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {unit.details.trips.map(t => (
                              <tr key={t.id} className="border-t border-slate-100 dark:border-slate-700 print:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="px-3 py-2">{formatDate(t.date)}</td>
                                <td className="px-3 py-2">{t.origin} a {t.destination} <span className="text-xs text-slate-400">({t.km}km)</span></td>
                                <td className="px-3 py-2 capitalize">{t.paymentStatus}</td>
                                <td className="px-3 py-2 text-right font-medium text-emerald-600 dark:text-emerald-400">+{formatCurrency(t.value)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2">
                    {/* Gastos Operativos */}
                    {unit.details.expenses.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 print:text-black bg-slate-100 dark:bg-slate-800 py-2 px-3 rounded">
                          Egresos: Gastos Operativos
                        </h4>
                        <table className="w-full text-sm text-left border border-slate-100 dark:border-slate-700 print:border-slate-300">
                          <thead className="bg-slate-50 dark:bg-slate-800 print:bg-slate-100 text-slate-500">
                            <tr>
                              <th className="px-3 py-2 print:border-b print:border-slate-300">Fecha</th>
                              <th className="px-3 py-2 print:border-b print:border-slate-300">Categoría / Detalle</th>
                              <th className="px-3 py-2 print:border-b print:border-slate-300 text-right">Monto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {unit.details.expenses.map(e => (
                              <tr key={e.id} className="border-t border-slate-100 dark:border-slate-700 print:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="px-3 py-2">{formatDate(e.date)}</td>
                                <td className="px-3 py-2">
                                  <span className="font-medium capitalize">{e.category}</span>
                                  <div className="text-xs text-slate-500">{e.description}</div>
                                </td>
                                <td className="px-3 py-2 text-right font-medium text-red-600 print:text-black">-{formatCurrency(e.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Combustible */}
                    {unit.details.fuel.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 print:text-black bg-slate-100 dark:bg-slate-800 py-2 px-3 rounded">
                          Egresos: Combustible
                        </h4>
                        <table className="w-full text-sm text-left border border-slate-100 dark:border-slate-700 print:border-slate-300">
                          <thead className="bg-slate-50 dark:bg-slate-800 print:bg-slate-100 text-slate-500">
                            <tr>
                              <th className="px-3 py-2 print:border-b print:border-slate-300">Fecha</th>
                              <th className="px-3 py-2 print:border-b print:border-slate-300">Estación / Litros</th>
                              <th className="px-3 py-2 print:border-b print:border-slate-300 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {unit.details.fuel.map(f => (
                              <tr key={f.id} className="border-t border-slate-100 dark:border-slate-700 print:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="px-3 py-2">{formatDate(f.date)}</td>
                                <td className="px-3 py-2">
                                  <span className="font-medium">{f.liters} Lts</span>
                                  <div className="text-xs text-slate-500">{f.station || 'N/A'}</div>
                                </td>
                                <td className="px-3 py-2 text-right font-medium text-orange-600 print:text-black">-{formatCurrency(f.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
