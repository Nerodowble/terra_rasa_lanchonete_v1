import React from 'react';
import { useComanda } from '../../context/ComandaContext';
import { formatBRL } from '../../utils/formatters';
import {
  ShoppingBag,
  Bell,
  ReceiptText,
  MapPin,
  Clock,
  ChevronRight,
  Bike,
  Utensils,
  Store,
  Sparkles,
} from 'lucide-react';

export const ClientNavbar: React.FC = () => {
  const {
    orderMode,
    activeTableNumber,
    customerName,
    deliveryAddress,
    cart,
    setIsCartDrawerOpen,
    setIsBillModalOpen,
    setIsWaiterModalOpen,
    setIsOrderTrackerOpen,
    setIsTableSelectorOpen,
    orders,
  } = useComanda();

  // Find active orders belonging to client
  const activeOrders = orders.filter(o => {
    if (orderMode === 'table') {
      return o.tableNumber === activeTableNumber && (o.status === 'received' || o.status === 'preparing' || o.status === 'ready');
    }
    // Delivery or Takeout
    return (o.orderType === orderMode) && (o.status === 'received' || o.status === 'preparing' || o.status === 'ready' || o.status === 'dispatched');
  });

  const tableOrders = orders.filter(o => o.orderType === 'table' && o.tableNumber === activeTableNumber && o.status !== 'cancelled');
  const tableTotal = tableOrders.reduce((acc, curr) => acc + curr.total, 0);

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Delivery status badge helper
  const latestActiveOrder = activeOrders[0];

  return (
    <div className="bg-stone-900 text-stone-100 border-b border-stone-800 shadow-sm sticky top-[48px] sm:top-[53px] z-30">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2">
        {/* Mode & Address / Table Trigger */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <button
            id="btn-open-mode-selector"
            onClick={() => setIsTableSelectorOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 bg-stone-800 hover:bg-stone-700/80 px-2 sm:px-3 py-1.5 rounded-xl border border-stone-700/80 transition-all text-left group cursor-pointer shrink-0 max-w-[130px] xs:max-w-[170px] sm:max-w-none"
          >
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
              {orderMode === 'delivery' ? (
                <Bike className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : orderMode === 'table' ? (
                <Utensils className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="font-bold text-xs sm:text-sm text-white truncate">
                  {orderMode === 'delivery'
                    ? 'Delivery'
                    : orderMode === 'table'
                    ? `Mesa ${String(activeTableNumber).padStart(2, '0')}`
                    : 'Retirada'}
                </span>
                <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>
              <span className="text-[10px] sm:text-[11px] text-stone-400 block truncate">
                {orderMode === 'delivery'
                  ? `${deliveryAddress.street || 'Endereço'}, ${deliveryAddress.number || ''}`
                  : customerName || 'Definir cliente'}
              </span>
            </div>
          </button>

          {/* Active Orders Tracker Badge */}
          {activeOrders.length > 0 && (
            <button
              id="btn-open-order-tracker"
              onClick={() => setIsOrderTrackerOpen(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold hover:bg-blue-500/30 transition-all animate-pulse shrink-0 cursor-pointer"
            >
              {latestActiveOrder?.status === 'dispatched' ? (
                <>
                  <Bike className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">🛵 Saiu p/ entrega!</span>
                  <span className="sm:hidden">🛵 A caminho</span>
                </>
              ) : latestActiveOrder?.status === 'ready' ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Pedido Pronto!</span>
                  <span className="sm:hidden">Pronto!</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden md:inline">
                    {activeOrders.length === 1 ? '1 pedido em preparo' : `${activeOrders.length} em preparo`}
                  </span>
                  <span className="md:hidden">{activeOrders.length} preparo</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Call Waiter (Only in Table mode) */}
          {orderMode === 'table' && (
            <button
              id="btn-call-waiter"
              onClick={() => setIsWaiterModalOpen(true)}
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-medium transition-colors cursor-pointer shrink-0"
              title="Chamar garçom ou pedir assistência"
            >
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span className="hidden md:inline">Garçom</span>
            </button>
          )}

          {/* Table Bill & Comanda Summary (Only in Table mode with orders) */}
          {orderMode === 'table' && tableOrders.length > 0 && (
            <button
              id="btn-view-bill"
              onClick={() => setIsBillModalOpen(true)}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-medium transition-colors cursor-pointer shrink-0"
              title="Ver comanda acumulada e pedir a conta"
            >
              <ReceiptText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span className="hidden sm:inline">Comanda:</span>
              <span className="font-bold text-emerald-400">{formatBRL(tableTotal)}</span>
            </button>
          )}

          {/* Cart Trigger */}
          <button
            id="btn-open-cart"
            onClick={() => setIsCartDrawerOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm shadow-sm transition-all relative shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Sacola</span>
            {cartItemCount > 0 ? (
              <span className="bg-stone-950 text-amber-400 px-1.5 py-0.2 rounded-full text-[11px] sm:text-xs font-black min-w-[18px] text-center">
                {cartItemCount}
              </span>
            ) : (
              <span className="text-xs font-semibold opacity-90">0</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
