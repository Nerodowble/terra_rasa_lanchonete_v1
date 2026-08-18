import React, { useState } from 'react';
import { ComandaProvider, useComanda } from './context/ComandaContext';
import { HeaderSwitcher } from './components/common/HeaderSwitcher';
import { AdminLoginModal } from './components/common/AdminLoginModal';
import { Lock, ShieldCheck } from 'lucide-react';

// Client Components
import { ClientNavbar } from './components/client/ClientNavbar';
import { CategoryBar } from './components/client/CategoryBar';
import { MenuGrid } from './components/client/MenuGrid';
import { ProductDetailModal } from './components/client/ProductDetailModal';
import { CartDrawer } from './components/client/CartDrawer';
import { OrderTrackerModal } from './components/client/OrderTrackerModal';
import { DigitalBillModal } from './components/client/DigitalBillModal';
import { WaiterCallModal } from './components/client/WaiterCallModal';
import { TableSelectorModal } from './components/client/TableSelectorModal';

// Admin Components
import { AdminHeader } from './components/admin/AdminHeader';
import { KDSView } from './components/admin/KDSView';
import { TablesMapView } from './components/admin/TablesMapView';
import { OrderManagerView } from './components/admin/OrderManagerView';
import { DeliveryManagerView } from './components/admin/DeliveryManagerView';
import { MenuManagerView } from './components/admin/MenuManagerView';
import { ReportsView } from './components/admin/ReportsView';
import { SettingsView } from './components/admin/SettingsView';
import { WaiterCallsDrawer } from './components/admin/WaiterCallsDrawer';
import { ThermalReceiptModal } from './components/admin/ThermalReceiptModal';
import { CategoryId } from './types';

const MainLayout: React.FC = () => {
  const { viewMode, setViewMode, adminTab, isAdminAuthenticated, openAdminLogin } = useComanda();
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [isWaiterCallsDrawerOpen, setIsWaiterCallsDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans selection:bg-amber-400 selection:text-stone-950">
      {/* Top Header Switcher (Client vs Internal Management) */}
      <HeaderSwitcher />

      {/* Dynamic Content based on View Mode */}
      {viewMode === 'client' ? (
        <main className="flex-1 flex flex-col">
          <ClientNavbar />
          <CategoryBar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
          <div className="flex-1">
            <MenuGrid selectedCategory={selectedCategory} />
          </div>

          {/* Client Modals & Drawers */}
          <ProductDetailModal />
          <CartDrawer />
          <OrderTrackerModal />
          <DigitalBillModal />
          <WaiterCallModal />
          <TableSelectorModal />
        </main>
      ) : (
        <main className="flex-1 flex flex-col">
          <AdminHeader onOpenWaiterCalls={() => setIsWaiterCallsDrawerOpen(true)} />
          <div className="flex-1 p-4 max-w-7xl mx-auto w-full">
            {adminTab === 'kds' && <KDSView />}
            {adminTab === 'tables' && <TablesMapView />}
            {adminTab === 'orders' && <OrderManagerView />}
            {adminTab === 'deliveries' && <DeliveryManagerView />}
            {adminTab === 'menu' && <MenuManagerView />}
            {adminTab === 'reports' && <ReportsView />}
            {adminTab === 'settings' && <SettingsView />}
          </div>

          {/* Admin Drawers & Modals */}
          <WaiterCallsDrawer
            isOpen={isWaiterCallsDrawerOpen}
            onClose={() => setIsWaiterCallsDrawerOpen(false)}
          />
          <ThermalReceiptModal />
        </main>
      )}

      {/* Global Admin Login Modal */}
      <AdminLoginModal />

      {/* Subtle Footer with Discreet Management Access */}
      <footer className="py-4 px-4 text-center text-xs text-stone-500 border-t border-stone-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        <p className="text-stone-500">
          Comanda Digital & Gestão KDS Integrada • Responsivo
        </p>

        <button
          id="btn-footer-admin-login"
          onClick={() => {
            if (isAdminAuthenticated) {
              setViewMode('admin');
            } else {
              openAdminLogin();
            }
          }}
          className="inline-flex items-center gap-1.5 text-stone-400 hover:text-stone-700 text-[11px] font-medium transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-stone-50"
        >
          {isAdminAuthenticated ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Painel Gerencial Conectado</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-stone-400" />
              <span>Acesso da Gerência / Cozinha</span>
            </>
          )}
        </button>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ComandaProvider>
      <MainLayout />
    </ComandaProvider>
  );
}
