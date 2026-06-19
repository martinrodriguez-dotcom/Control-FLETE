import React, { useState } from 'react';
import { Plus, Trash2, Edit2, AlertCircle, Receipt } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Expense, TransportUnit } from '../types';

interface ExpensesProps {
  expenses: Expense[];
  units: TransportUnit[];
  onSave: (collectionName: string, data: any) => void;
  onDelete: (collectionName: string, id: string) => void;
}

export const ExpensesView: React.FC<ExpensesProps> = ({ expenses, units, onSave, onDelete }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Expense | null>(null);

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val || 0);
  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString('es-AR', { timeZone: 'UTC' }); } catch { return dateStr; }
  };

  const getUnitName = (id: string) => units.find(u => u.id === id)?.name || 'General';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    
    onSave('expenses', {
      ...editingItem,
      date: fd.get('date'),
      unitId: fd.get('unitId'),
      category: fd.get('category'),
      description: fd.get('description'),
      amount: Number(fd.get('amount'))
    });
    
    setModalOpen(false);
    setEditingItem(null);
  };

  // Función estrella: Botón rápido para cargar el costo del taller
  const handleLoadCost = (expense: Expense) => {
    const costStr = window.prompt(`Cargar costo real de factura para:\n"${expense.description}"`);
    if (costStr) {
      const cost = Number(costStr);
      if (!isNaN(cost) && cost > 0) {
        onSave('expenses', { ...expense, amount: cost });
      } else {
        alert('Monto inválido. Ingresa un número mayor a cero.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="text-blue-600" /> Registro de Gastos
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Control operativo y facturas pendientes de Mantenimiento</p>
        </div>
        <Button onClick={() => { setEditingItem(null); setModalOpen(true); }} icon={Plus}>
          Nuevo Gasto
        </Button>
      </div>

      <Card className="p-0 overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold">Fecha</th>
                <th className="px-6 py-4 font-semibold">Unidad</th>
                <th className="px-6 py-4 font-semibold">Categoría</th>
                <th className="px-6 py-4 font-semibold">Descripción</th>
                <th className="px-6 py-4 font-semibold text-right">Monto</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => {
                // Detecta si es un gasto automático del taller que todavía no tiene precio
                const isPending = expense.amount === 0 && expense.category === 'mantenimiento';

                return (
                  <tr 
                    key={expense.id} 
                    className={`border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${
                      isPending ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                    }`}
                  >
                    <td className="px-6 py-4">{formatDate(expense.date)}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{getUnitName(expense.unitId)}</td>
                    <td className="px-6 py-4 capitalize">
                      {isPending ? (
                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-bold text-xs">
                          <AlertCircle size={14} /> PENDIENTE FACTURA
                        </span>
                      ) : (
                        expense.category
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate" title={expense.description}>{expense.description}</td>
                    
                    <td className={`px-6 py-4 text-right font-bold ${isPending ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                      {isPending ? 'SIN CARGAR' : formatCurrency(expense.amount)}
                    </td>
                    
                    <td className="px-6 py-4 text-right space-x-2">
                      {isPending ? (
                        <Button 
                          onClick={() => handleLoadCost(expense)} 
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-xs rounded-lg shadow-sm"
                        >
                          Cargar Costo
                        </Button>
                      ) : (
                        <Button variant="ghost" onClick={() => { setEditingItem(expense); setModalOpen(true); }} className="text-blue-600 p-2">
                          <Edit2 size={16} />
                        </Button>
                      )}
                      <Button variant="ghost" onClick={() => onDelete('expenses', expense.id)} className="text-red-600 p-2">
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No hay gastos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setModalOpen(false); setEditingItem(null); }} 
        title={editingItem ? 'Editar Gasto' : 'Nuevo Gasto'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Fecha" name="date" type="date" defaultValue={editingItem?.date || new Date().toISOString().split('T')[0]} required />
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Unidad Afectada</label>
            <select name="unitId" defaultValue={editingItem?.unitId || ''} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" required>
              <option value="">Seleccione una unidad...</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.plate})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
            <select name="category" defaultValue={editingItem?.category || 'viaticos'} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" required>
              <option value="viaticos">Viáticos</option>
              <option value="peajes">Peajes</option>
              <option value="mantenimiento">Mantenimiento / Taller</option>
              <option value="gomeria">Gomería</option>
              <option value="seguro">Seguro</option>
              <option value="patente">Patente</option>
              <option value="otros">Otros</option>
            </select>
          </div>

          <Input label="Monto Total ($)" name="amount" type="number" defaultValue={editingItem?.amount || ''} required />
          <Input label="Descripción / N° Factura" name="description" type="text" defaultValue={editingItem?.description || ''} required />
          
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" type="button" onClick={() => { setModalOpen(false); setEditingItem(null); }}>Cancelar</Button>
            <Button type="submit">Guardar Gasto</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
