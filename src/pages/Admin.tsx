import React, { useState } from 'react';
import { Shield, UserX, UserCheck } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { UserProfile } from '../types';

interface AdminProps {
  users: UserProfile[];
  onSave: (collectionName: string, data: any) => void;
}

export const AdminView: React.FC<AdminProps> = ({ users, onSave }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleRoleChange = (user: UserProfile, newRole: string) => {
    if (window.confirm(`¿Estás seguro de cambiar el rol de ${user.email} a ${newRole.toUpperCase()}?`)) {
      onSave('user_profiles', { ...user, role: newRole });
    }
  };

  const handleToggleActive = (user: UserProfile) => {
    const action = user.isActive ? 'bloquear' : 'habilitar';
    if (window.confirm(`¿Estás seguro de ${action} a ${user.email}?`)) {
      onSave('user_profiles', { ...user, isActive: !user.isActive });
    }
  };

  const filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="text-blue-600" /> Panel de Administrador
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Gestión de accesos, roles y permisos del personal</p>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <input
            type="text"
            placeholder="Buscar usuario por correo..."
            className="w-full sm:max-w-sm px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold">Usuario (Email)</th>
                <th className="px-6 py-4 font-semibold text-center">Estado</th>
                <th className="px-6 py-4 font-semibold text-center">Rol Asignado</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones de Seguridad</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                      user.isActive 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30' 
                        : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30'
                    }`}>
                      {user.isActive ? <UserCheck size={14} /> : <UserX size={14} />}
                      {user.isActive ? 'ACTIVO' : 'BLOQUEADO'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user, e.target.value)}
                      className={`text-xs font-bold rounded-lg border-2 px-3 py-1.5 outline-none cursor-pointer ${
                        user.role === 'administrador' ? 'border-purple-500 text-purple-700 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400' :
                        user.role === 'encargado' ? 'border-blue-500 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' :
                        'border-slate-400 text-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      <option value="administrador">Administrador</option>
                      <option value="encargado">Encargado</option>
                      <option value="operario">Operario</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleToggleActive(user)}
                      className={user.isActive ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"}
                    >
                      {user.isActive ? 'Bloquear Acceso' : 'Habilitar Acceso'}
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No se encontraron usuarios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
