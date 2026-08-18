import React, { useState } from 'react';
import { useComanda } from '../../context/ComandaContext';
import { WaiterCallType } from '../../types';
import {
  X,
  Bell,
  ReceiptText,
  Utensils,
  Wine,
  Sparkles,
  CheckCircle,
  MessageSquare,
} from 'lucide-react';

export const WaiterCallModal: React.FC = () => {
  const {
    isWaiterModalOpen,
    setIsWaiterModalOpen,
    activeTableNumber,
    callWaiter,
  } = useComanda();

  const [selectedType, setSelectedType] = useState<WaiterCallType>('waiter');
  const [customMessage, setCustomMessage] = useState('');
  const [callSent, setCallSent] = useState(false);

  if (!isWaiterModalOpen) return null;

  const presets: { type: WaiterCallType; label: string; desc: string; icon: React.ElementType }[] = [
    { type: 'waiter', label: 'Chamar Garçom', desc: 'Atendimento presencial na mesa', icon: Bell },
    { type: 'bill', label: 'Pedir a Conta', desc: 'Trazer a comanda e máquina de cartão', icon: ReceiptText },
    { type: 'cutlery', label: 'Talheres & Guardanapos', desc: 'Pratos, talheres extras ou copos', icon: Utensils },
    { type: 'ice_lemon', label: 'Mais Gelo & Limão', desc: 'Complemento para suas bebidas', icon: Wine },
    { type: 'clean_table', label: 'Limpar a Mesa', desc: 'Retirar pratos vazios ou limpar', icon: Sparkles },
    { type: 'custom', label: 'Outro Pedido', desc: 'Escrever uma mensagem específica', icon: MessageSquare },
  ];

  const handleSendCall = () => {
    callWaiter(activeTableNumber, selectedType, customMessage.trim());
    setCallSent(true);

    setTimeout(() => {
      setCallSent(false);
      setIsWaiterModalOpen(false);
      setCustomMessage('');
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        id="modal-waiter-call"
        className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-stone-200"
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-200 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Chamar Atendimento
              </h2>
              <p className="text-xs text-stone-400">
                Mesa {String(activeTableNumber).padStart(2, '0')}
              </p>
            </div>
          </div>

          <button
            id="btn-close-waiter-modal"
            onClick={() => setIsWaiterModalOpen(false)}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {callSent ? (
          <div className="p-8 text-center space-y-3 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-stone-900">Garçom Avisado!</h3>
            <p className="text-xs text-stone-500 max-w-xs">
              Sua solicitação foi enviada aos garçons e ao painel da recepção. Um atendente estará em sua mesa em instantes.
            </p>
          </div>
        ) : (
          <div className="p-5 space-y-4 text-stone-800">
            <span className="font-bold text-xs uppercase tracking-wider text-stone-500">
              Qual é a sua solicitação?
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {presets.map(item => {
                const isSelected = selectedType === item.type;
                const IconComp = item.icon;

                return (
                  <button
                    key={item.type}
                    onClick={() => setSelectedType(item.type)}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/60 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-amber-500 text-stone-950 font-bold'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-stone-900 leading-tight">
                        {item.label}
                      </h4>
                      <p className="text-[11px] text-stone-500 mt-0.5 leading-tight">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom message field */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-stone-700 block">
                Detalhes adicionais (opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Preciso de 2 copos extras com gelo..."
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                className="w-full p-3 rounded-xl border border-stone-200 text-xs sm:text-sm bg-stone-50 text-stone-900 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            {/* Submit */}
            <button
              id="btn-confirm-call-waiter"
              onClick={handleSendCall}
              className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4" />
              <span>Enviar Chamada para Atendimento</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
