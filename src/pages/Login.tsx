import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Truck, Mail, Lock, AlertCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const LoginView: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError('Correo o contraseña incorrectos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Ese correo ya está registrado. Intenta iniciar sesión.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError('Ocurrió un error. Verifica tus datos e intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
      <div className="w-full max-w-md">
        
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mx-auto w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-600/30 transform transition-transform hover:scale-105">
            <Truck size={40} className="text-white" strokeWidth={2.5} />
          </div>
          
          {/* NUEVO LOGO CORPORATIVO SII PALLETS */}
          <h1 className="text-4xl font-black tracking-tight drop-shadow-sm">
            <span className="text-blue-600">SII</span>
            <span className="text-slate-900 dark:text-white ml-2">PALLETS</span>
          </h1>
          
          <p className="text-slate-500 dark:text-slate-400 mt-3 font-medium text-lg">
            Plataforma de Gestión Logística
          </p>
        </div>

        <Card className="p-6 sm:p-8 shadow-2xl border-0 ring-1 ring-slate-200 dark:ring-slate-800 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2 text-red-700 dark:text-red-400 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full py-3 mt-4 text-base font-bold shadow-md hover:shadow-lg transition-all" disabled={loading}>
              {loading ? 'Procesando...' : (isLogin ? 'Ingresar a mi cuenta' : 'Registrarme')}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-6">
            {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
            <button 
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="ml-1 text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
