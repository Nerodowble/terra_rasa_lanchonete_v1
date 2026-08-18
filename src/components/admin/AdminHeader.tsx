import React from 'react';
import { useComanda } from '../../context/ComandaContext';
import { AdminTab } from '../../types';
import {
  ChefHat,
  LayoutGrid,
  ClipboardList,
  Utensils,
  BarChart3,
  Bell,
  Bike,
  Store,
} from 'lucide-react';

interface AdminHeaderProps {
  onOpenWaiterCalls: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onOpenWaiterCalls }) => {
  const {
    adminTab,
    setAdminTab,
    waiterCalls,
    orders,
  } = useComanda();

  const pendingCallsCount = waiterCalls.filter(c => c.status === 'pending').length;
  const pendingOrdersCount = orders.filter(o => o.status === 'received').length;
  const preparingOrdersCount = orders.filter(o => o.status === 'preparing').length;
  const activeDeliveriesCount = orders.filter(
    o => o.orderType === 'delivery' && (o.status === 'ready' || o.status === 'dispatched')
  ).length;

  const tabs: { id: AdminTab; label: string; icon: React.ElementType; badge?: number }[] = [
    {
      id: 'kds',
      label: 'KDS Cozinha & Bar',
      icon: ChefHat,
      badge: pendingOrdersCount + preparingOrdersCount,
    },
    {
      id: 'tables',
      label: 'Mapa de Mesas',
      icon: LayoutGrid,
    },
    {
      id: 'orders',
      label: 'Gestor de Pedidos',
      icon: ClipboardList,
      badge: pendingOrdersCount,
    },
    {
      id: 'deliveries',
      label: 'Entregas & Motoboys',
      icon: Bike,
      badge: activeDeliveriesCount,
    },
    {
      id: 'menu',
      label: 'Gestão de Cardápio',
      icon: Utensils,
    },
    {
      id: 'reports',
      label: 'Relatórios & Caixa',
      icon: BarChart3,
    },
    {
      id: 'settings',
      label: 'Configurações da Loja',
      icon: Store,
    },
  ];

  return (
    <div className="bg-stone-900 border-b border-stone-800 text-stone-100 sticky top-[48px] sm:top-[53px] z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth snap-x touch-pan-x flex-1 py-0.5">
          {tabs.map(tab => {
            const isSelected = adminTab === tab.id;
            const IconComp = tab.icon;

            return (
              <button
                key={tab.id}
                id={`tab-admin-${tab.id}`}
                onClick={() => setAdminTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 snap-start cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <IconComp className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-black shrink-0 ${
                      isSelected
                        ? 'bg-stone-950 text-amber-400'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Action button: Waiter Calls alert badge */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-admin-waiter-calls"
            onClick={onOpenWaiterCalls}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shrink-0 cursor-pointer ${
              pendingCallsCount > 0
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30 animate-pulse'
                : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
            }`}
          >
            <Bell className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${pendingCallsCount > 0 ? 'text-rose-400' : 'text-stone-400'}`} />
            <span className="hidden xs:inline">Chamados</span>
            {pendingCallsCount > 0 ? (
              <span className="bg-rose-500 text-white px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-black">
                {pendingCallsCount}
              </span>
            ) : (
              <span className="text-[10px] text-stone-400">0</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
