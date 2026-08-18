import React from 'react';
import { useComanda } from '../../context/ComandaContext';
import { formatBRL, formatTime, formatElapsedMinutes, getStatusLabel, getOrderTypeInfo } from '../../utils/formatters';
import {
  X,
  Clock,
  CheckCircle2,
  ChefHat,
  Bell,
  UtensilsCrossed,
  Sparkles,
  AlertCircle,
  Bike,
  MapPin,
  Phone,
  Store,
  Navigation,
} from 'lucide-react';

export const OrderTrackerModal: React.FC = () => {
  const {
    isOrderTrackerOpen,
    setIsOrderTrackerOpen,
    orderMode,
    activeTableNumber,
    customerName,
    deliveryAddress,
    orders,
    setIsWaiterModalOpen,
  } = useComanda();

  if (!isOrderTrackerOpen) return null;

  // Filter orders relevant to current client session
  const clientOrders = orders.filter(o => {
    if (orderMode === 'table') {
      return o.tableNumber === activeTableNumber;
    }
    return o.orderType === orderMode;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        id="modal-order-tracker"
        className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-stone-200"
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-200 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              {orderMode === 'delivery' ? (
                <Bike className="w-5 h-5" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {orderMode === 'delivery'
                  ? 'Acompanhamento do Delivery'
                  : 'Acompanhamento de Pedidos'}
              </h2>
              <p className="text-xs text-stone-400">
                {orderMode === 'delivery'
                  ? `Entrega: ${deliveryAddress.street}, ${deliveryAddress.number}`
                  : `Mesa ${String(activeTableNumber).padStart(2, '0')} • Atualização em tempo real`}
              </p>
            </div>
          </div>

          <button
            id="btn-close-order-tracker"
            onClick={() => setIsOrderTrackerOpen(false)}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Orders list */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 bg-stone-50/50">
          {clientOrders.length === 0 ? (
            <div className="py-12 text-center text-stone-500">
              <UtensilsCrossed className="w-10 h-10 mx-auto text-stone-300 mb-2" />
              <p className="font-semibold text-stone-700">Nenhum pedido realizado ainda</p>
              <p className="text-xs text-stone-400 mt-1">
                Seus pedidos enviados aparecerão aqui com o progresso em tempo real.
              </p>
            </div>
          ) : (
            clientOrders.map(order => {
              const elapsed = formatElapsedMinutes(order.createdAt);
              const statusInfo = getStatusLabel(order.status, order.orderType);
              const typeInfo = getOrderTypeInfo(order.orderType);

              const isDelivery = order.orderType === 'delivery';

              const steps = isDelivery
                ? [
                    { key: 'received', label: 'Recebido', icon: Bell },
                    { key: 'preparing', label: 'Na Cozinha', icon: ChefHat },
                    { key: 'dispatched', label: 'A Caminho', icon: Bike },
                    { key: 'delivered', label: 'Entregue', icon: CheckCircle2 },
                  ]
                : [
                    { key: 'received', label: 'Recebido', icon: Bell },
                    { key: 'preparing', label: 'Na Cozinha', icon: ChefHat },
                    { key: 'ready', label: 'Pronto', icon: Sparkles },
                    { key: 'delivered', label: 'Entregue', icon: CheckCircle2 },
                  ];

              const currentStepIndex =
                order.status === 'cancelled'
                  ? -1
                  : steps.findIndex(s => {
                      if (isDelivery && order.status === 'ready' && s.key === 'preparing') return true;
                      return s.key === order.status;
                    });

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs space-y-4"
                >
                  {/* Order header */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-stone-900">
                        Pedido #{order.orderNumber}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${typeInfo.badge}`}>
                        {typeInfo.label}
                      </span>
                      <span className="text-xs text-stone-400">
                        • {formatTime(order.createdAt)} ({elapsed} min atrás)
                      </span>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Delivery Motoboy Banner if dispatched */}
                  {order.status === 'dispatched' && order.driverName && (
                    <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 flex items-center justify-between text-xs text-purple-900">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                          <Bike className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold block">Entregador: {order.driverName}</span>
                          <span className="text-[11px] text-purple-700">Seu pedido já saiu para entrega em seu endereço!</span>
                        </div>
                      </div>
                      <span className="font-semibold text-purple-800 bg-white px-2.5 py-1 rounded-lg border border-purple-200">
                        Chegando em ~10 min
                      </span>
                    </div>
                  )}

                  {/* Delivery destination address */}
                  {order.deliveryAddress && (
                    <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 text-xs flex items-center gap-2 text-stone-600">
                      <MapPin className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>
                        <strong>Entrega em:</strong> {order.deliveryAddress.street}, {order.deliveryAddress.number} - {order.deliveryAddress.neighborhood}
                        {order.deliveryAddress.complement ? ` (${order.deliveryAddress.complement})` : ''}
                      </span>
                    </div>
                  )}

                  {/* Status Progress Bar */}
                  {order.status !== 'cancelled' && (
                    <div className="py-2">
                      <div className="grid grid-cols-4 gap-2 relative">
                        {steps.map((step, idx) => {
                          const isDone = currentStepIndex >= idx;
                          const isCurrent = currentStepIndex === idx;
                          const IconComp = step.icon;

                          return (
                            <div
                              key={step.key}
                              className="flex flex-col items-center text-center space-y-1"
                            >
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                  isCurrent
                                    ? 'bg-amber-500 text-stone-950 ring-4 ring-amber-500/20 font-black'
                                    : isDone
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-stone-100 text-stone-400'
                                }`}
                              >
                                <IconComp className="w-4 h-4" />
                              </div>
                              <span
                                className={`text-[10px] font-semibold leading-tight ${
                                  isCurrent
                                    ? 'text-stone-900 font-bold'
                                    : isDone
                                    ? 'text-emerald-700'
                                    : 'text-stone-400'
                                }`}
                              >
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Item breakdown */}
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 divide-y divide-stone-200/60 text-xs">
                    {order.items.map((item, i) => (
                      <div key={i} className="py-1.5 first:pt-0 last:pb-0 flex justify-between">
                        <div>
                          <span className="font-bold text-stone-800">
                            {item.quantity}x {item.product.name}
                          </span>
                          {item.selectedOptions.length > 0 && (
                            <p className="text-[11px] text-stone-500">
                              {item.selectedOptions.map(g => g.selectedItems.map(si => si.name).join(', ')).join(' • ')}
                            </p>
                          )}
                          {item.notes && (
                            <p className="text-[11px] text-amber-700 italic">
                              Obs: {item.notes}
                            </p>
                          )}
                        </div>
                        <span className="font-semibold text-stone-700">
                          {formatBRL(item.totalPrice)}
                        </span>
                      </div>
                    ))}

                    {order.deliveryFee && order.deliveryFee > 0 && (
                      <div className="py-1.5 flex justify-between text-purple-800">
                        <span>Taxa de Entrega</span>
                        <span>{formatBRL(order.deliveryFee)}</span>
                      </div>
                    )}

                    <div className="pt-2 flex justify-between font-black text-stone-900 text-xs">
                      <span>Total Pago</span>
                      <span>{formatBRL(order.total)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info & action */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {orderMode === 'delivery'
                ? 'Em caso de dúvidas sobre sua entrega, fale conosco pelo WhatsApp.'
                : 'Precisa alterar algo? Chame o garçom para suporte imediato.'}
            </span>
          </div>

          {orderMode === 'table' ? (
            <button
              onClick={() => {
                setIsOrderTrackerOpen(false);
                setIsWaiterModalOpen(true);
              }}
              className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              Chamar Garçom
            </button>
          ) : (
            <button
              onClick={() => setIsOrderTrackerOpen(false)}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              Continuar Pedindo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
