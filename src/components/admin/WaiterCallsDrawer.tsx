import React from 'react';
import { useComanda } from '../../context/ComandaContext';
import { formatTime, formatElapsedMinutes } from '../../utils/formatters';
import {
  X,
  Bell,
  CheckCircle,
  Clock,
  MapPin,
  Utensils,
  ReceiptText,
  Wine,
  Sparkles,
} from 'lucide-react';

interface WaiterCallsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WaiterCallsDrawer: React.FC<WaiterCallsDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const { waiterCalls, resolveWaiterCall } = useComanda();

  if (!isOpen) return null;

  const pendingCalls = waiterCalls.filter(c => c.status === 'pending');
  const resolvedCalls = waiterCalls.filter(c => c.status === 'resolved').slice(0, 5);

  const getCallIcon = (type: string) => {
    switch (type) {
      case 'bill':
        return <ReceiptText className="w-4 h-4 text-emerald-500" />;
      case 'cutlery':
        return <Utensils className="w-4 h-4 text-blue-500" />;
      case 'ice_lemon':
        return <Wine className="w-4 h-4 text-purple-500" />;
      case 'clean_table':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-rose-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-stone-200">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Chamados de Mesas</h2>
              <p className="text-xs text-stone-400">
                {pendingCalls.length} {pendingCalls.length === 1 ? 'chamado pendente' : 'chamados pendentes'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of Calls */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 bg-stone-50/50">
          {/* Pending Calls */}
          <div className="space-y-3">
            <span className="font-bold text-xs uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Aguardando Atendimento ({pendingCalls.length})
            </span>

            {pendingCalls.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-stone-400 text-xs">
                Nenhum cliente solicitou atendimento no momento.
              </div>
            ) : (
              pendingCalls.map(call => {
                const elapsed = formatElapsedMinutes(call.createdAt);

                return (
                  <div
                    key={call.id}
                    className="bg-white rounded-2xl border border-rose-200 p-4 shadow-xs space-y-3 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-rose-500" />

                    <div className="flex items-start justify-between gap-2 pl-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center">
                          {getCallIcon(call.type)}
                        </div>
                        <div>
                          <h4 className="font-black text-stone-900 text-sm">
                            Mesa {String(call.tableNumber).padStart(2, '0')}
                          </h4>
                          <span className="text-[11px] text-stone-500">
                            {formatTime(call.createdAt)} ({elapsed} min atrás)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pl-2">
                      <p className="text-xs text-stone-700 font-semibold bg-stone-50 p-2 rounded-lg border border-stone-100">
                        {call.message || 'Chamando garçom para a mesa'}
                      </p>
                    </div>

                    <div className="pl-2 pt-1">
                      <button
                        onClick={() => resolveWaiterCall(call.id)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Marcar como Atendido</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Resolved calls */}
          {resolvedCalls.length > 0 && (
            <div className="space-y-2.5 pt-4 border-t border-stone-200">
              <span className="font-bold text-xs uppercase tracking-wider text-stone-400">
                Atendidos Recentemente
              </span>
              <div className="space-y-2">
                {resolvedCalls.map(call => (
                  <div
                    key={call.id}
                    className="bg-white/80 rounded-xl p-3 border border-stone-200 flex items-center justify-between text-xs text-stone-500 opacity-80"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-bold text-stone-800">
                        Mesa {String(call.tableNumber).padStart(2, '0')}
                      </span>
                      <span>• {call.message}</span>
                    </div>
                    <span>{formatTime(call.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
