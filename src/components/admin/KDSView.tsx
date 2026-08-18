import React, { useState, useEffect } from 'react';
import { useComanda } from '../../context/ComandaContext';
import { Order, OrderStatus, OrderType, PreparationStation } from '../../types';
import { formatBRL, formatTime, formatElapsedMinutes, getOrderTypeInfo } from '../../utils/formatters';
import { DispatchDeliveryModal } from './DispatchDeliveryModal';
import {
  ChefHat,
  Wine,
  Clock,
  Printer,
  CheckCircle2,
  Play,
  ArrowRight,
  Flame,
  AlertTriangle,
  Sparkles,
  Search,
  Bike,
  Utensils,
  Store,
  MapPin,
  Send,
  Trash2,
} from 'lucide-react';

export const KDSView: React.FC = () => {
  const {
    orders,
    updateOrderStatus,
    dispatchOrder,
    setReceiptOrderToPrint,
    clearAllOrders,
  } = useComanda();

  const [selectedStation, setSelectedStation] = useState<'all' | 'kitchen' | 'bar'>('all');
  const [selectedType, setSelectedType] = useState<OrderType | 'all'>('all');
  const [dispatchModalOrder, setDispatchModalOrder] = useState<Order | null>(null);
  const [mobileActiveColumn, setMobileActiveColumn] = useState<'received' | 'preparing' | 'ready' | 'delivered'>('received');
  const [, setTicker] = useState(0);

  // Re-render every 10s to keep elapsed timers strictly up-to-date
  useEffect(() => {
    const interval = setInterval(() => setTicker(t => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  // Filter orders by station and order type
  const filterOrder = (order: Order) => {
    const matchesStation =
      selectedStation === 'all'
        ? true
        : order.items.some(item => item.product.station === selectedStation);

    const matchesType =
      selectedType === 'all'
        ? true
        : order.orderType === selectedType;

    return matchesStation && matchesType;
  };

  const handleDispatchDelivery = (order: Order) => {
    setDispatchModalOrder(order);
  };

  const handleConfirmDispatch = (orderId: string, driverName: string) => {
    dispatchOrder(orderId, driverName);
    setDispatchModalOrder(null);
  };

  const receivedOrders = orders.filter(o => o.status === 'received' && filterOrder(o));
  const preparingOrders = orders.filter(o => o.status === 'preparing' && filterOrder(o));
  const readyAndDispatchedOrders = orders.filter(o => (o.status === 'ready' || o.status === 'dispatched') && filterOrder(o));
  const deliveredOrders = orders.filter(o => o.status === 'delivered' && filterOrder(o)).slice(0, 5);

  const getTimerBadge = (createdAt: string, estimatedTime: number) => {
    const elapsed = formatElapsedMinutes(createdAt);
    const isDelayed = elapsed > estimatedTime;
    const isWarning = elapsed > estimatedTime * 0.75;

    let colorClasses = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    if (isDelayed) {
      colorClasses = 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
    } else if (isWarning) {
      colorClasses = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }

    return (
      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold ${colorClasses}`}>
        {isDelayed ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
        <span>{elapsed} min</span>
        <span className="text-[10px] opacity-75 font-normal">/ {estimatedTime}m</span>
      </div>
    );
  };

  const renderTicket = (order: Order, columnStatus: OrderStatus) => {
    // If filtering by station, highlight or filter items
    const relevantItems =
      selectedStation === 'all'
        ? order.items
        : order.items.filter(i => i.product.station === selectedStation);

    const typeInfo = getOrderTypeInfo(order.orderType);
    const isDelivery = order.orderType === 'delivery';

    return (
      <div
        key={order.id}
        id={`kds-ticket-${order.id}`}
        className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between hover:border-stone-700 transition-all text-white"
      >
        {/* Ticket Header */}
        <div className="p-3.5 bg-stone-950 border-b border-stone-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
              isDelivery ? 'bg-purple-600 text-white' : order.orderType === 'takeout' ? 'bg-teal-600 text-white' : 'bg-amber-500 text-stone-950'
            }`}>
              {isDelivery ? <Bike className="w-4 h-4" /> : order.orderType === 'takeout' ? <Store className="w-4 h-4" /> : `M${order.tableNumber}`}
            </span>
            <div>
              <div className="font-extrabold text-sm text-white flex items-center gap-1.5">
                <span>#{order.orderNumber}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${typeInfo.badge}`}>
                  {typeInfo.label} {order.orderType === 'table' ? `Mesa ${order.tableNumber}` : ''}
                </span>
              </div>
              <div className="text-[11px] text-stone-400">
                {order.customerName} • {formatTime(order.createdAt)}
              </div>
            </div>
          </div>

          {getTimerBadge(order.createdAt, order.estimatedPrepTime)}
        </div>

        {/* Delivery Address Banner */}
        {isDelivery && order.deliveryAddress && (
          <div className="bg-purple-950/70 border-b border-purple-800/40 p-2.5 text-xs text-purple-200 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
            <div className="leading-tight truncate">
              <span className="font-bold text-white">{order.deliveryAddress.street}, {order.deliveryAddress.number}</span>
              <span className="text-purple-300 block text-[10px]">{order.deliveryAddress.neighborhood} {order.deliveryAddress.complement ? `(${order.deliveryAddress.complement})` : ''}</span>
            </div>
          </div>
        )}

        {/* Motoboy Assigned Banner */}
        {order.status === 'dispatched' && (
          <div className="bg-purple-900/50 border-b border-purple-700 p-2 text-xs text-purple-200 flex items-center justify-between font-bold">
            <span className="flex items-center gap-1">
              <Bike className="w-3.5 h-3.5" />
              <span>Em Trânsito: {order.driverName}</span>
            </span>
            <span className="text-[10px] bg-purple-800 px-2 py-0.5 rounded text-purple-100">
              Despachado
            </span>
          </div>
        )}

        {/* Ticket Items Body */}
        <div className="p-3.5 space-y-3 flex-1 overflow-y-auto max-h-[320px]">
          {relevantItems.map((item, idx) => (
            <div
              key={idx}
              className="bg-stone-800/80 rounded-xl p-2.5 border border-stone-700/60 space-y-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-stone-700 text-amber-400 flex items-center justify-center font-black text-xs">
                    {item.quantity}x
                  </span>
                  <span className="font-bold text-sm text-white leading-tight">
                    {item.product.name}
                  </span>
                </div>

                <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-700 text-stone-300 shrink-0 font-medium">
                  {item.product.station === 'kitchen' ? 'Cozinha' : 'Bar'}
                </span>
              </div>

              {/* Options */}
              {item.selectedOptions.length > 0 && (
                <div className="text-xs text-stone-300 pl-8 space-y-0.5">
                  {item.selectedOptions.map((g, gIdx) => (
                    <div key={gIdx} className="flex flex-wrap gap-1">
                      <span className="text-amber-400 font-semibold">{g.groupName}:</span>
                      {g.selectedItems.map(si => (
                        <span key={si.id} className="text-white">
                          {si.name}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Removed ingredients */}
              {item.removedIngredients.length > 0 && (
                <div className="text-xs text-rose-400 font-bold pl-8">
                  ⚠️ SEM: {item.removedIngredients.join(', ')}
                </div>
              )}

              {/* Notes */}
              {item.notes && (
                <div className="text-xs text-amber-300 italic pl-8 bg-amber-500/10 p-1.5 rounded-md border border-amber-500/20">
                  Obs: &quot;{item.notes}&quot;
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Ticket Footer Actions */}
        <div className="p-3 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-2">
          {/* Thermal print button */}
          <button
            onClick={() => setReceiptOrderToPrint(order)}
            title="Imprimir comanda térmica 80mm"
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Status Progression Button */}
          {columnStatus === 'received' && (
            <button
              onClick={() => updateOrderStatus(order.id, 'preparing')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Iniciar Preparo</span>
            </button>
          )}

          {columnStatus === 'preparing' && (
            <button
              onClick={() => updateOrderStatus(order.id, 'ready')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isDelivery ? 'Pronto p/ Embalar' : 'Pronto p/ Servir'}</span>
            </button>
          )}

          {columnStatus === 'ready' && (
            isDelivery ? (
              order.status === 'dispatched' ? (
                <button
                  onClick={() => updateOrderStatus(order.id, 'delivered')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirmar Entrega</span>
                </button>
              ) : (
                <button
                  onClick={() => handleDispatchDelivery(order)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>Despachar Motoboy</span>
                </button>
              )
            ) : (
              <button
                onClick={() => updateOrderStatus(order.id, 'delivered')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{order.orderType === 'takeout' ? 'Entregar ao Cliente' : 'Servir na Mesa'}</span>
              </button>
            )
          )}

          {columnStatus === 'delivered' && (
            <div className="flex-1 text-center py-1.5 text-xs text-stone-400 font-semibold">
              ✓ {isDelivery ? 'Entregue no Endereço' : order.orderType === 'takeout' ? 'Retirado no Balcão' : `Servido na Mesa ${order.tableNumber}`}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Dispatch Modal */}
      <DispatchDeliveryModal
        isOpen={!!dispatchModalOrder}
        order={dispatchModalOrder}
        onClose={() => setDispatchModalOrder(null)}
        onConfirmDispatch={handleConfirmDispatch}
      />

      {/* Top Station Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-stone-900 text-white p-4 rounded-2xl border border-stone-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">
              KDS - Painel de Produção & Expedição
            </h1>
            <p className="text-xs text-stone-400">
              Fila de cozinha, bar e despacho de motoboys em tempo real
            </p>
          </div>
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Order Type Toggle */}
          <div className="flex items-center bg-stone-800 p-1 rounded-xl border border-stone-700">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedType === 'all'
                  ? 'bg-stone-700 text-white'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedType('delivery')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedType === 'delivery'
                  ? 'bg-purple-600 text-white'
                  : 'text-stone-400 hover:text-purple-300'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Delivery</span>
            </button>
            <button
              onClick={() => setSelectedType('table')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedType === 'table'
                  ? 'bg-amber-500 text-stone-950'
                  : 'text-stone-400 hover:text-amber-300'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Mesas</span>
            </button>
          </div>

          {/* Station Filter Buttons */}
          <div className="flex items-center bg-stone-800 p-1 rounded-xl border border-stone-700">
            <button
              onClick={() => setSelectedStation('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedStation === 'all'
                  ? 'bg-amber-500 text-stone-950'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Tudo
            </button>
            <button
              onClick={() => setSelectedStation('kitchen')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedStation === 'kitchen'
                  ? 'bg-amber-500 text-stone-950'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Cozinha</span>
            </button>
            <button
              onClick={() => setSelectedStation('bar')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedStation === 'bar'
                  ? 'bg-amber-500 text-stone-950'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Wine className="w-3.5 h-3.5" />
              <span>Bar</span>
            </button>
          </div>

          {/* Quick Clear All Orders Button */}
          {orders.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Deseja realmente limpar todos os pedidos ativos da fila e zerar as comandas?')) {
                  clearAllOrders();
                }
              }}
              title="Limpar todos os pedidos da fila"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Zerar Fila</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Column Switcher (Visible only on mobile screens < 768px) */}
      <div className="md:hidden flex items-center bg-stone-900 p-1.5 rounded-2xl border border-stone-800 gap-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setMobileActiveColumn('received')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
            mobileActiveColumn === 'received'
              ? 'bg-amber-500 text-stone-950 shadow-sm'
              : 'text-stone-300 hover:bg-stone-800'
          }`}
        >
          <span>Recebidos</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
            mobileActiveColumn === 'received' ? 'bg-stone-950 text-amber-400' : 'bg-stone-800 text-amber-300'
          }`}>
            {receivedOrders.length}
          </span>
        </button>

        <button
          onClick={() => setMobileActiveColumn('preparing')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
            mobileActiveColumn === 'preparing'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-stone-300 hover:bg-stone-800'
          }`}
        >
          <span>Preparo</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
            mobileActiveColumn === 'preparing' ? 'bg-stone-950 text-white' : 'bg-stone-800 text-blue-300'
          }`}>
            {preparingOrders.length}
          </span>
        </button>

        <button
          onClick={() => setMobileActiveColumn('ready')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
            mobileActiveColumn === 'ready'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-stone-300 hover:bg-stone-800'
          }`}
        >
          <span>Prontos</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
            mobileActiveColumn === 'ready' ? 'bg-stone-950 text-white' : 'bg-stone-800 text-emerald-300'
          }`}>
            {readyAndDispatchedOrders.length}
          </span>
        </button>

        <button
          onClick={() => setMobileActiveColumn('delivered')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
            mobileActiveColumn === 'delivered'
              ? 'bg-stone-700 text-white shadow-sm'
              : 'text-stone-300 hover:bg-stone-800'
          }`}
        >
          <span>Histórico</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
            mobileActiveColumn === 'delivered' ? 'bg-stone-950 text-white' : 'bg-stone-800 text-stone-300'
          }`}>
            {deliveredOrders.length}
          </span>
        </button>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Column 1: Recebidos / Novos */}
        <div className={`space-y-3 ${mobileActiveColumn !== 'received' ? 'hidden md:block' : 'block'}`}>
          <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 px-3.5 py-2.5 rounded-xl">
            <div className="flex items-center gap-2 text-amber-700 font-black text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <span>Recebidos</span>
            </div>
            <span className="bg-amber-500 text-stone-950 text-xs font-black px-2 py-0.5 rounded-full">
              {receivedOrders.length}
            </span>
          </div>

          <div className="space-y-3.5 sm:space-y-4">
            {receivedOrders.length === 0 ? (
              <div className="p-8 text-center bg-stone-100 rounded-2xl border border-dashed border-stone-300 text-stone-400 text-xs font-medium">
                Nenhum pedido aguardando início
              </div>
            ) : (
              receivedOrders.map(o => renderTicket(o, 'received'))
            )}
          </div>
        </div>

        {/* Column 2: Em Preparo */}
        <div className={`space-y-3 ${mobileActiveColumn !== 'preparing' ? 'hidden md:block' : 'block'}`}>
          <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/30 px-3.5 py-2.5 rounded-xl">
            <div className="flex items-center gap-2 text-blue-700 font-black text-sm">
              <ChefHat className="w-4 h-4 text-blue-600" />
              <span>Em Preparo</span>
            </div>
            <span className="bg-blue-600 text-white text-xs font-black px-2 py-0.5 rounded-full">
              {preparingOrders.length}
            </span>
          </div>

          <div className="space-y-3.5 sm:space-y-4">
            {preparingOrders.length === 0 ? (
              <div className="p-8 text-center bg-stone-100 rounded-2xl border border-dashed border-stone-300 text-stone-400 text-xs font-medium">
                Nenhum prato na chapa/forno agora
              </div>
            ) : (
              preparingOrders.map(o => renderTicket(o, 'preparing'))
            )}
          </div>
        </div>

        {/* Column 3: Prontos / Expedição / Em Trânsito */}
        <div className={`space-y-3 ${mobileActiveColumn !== 'ready' ? 'hidden md:block' : 'block'}`}>
          <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2.5 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-700 font-black text-sm">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Prontos & Expedição</span>
            </div>
            <span className="bg-emerald-600 text-white text-xs font-black px-2 py-0.5 rounded-full">
              {readyAndDispatchedOrders.length}
            </span>
          </div>

          <div className="space-y-3.5 sm:space-y-4">
            {readyAndDispatchedOrders.length === 0 ? (
              <div className="p-8 text-center bg-stone-100 rounded-2xl border border-dashed border-stone-300 text-stone-400 text-xs font-medium">
                Nenhum prato pronto na expedição
              </div>
            ) : (
              readyAndDispatchedOrders.map(o => renderTicket(o, 'ready'))
            )}
          </div>
        </div>

        {/* Column 4: Entregues Recentemente */}
        <div className={`space-y-3 ${mobileActiveColumn !== 'delivered' ? 'hidden md:block' : 'block'}`}>
          <div className="flex items-center justify-between bg-stone-200 border border-stone-300 px-3.5 py-2.5 rounded-xl">
            <div className="flex items-center gap-2 text-stone-700 font-black text-sm">
              <CheckCircle2 className="w-4 h-4 text-stone-600" />
              <span>Concluídos Recentes</span>
            </div>
            <span className="bg-stone-700 text-white text-xs font-black px-2 py-0.5 rounded-full">
              {deliveredOrders.length}
            </span>
          </div>

          <div className="space-y-3.5 sm:space-y-4 opacity-90">
            {deliveredOrders.length === 0 ? (
              <div className="p-8 text-center bg-stone-100 rounded-2xl border border-dashed border-stone-300 text-stone-400 text-xs font-medium">
                Nenhum histórico recente
              </div>
            ) : (
              deliveredOrders.map(o => renderTicket(o, 'delivered'))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
