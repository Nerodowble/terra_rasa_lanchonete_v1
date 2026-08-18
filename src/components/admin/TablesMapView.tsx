import React, { useState } from 'react';
import { useComanda } from '../../context/ComandaContext';
import { RestaurantTable, TableStatus, Product, CartItem } from '../../types';
import { formatBRL, formatElapsedMinutes, formatTime, getTableStatusInfo } from '../../utils/formatters';
import {
  LayoutGrid,
  Users,
  Clock,
  ReceiptText,
  Plus,
  CheckCircle,
  X,
  Printer,
  CreditCard,
  QrCode,
  Banknote,
  Search,
  UserPlus,
} from 'lucide-react';

export const TablesMapView: React.FC = () => {
  const {
    tables,
    orders,
    products,
    getOrdersByTable,
    closeTable,
    occupyTable,
    requestBillForTable,
    setReceiptOrderToPrint,
    config,
    addToCart,
  } = useComanda();

  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [filterStatus, setFilterStatus] = useState<TableStatus | 'all'>('all');
  const [isAddingItemModalOpen, setIsAddingItemModalOpen] = useState(false);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<Product | null>(null);
  const [newCustomerName, setNewCustomerName] = useState('');

  const filteredTables = tables.filter(
    t => filterStatus === 'all' || t.status === filterStatus
  );

  const totalOccupied = tables.filter(t => t.status === 'occupied' || t.status === 'bill_requested').length;
  const totalAvailable = tables.filter(t => t.status === 'available').length;

  const handleOpenTableDrawer = (table: RestaurantTable) => {
    setSelectedTable(table);
  };

  const handleCloseDrawer = () => {
    setSelectedTable(null);
  };

  const getTableStats = (tableNumber: number) => {
    const tableOrders = getOrdersByTable(tableNumber).filter(o => o.status !== 'cancelled');
    const total = tableOrders.reduce((acc, o) => acc + o.total, 0);
    return { orders: tableOrders, total };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Overview & Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-900 text-white p-4 rounded-2xl border border-stone-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">
              Mapa de Mesas & Comandas
            </h1>
            <p className="text-xs text-stone-400">
              Controle em tempo real de ocupação, consumo acumulado e fechamento de conta
            </p>
          </div>
        </div>

        {/* Quick status filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            Todas ({tables.length})
          </button>
          <button
            onClick={() => setFilterStatus('occupied')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'occupied'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            Ocupadas ({totalOccupied})
          </button>
          <button
            onClick={() => setFilterStatus('available')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'available'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            Livres ({totalAvailable})
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredTables.map(tbl => {
          const stats = getTableStats(tbl.tableNumber);
          const statusInfo = getTableStatusInfo(tbl.status);
          const elapsed = tbl.openedAt ? formatElapsedMinutes(tbl.openedAt) : 0;

          return (
            <div
              key={tbl.tableNumber}
              id={`table-card-${tbl.tableNumber}`}
              onClick={() => handleOpenTableDrawer(tbl)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[160px] hover:shadow-md hover:border-amber-400/80 ${
                tbl.status === 'occupied'
                  ? 'bg-blue-50/50 border-blue-200'
                  : tbl.status === 'bill_requested'
                  ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400'
                  : tbl.status === 'reserved'
                  ? 'bg-purple-50/50 border-purple-200'
                  : 'bg-white border-stone-200 hover:bg-stone-50'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-black text-stone-900">
                    {tbl.name}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-stone-500 font-semibold">
                    <Users className="w-3 h-3" />
                    {tbl.capacity}
                  </span>
                </div>

                {/* Status badge */}
                <div className="mb-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${statusInfo.badgeBg}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>

                {/* Customer name if occupied */}
                {tbl.customerName ? (
                  <p className="text-xs font-bold text-stone-800 truncate">
                    {tbl.customerName}
                  </p>
                ) : (
                  <p className="text-xs text-stone-400 italic">Disponível</p>
                )}
              </div>

              {/* Footer info with total or time */}
              <div className="pt-2 border-t border-stone-200/60 mt-2 flex items-center justify-between text-xs">
                {tbl.status === 'occupied' || tbl.status === 'bill_requested' ? (
                  <>
                    <div className="flex items-center gap-1 text-stone-500 text-[11px]">
                      <Clock className="w-3 h-3" />
                      <span>{elapsed}m</span>
                    </div>
                    <span className="font-black text-stone-900">
                      {formatBRL(stats.total)}
                    </span>
                  </>
                ) : (
                  <span className="text-[11px] text-stone-400 font-medium">Toque p/ abrir</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Detail Drawer Modal */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col justify-between border-l border-stone-200">
            {/* Header */}
            <div className="p-5 border-b border-stone-200 bg-stone-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white">
                    {selectedTable.name} • Comanda Geral
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-stone-800 text-amber-400 font-bold">
                    Capacidade {selectedTable.capacity}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  {selectedTable.customerName
                    ? `Cliente: ${selectedTable.customerName}`
                    : 'Mesa atualmente livre'}
                </p>
              </div>

              <button
                onClick={handleCloseDrawer}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1 bg-stone-50/50">
              {/* If Table is Available: Occupy Action */}
              {selectedTable.status === 'available' ? (
                <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-base">Abrir Comanda nesta Mesa</h3>
                    <p className="text-xs text-stone-500 mt-1">
                      Informe o nome do cliente ou grupo para abrir a comanda.
                    </p>
                  </div>

                  <div className="text-left space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 block">
                      Nome do Cliente / Responsável
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Pedro Alvares"
                      value={newCustomerName}
                      onChange={e => setNewCustomerName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-200 text-sm bg-stone-50 text-stone-900 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <button
                    onClick={() => {
                      occupyTable(
                        selectedTable.tableNumber,
                        newCustomerName.trim() || `Cliente Mesa ${selectedTable.tableNumber}`
                      );
                      setNewCustomerName('');
                      handleCloseDrawer();
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    Confirmar Abertura de Mesa
                  </button>
                </div>
              ) : (
                /* If Table is Occupied */
                <div className="space-y-4">
                  {/* Occupied summary banner */}
                  <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-500 font-medium">Status da Mesa:</span>
                      <span className="font-bold text-stone-900 uppercase">
                        {getTableStatusInfo(selectedTable.status).label}
                      </span>
                    </div>
                    {selectedTable.openedAt && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-stone-500 font-medium">Aberta às:</span>
                        <span className="font-bold text-stone-800">
                          {formatTime(selectedTable.openedAt)} ({formatElapsedMinutes(selectedTable.openedAt)} min de permanência)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* List of Orders from this table */}
                  <div className="space-y-3">
                    <span className="font-bold text-xs uppercase tracking-wider text-stone-500">
                      Histórico de Pedidos da Comanda
                    </span>

                    {getOrdersByTable(selectedTable.tableNumber).length === 0 ? (
                      <div className="p-6 bg-white rounded-2xl border border-stone-200 text-center text-stone-400 text-xs">
                        Nenhum pedido lançado ainda nesta comanda.
                      </div>
                    ) : (
                      getOrdersByTable(selectedTable.tableNumber).map(order => (
                        <div
                          key={order.id}
                          className="bg-white rounded-2xl border border-stone-200 p-3.5 space-y-2 shadow-xs"
                        >
                          <div className="flex justify-between items-center text-xs pb-1.5 border-b border-stone-100">
                            <span className="font-black text-stone-900">
                              Pedido #{order.orderNumber} ({formatTime(order.createdAt)})
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-emerald-700">
                                {formatBRL(order.total)}
                              </span>
                              <button
                                onClick={() => setReceiptOrderToPrint(order)}
                                title="Imprimir ticket deste pedido"
                                className="p-1 text-stone-400 hover:text-stone-700"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1 text-xs">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-stone-700">
                                <span>
                                  {item.quantity}x {item.product.name}
                                </span>
                                <span>{formatBRL(item.totalPrice)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Totals and Table Closing Actions */}
            {selectedTable.status !== 'available' && (
              <div className="p-4 bg-stone-50 border-t border-stone-200 space-y-3 shrink-0">
                {/* Total amount */}
                <div className="flex items-center justify-between text-stone-900 font-black text-base">
                  <span>Total Acumulado</span>
                  <span className="text-emerald-700 text-xl">
                    {formatBRL(getTableStats(selectedTable.tableNumber).total)}
                  </span>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const ordersToPrint = getOrdersByTable(selectedTable.tableNumber);
                      if (ordersToPrint.length > 0) {
                        setReceiptOrderToPrint(ordersToPrint[0]);
                      }
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Prévia</span>
                  </button>

                  <button
                    id="btn-close-table-comanda"
                    onClick={() => {
                      closeTable(selectedTable.tableNumber);
                      handleCloseDrawer();
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Fechar e Liberar Mesa</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
