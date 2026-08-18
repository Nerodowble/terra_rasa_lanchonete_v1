import React from 'react';
import { useComanda } from '../../context/ComandaContext';
import {
  Smartphone,
  Volume2,
  VolumeX,
  UtensilsCrossed,
  Lock,
  LogOut,
  ShieldCheck,
  Power,
} from 'lucide-react';

export const HeaderSwitcher: React.FC = () => {
  const {
    viewMode,
    setViewMode,
    isAdminAuthenticated,
    openAdminLogin,
    logoutAdmin,
    config,
    updateConfig,
    toggleStoreStatus,
  } = useComanda();

  const handleAdminAccess = () => {
    if (isAdminAuthenticated) {
      setViewMode('admin');
    } else {
      openAdminLogin();
    }
  };

  const isStoreOpen = config.isOpen !== false;

  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
        {/* Brand & Live Sync */}
        <div className="flex items-center gap-2 sm:gap-3">
          {config.logoUrl ? (
            <img
              src={config.logoUrl}
              alt={config.name}
              referrerPolicy="no-referrer"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border border-amber-500/30 shrink-0"
            />
          ) : (
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
              <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-black tracking-tight text-white text-xs sm:text-base truncate max-w-[120px] xs:max-w-[180px] sm:max-w-none">
                {config.name || 'Meu Estabelecimento'}
              </span>
              
              {/* Dynamic Online / Offline status badge */}
              {isStoreOpen ? (
                <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="hidden xs:inline">Online • Ao Vivo</span>
                  <span className="xs:hidden">Live</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span className="hidden xs:inline">Offline • Fechado</span>
                  <span className="xs:hidden">Fechado</span>
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-stone-400 hidden sm:block">
              {config.tagline}
            </p>
          </div>
        </div>

        {/* Dynamic Controls based on View Mode */}
        {viewMode === 'client' ? (
          /* Client Mode Header Right */
          <div className="flex items-center gap-2 shrink-0">
            {/* Sound Toggle */}
            <button
              id="btn-toggle-sound"
              title={config.enableSoundAlerts ? 'Som ativado (clique para silenciar)' : 'Som mudo'}
              onClick={() => updateConfig({ enableSoundAlerts: !config.enableSoundAlerts })}
              className={`p-1.5 sm:p-2 rounded-xl border transition-colors cursor-pointer ${
                config.enableSoundAlerts
                  ? 'bg-stone-800 border-stone-700 text-amber-400 hover:bg-stone-700'
                  : 'bg-stone-800 border-stone-700 text-stone-500 hover:bg-stone-700'
              }`}
            >
              {config.enableSoundAlerts ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>

            {/* Discreet Management Access Button */}
            <button
              id="btn-open-admin-access"
              onClick={handleAdminAccess}
              title="Acesso restrito à gestão da cozinha, mesas e pedidos"
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 text-xs font-semibold transition-all cursor-pointer"
            >
              {isAdminAuthenticated ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden xs:inline">Gestão</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden xs:inline">Gestão</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Admin / Management Mode Controls */
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">
            {/* Direct 1-Click Store Open / Close Status Button */}
            <button
              id="btn-toggle-store-status"
              onClick={toggleStoreStatus}
              title={
                isStoreOpen
                  ? 'O estabelecimento está ABERTO. Clique para FECHAR e suspender o recebimento de novos pedidos.'
                  : 'O estabelecimento está FECHADO. Clique para ABRIR e começar a aceitar novos pedidos em tempo real.'
              }
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-xs ${
                isStoreOpen
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40 animate-pulse'
              }`}
            >
              <Power className={`w-3.5 h-3.5 ${isStoreOpen ? 'text-emerald-400' : 'text-rose-400'}`} />
              <span className="hidden sm:inline">
                {isStoreOpen ? 'Loja Aberta (Recebendo)' : 'Loja Fechada (Clique p/ Abrir)'}
              </span>
              <span className="sm:hidden">
                {isStoreOpen ? 'Aberta' : 'Fechada'}
              </span>
            </button>

            {/* Return to Client Menu button */}
            <button
              id="btn-return-client-menu"
              onClick={() => setViewMode('client')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition-colors cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Ver Cardápio do Cliente</span>
              <span className="sm:hidden">Cardápio</span>
            </button>

            {/* Sound Toggle */}
            <button
              id="btn-toggle-sound"
              title={config.enableSoundAlerts ? 'Som ativado (clique para silenciar)' : 'Som mudo'}
              onClick={() => updateConfig({ enableSoundAlerts: !config.enableSoundAlerts })}
              className={`p-1.5 sm:p-2 rounded-xl border transition-colors cursor-pointer ${
                config.enableSoundAlerts
                  ? 'bg-stone-800 border-stone-700 text-amber-400 hover:bg-stone-700'
                  : 'bg-stone-800 border-stone-700 text-stone-500 hover:bg-stone-700'
              }`}
            >
              {config.enableSoundAlerts ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>

            {/* Logout / Lock Button */}
            <button
              id="btn-logout-admin"
              onClick={logoutAdmin}
              title="Encerrar sessão de gestão e bloquear painel"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair / Bloquear</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
