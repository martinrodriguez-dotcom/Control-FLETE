import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Receipt } from 'lucide-react';
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

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-AR');

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

  // Calcular gastos acumulados por unidad
  const expensesPerUnit = units.map(unit => {
    const total = expenses
      .filter(e => e.unitId === unit.id)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    return { ...unit, totalExpenses: total };
  }).filter(u => u.totalExpenses > 0) // Mostrar solo las que tienen gastos
    .sort((a, b) => b.totalExpenses - a.totalExpenses); // Ordenar de mayor a menor

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Gastos</h2>
        <Button icon={Plus} onClick={() => { setEditingItem({}); setModalOpen(true); }}>
          Nuevo Gasto
        </Button>
      </div>

      {/* Tarjetas Superiores (KPIs): Gastos por Unidad */}
      {expensesPerUnit.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {expensesPerUnit.map(unit => (
            <Card key={unit.id} className="border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-900/10">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2">
                <Receipt size={16} />
                <span className="text-sm font-medium truncate">{unit.name}</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(unit.totalExpenses)}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tabla de Gastos */}
      <Card className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Unidad Afectada</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3 text-right">Monto</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(e => {
              const unit = units.find(u => u.id === e.unitId);
              return (
                <tr key={e.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(e.date)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {unit ? unit.name : <span className="text-red-500">Unidad Eliminada</span>}
                  </td>
                  <td className="px-4 py-3 capitalize">{e.category}</td>
                  <td className="px-4 py-3">{e.description}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">
                    {formatCurrency(e.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" icon={Edit2} onClick={() => { setEditingItem(e); setModalOpen(true); }} className="p-1 mr-1" />
                    <Button variant="ghost" icon={Trash2} onClick={() => onDelete('expenses', e.id)} className="p-1 text-red-500" />
                  </td>
                </tr>
              );
            })}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-6 text-slate-500">No hay gastos registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={editingItem?.id ? "Editar Gasto" : "Nuevo Gasto"}>
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Fecha" name="date" type="date" defaultValue={editingItem?.date} required />
            <Input label="Categoría" name="category" type="select" options={[
              {label:'Peajes', value:'peajes'}, {label:'Mecánica', value:'mecanica'}, 
              {label:'Neumáticos', value:'neumaticos'}, {label:'Viáticos', value:'viaticos'},
              {label:'Lavado', value:'lavado'}, {label:'Otros', value:'otros'}
            ]} defaultValue={editingItem?.category} required />
            <Input label="Unidad Afectada" name="unitId" type="select" options={units.map(u => ({label: u.name, value: u.id}))} defaultValue={editingItem?.unitId} required />
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
