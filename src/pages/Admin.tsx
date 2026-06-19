import React, { useState } from 'react';
import { Shield, UserX, UserCheck, Clock, AlertTriangle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { UserProfile, UserStatus } from '../types';

interface AdminProps {
  users: UserProfile[];
  onSave: (collectionName: string, data: any) => void;
}

export const AdminView: React.FC<AdminProps> = ({ users, onSave }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleRoleChange = (user: UserProfile, newRole: string) => {
    if (window.confirm(`¿Cambiar el rol a ${newRole.toUpperCase()}?`)) {
      onSave('user_profiles', { ...user, role: newRole });
    }
  };

  const handleStatusChange = (user: UserProfile, newStatus: UserStatus) => {
    const action = newStatus === 'activo' ? 'Habilitar' : 'Bloquear';
    if (window.confirm(`¿Estás seguro de ${action} a este usuario?`)) {
      onSave('user_profiles', { ...user, status: newStatus, isActive: newStatus === 'activo' });
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const pendingUsers = users.filter(u => u.status === 'pendiente' || (u.status === undefined && u.isActive === undefined));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="text-blue-600" /> Panel de Administrador
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Gestión de accesos, roles y autorizaciones</p>
        </div>
      </div>

      {/* AVISO DE USUARIOS PENDIENTES */}
      {pendingUsers.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg flex items-start gap-3 shadow-sm">
          <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-yellow-800 font-bold text-sm">¡Tienes personal esperando autorización!</h3>
            <p className="text-yellow-700 text-sm mt-1">Hay {pendingUsers.length} usuario(s) que se registraron y no pueden entrar al sistema hasta que los apruebes.</p>
          </div>
        </div>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <input
            type="text"
            placeholder="Buscar por nombre o identificador..."
            className="w-full sm:max-w-sm px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold">Usuario</th>
                <th className="px-6 py-4 font-semibold text-center">Estado de Acceso</th>
                <th className="px-6 py-4 font-semibold text-center">Rol (Permisos)</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => {
                // Compatibilidad con perfiles viejos
                const currentStatus = user.status || (user.isActive === false ? 'bloqueado' : user.isActive === true ? 'activo' : 'pendiente');

                return (
                  <tr key={user.id} className={`border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${currentStatus === 'pendiente' ? 'bg-yellow-50/30 dark:bg-yellow-900/10' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white capitalize">{user.name}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</div>
                    </td>
                    
                    <td className="px-6 py-4 text-center">
                      {currentStatus === 'pendiente' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border bg-yellow-50 text-yellow-700 border-yellow-200">
                          <Clock size={14} /> PENDIENTE
                        </span>
                      )}
                      {currentStatus === 'activo' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                          <UserCheck size={14} /> ACTIVO
                        </span>
                      )}
                      {currentStatus === 'bloqueado' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border bg-red-50 text-red-700 border-red-200">
                          <UserX size={14} /> BLOQUEADO
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user, e.target.value)}
                        className={`text-xs font-bold rounded-lg border-2 px-3 py-1.5 outline-none cursor-pointer ${
                          user.role === 'administrador' ? 'border-purple-500 text-purple-700 bg-purple-50' :
                          user.role === 'encargado' ? 'border-blue-500 text-blue-700 bg-blue-50' :
                          'border-slate-400 text-slate-700 bg-slate-50'
                        }`}
                      >
                        <option value="administrador">Administrador</option>
                        <option value="encargado">Encargado</option>
                        <option value="operario">Operario</option>
                      </select>
                    </td>

                    <td className="px-6 py-4 text-right">
                      {currentStatus === 'pendiente' ? (
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" onClick={() => handleStatusChange(user, 'bloqueado')} className="text-red-600 bg-red-50 py-1.5 px-3 text-xs">Rechazar</Button>
                          <Button onClick={() => handleStatusChange(user, 'activo')} className="bg-emerald-600 hover:bg-emerald-700 py-1.5 px-3 text-xs shadow-sm">Aprobar Acceso</Button>
                        </div>
                      ) : (
                        <Button 
                          variant="ghost" 
                          onClick={() => handleStatusChange(user, currentStatus === 'activo' ? 'bloqueado' : 'activo')}
                          className={currentStatus === 'activo' ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"}
                        >
                          {currentStatus === 'activo' ? 'Bloquear' : 'Habilitar'}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
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
