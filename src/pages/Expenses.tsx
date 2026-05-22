import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Receipt, Truck, ChevronDown, ChevronUp, Calendar, DollarSign, Activity } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Expense, TransportUnit } from '../types';

interface ExpensesProps {
  expenses: Expense[];
  units: TransportUnit[];
  onSave: (collectionName: string, data: any) => void;
  onDelete: (collectionName: string, id: string) => void;
}

export const ExpensesView: React.FC<ExpensesProps> = ({ expenses, units, onSave, onDelete }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Expense> | null>(null);
  
  // Estado para controlar qué unidades están expandidas (desplegadas)
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-AR', { timeZone: 'UTC' });

  // Alternar el despliegue de una unidad
  const toggleUnit = (unitId: string) => {
    setExpandedUnits(prev => ({
      ...prev,
      [unitId]: !prev[unitId]
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(fd.entries());
    
    onSave('expenses', {
      ...editingItem,
      ...data,
      amount: Number(data.amount)
    });
    setModalOpen(false);
    setEditingItem(null);
  };

  // --- CÁLCULOS GLOBALES PARA EL RESUMEN ---
  const totalExpensesAmount = expenses.reduce((acc, e) => acc + Number(e.amount), 0);

  // Agrupar gastos por unidad, ordenándolos estrictamente por fecha (más reciente primero)
  const expensesByUnit = units.map(unit => {
    const unitExpenses = expenses
      .filter(e => e.unitId === unit.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // ORDENADO POR FECHA

    const unitTotal = unitExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    return { unit, expenses: unitExpenses, unitTotal };
  }).filter(group => group.expenses.length > 0);

  // Gastos huérfanos (si se borró una unidad) ordenados por fecha
  const orphanExpenses = expenses
    .filter(e => !units.find(u => u.id === e.unitId))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Gastos</h2>
          <p className="text-slate-500 dark:text-slate-400">Control operativo y egresos por unidad</p>
        </div>
        <Button icon={Plus} onClick={() => { setEditingItem({}); setModalOpen(true); }}>
          Nuevo Gasto
        </Button>
      </div>

      {/* TARJETAS DE RESUMEN GLOBAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4 p-4 shadow-sm border-l-4 border-slate-500">
          <div className="p-3 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-lg">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Gastos Registrados</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{expenses.length}</p>
          </div>
        </Card>
        
        <Card className="flex items-center gap-4 p-4 border-l-4 border-red-500 shadow-sm">
          <div className="p-3 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Monto Total Egresado</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalExpensesAmount)}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4 border-l-4 border-blue-500 shadow-sm">
          <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
            <Truck size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Unidades con Gastos</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{expensesByUnit.length}</p>
          </div>
        </Card>
      </div>

      {/* LISTADO DE GASTOS AGRUPADOS CON DESPLEGABLES */}
      <div className="space-y-3">
        {expensesByUnit.length === 0 && orphanExpenses.length === 0 ? (
          <Card className="text-center py-12 shadow-sm">
            <Receipt size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Aún no hay gastos registrados</h3>
            <p className="text-slate-500 mt-1">Comienza registrando un gasto para ver la información aquí.</p>
          </Card>
        ) : (
          expensesByUnit.map(group => {
            const isOpen = !!expandedUnits[group.unit.id];
            return (
              <div 
                key={group.unit.id} 
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/70 shadow-sm overflow-hidden transition-all duration-200"
              >
                {/* CABECERA SELECCIONABLE (ACORDEÓN) */}
                <button
                  onClick={() => toggleUnit(group.unit.id)}
                  className="w-full p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors text-left outline-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-400 rounded-lg">
                      <Truck size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                        {group.unit.name}
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({group.unit.plate})</span>
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Receipt size={12} /> {group.expenses.length} gastos registrados
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 ml-auto sm:ml-0">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Egresos</p>
                      <p className="font-bold text-red-600 dark:text-red-400">{formatCurrency(group.unitTotal)}</p>
                    </div>
                    <div className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors p-1 bg-slate-100 dark:bg-slate-700 rounded-md">
                      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </button>

                {/* CONTENIDO DESPLEGABLE (TABLA DE GASTOS) */}
                {isOpen && (
                  <div className="border-t border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-500 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700">
                          <tr>
                            <th className="px-4 py-3 font-medium">Fecha</th>
                            <th className="px-4 py-3 font-medium">Categoría</th>
                            <th className="px-4 py-3 font-medium">Descripción</th>
                            <th className="px-4 py-3 font-medium text-right">Monto</th>
                            <th className="px-4 py-3 font-medium text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.expenses.map(e => (
                            <tr key={e.id} className="border-b last:border-0 border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">{formatDate(e.date)}</td>
                              <td className="px-4 py-3 capitalize font-medium text-slate-900 dark:text-white">{e.category}</td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{e.description}</td>
                              <td className="px-4 py-3 text-right font-bold text-red-600 dark:text-red-400">
                                -{formatCurrency(e.amount)}
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <Button variant="ghost" icon={Edit2} onClick={() => { setEditingItem(e); setModalOpen(true); }} className="p-1.5 mr-1" title="Editar" />
                                <Button variant="ghost" icon={Trash2} onClick={() => onDelete('expenses', e.id)} className="p-1.5 text-red-500" title="Eliminar" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* GASTOS HUÉRFANOS (Unidad eliminada) */}
        {orphanExpenses.length > 0 && (
          <Card className="overflow-hidden p-0 border-t-4 border-t-slate-400 shadow-sm opacity-80">
            <div className="bg-slate-100 dark:bg-slate-800/80 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <Receipt className="text-slate-500" />
              <h3 className="font-bold text-base text-slate-700 dark:text-slate-300">Gastos de unidades desasignadas u eliminadas</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <tbody>
                  {orphanExpenses.map(e => (
                    <tr key={e.id} className="border-b last:border-0 dark:border-slate-700">
                      <td className="px-4 py-3 font-medium">{formatDate(e.date)}</td>
                      <td className="px-4 py-3 capitalize">{e.category}</td>
                      <td className="px-4 py-3 text-slate-500">{e.description}</td>
                      <td className="px-4 py-3 text-right font-bold text-red-500">-{formatCurrency(e.amount)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" icon={Edit2} onClick={() => { setEditingItem(e); setModalOpen(true); }} className="p-1" />
                        <Button variant="ghost" icon={Trash2} onClick={() => onDelete('expenses', e.id)} className="p-1 text-red-500" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* MODAL DEL FORMULARIO */}
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={editingItem?.id ? "Editar Gasto" : "Nuevo Gasto"}>
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Fecha" name="date" type="date" defaultValue={editingItem?.date} required />
            <Input 
              label="Categoría" 
              name="category" 
              type="select" 
              options={[
                {label:'Peajes', value:'peajes'}, 
                {label:'Mecánica', value:'mecanica'}, 
                {label:'Neumáticos', value:'neumaticos'}, 
                {label:'Viáticos', value:'viaticos'},
                {label:'Lavado', value:'lavado'}, 
                {label:'Otros', value:'otros'}
              ]} 
              defaultValue={editingItem?.category} 
              required 
            />
            <Input 
              label="Unidad Afectada" 
              name="unitId" 
              type="select" 
              options={units.map(u => ({label: u.name, value: u.id}))} 
              defaultValue={editingItem?.unitId} 
              required 
            />
            <Input label="Monto ($)" name="amount" type="number" defaultValue={editingItem?.amount} required />
            <div className="sm:col-span-2">
              <Input label="Descripción" name="description" defaultValue={editingItem?.description} required />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar Gasto</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
