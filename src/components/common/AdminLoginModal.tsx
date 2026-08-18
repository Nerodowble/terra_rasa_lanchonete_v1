import React, { useState } from 'react';
import { useComanda } from '../../context/ComandaContext';
import {
  Lock,
  User,
  KeyRound,
  X,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

export const AdminLoginModal: React.FC = () => {
  const {
    isLoginModalOpen,
    closeAdminLogin,
    loginAdmin,
    config,
  } = useComanda();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Preencha o usuário e a senha para acessar.');
      return;
    }

    setIsLoading(true);

    loginAdmin(username, password)
      .then(success => {
        setIsLoading(false);
        if (success) {
          setUsername('');
          setPassword('');
          setErrorMsg('');
        } else {
          setErrorMsg('Usuário ou senha incorretos. Verifique suas credenciais e tente novamente.');
        }
      })
      .catch(() => {
        setIsLoading(false);
        setErrorMsg('Não foi possível falar com o servidor. Tente novamente.');
      });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        id="modal-admin-login"
        className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-stone-200 relative animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="bg-stone-900 text-stone-100 p-5 sm:p-6 relative">
          <button
            id="btn-close-login-modal"
            onClick={closeAdminLogin}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Acesso Restrito
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                Gestão do Restaurante
              </h2>
            </div>
          </div>

          <p className="text-xs text-stone-400">
            Painel restrito para gerentes, caixa, cozinha (KDS) e controle de entregadores do {config.name}.
          </p>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          {/* User Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">
              Usuário de Acesso
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-login-username"
                type="text"
                autoFocus
                placeholder="Seu usuário"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-stone-50 focus:bg-white"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">
              Senha
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-stone-50 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={closeAdminLogin}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="btn-submit-login"
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Verificando...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Entrar na Gestão</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
