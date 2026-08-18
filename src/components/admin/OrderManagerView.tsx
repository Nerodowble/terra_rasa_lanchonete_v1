import React, { useState } from 'react';
import { useComanda } from '../../context/ComandaContext';
import { Order, OrderStatus, PaymentStatus, OrderType } from '../../types';
import { formatBRL, formatTime, formatElapsedMinutes, getStatusLabel, getOrderTypeInfo } from '../../utils/formatters';
import { DispatchDeliveryModal } from './DispatchDeliveryModal';
import {
  ClipboardList,
  Search,
  Printer,
  CheckCircle2,
  Clock,
  XCircle,
  Play,
  Sparkles,
  DollarSign,
  Filter,
  Bike,
  Utensils,
  Store,
  MapPin,
  Phone,
  MessageSquare,
  UserCheck,
  Trash2,
} from 'lucide-react';

export const OrderManagerView: React.FC = () => {
  const {
    orders,
    updateOrderStatus,
    updateOrderPayment,
    dispatchOrder,
    setReceiptOrderToPrint,
    clearAllOrders,
  } = useComanda();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<OrderType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>('all');
  const [dispatchModalOrder, setDispatchModalOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter(order => {
    const matchesType = typeFilter === 'all' || order.orderType === typeFilter;
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter;
    
    const searchLower = search.toLowerCase();
    const matchesSearch =
      order.orderNumber.toString().includes(searchLower) ||
      order.customerName.toLowerCase().includes(searchLower) ||
      (order.tableNumber && `mesa ${order.tableNumber}`.includes(searchLower)) ||
      (order.deliveryAddress && order.deliveryAddress.street.toLowerCase().includes(searchLower)) ||
      (order.deliveryAddress && order.deliveryAddress.neighborhood.toLowerCase().includes(searchLower));

    return matchesType && matchesStatus && matchesPayment && matchesSearch;
  });

  const handleWhatsAppNotify = (order: Order) => {
    if (!order.customerPhone) return;
    const cleanPhone = order.customerPhone.replace(/\D/g, '');
    const text = encodeURIComponent(
      `Olá ${order.customerName}! Seu pedido #${order.orderNumber} do Quintal & Sabor ` +
      (order.status === 'dispatched'
        ? `já SAIU PARA ENTREGA com nosso entregador ${order.driverName || 'parceiro'}! 🛵💨`
        : order.status === 'ready'
        ? `já está PRONTO! 🎉`
        : `está em preparo com muito carinho! 🍳`)
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${text}`, '_blank');
  };

  const handleOpenDispatchModal = (order: Order) => {
    setDispatchModalOrder(order);
  };

  const handleConfirmDispatch = (orderId: string, driverName: string) => {
    dispatchOrder(orderId, driverName);
    setDispatchModalOrder(null);
  };

  const deliveryOrdersCount = orders.filter(o => o.orderType === 'delivery').length;
  const tableOrdersCount = orders.filter(o => o.orderType === 'table').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Dispatch Modal */}
      <DispatchDeliveryModal
        isOpen={!!dispatchModalOrder}
        order={dispatchModalOrder}
        onClose={() => setDispatchModalOrder(null)}
        onConfirmDispatch={handleConfirmDispatch}
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-900 text-white p-4 rounded-2xl border border-stone-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">
              Gestor Geral de Pedidos & Delivery
            </h1>
            <p className="text-xs text-stone-400">
              Controle central unificado para entregas em domicílio, consumo no salão e balcão
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="bg-purple-900/60 text-purple-200 border border-purple-700/60 px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
            <Bike className="w-3.5 h-3.5" />
            {deliveryOrdersCount} Delivery
          </span>
          <span className="bg-amber-900/60 text-amber-200 border border-amber-700/60 px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5" />
            {tableOrdersCount} Mesas
          </span>

          {orders.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Tem certeza de que deseja zerar todos os pedidos e históricos do sistema?')) {
                  clearAllOrders();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Zerar Pedidos</span>
            </button>
          )}
        </div>
      </div>

      {/* Type Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setTypeFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            typeFilter === 'all'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          Todos os Pedidos ({orders.length})
        </button>

        <button
          onClick={() => setTypeFilter('delivery')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            typeFilter === 'delivery'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white text-stone-600 hover:bg-purple-50 hover:text-purple-700 border border-stone-200'
          }`}
        >
          <Bike className="w-3.5 h-3.5" />
          <span>Delivery ({deliveryOrdersCount})</span>
        </button>

        <button
          onClick={() => setTypeFilter('table')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            typeFilter === 'table'
              ? 'bg-amber-500 text-stone-950 shadow-sm'
              : 'bg-white text-stone-600 hover:bg-amber-50 hover:text-amber-800 border border-stone-200'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Mesas ({tableOrdersCount})</span>
        </button>

        <button
          onClick={() => setTypeFilter('takeout')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            typeFilter === 'takeout'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-white text-stone-600 hover:bg-teal-50 hover:text-teal-700 border border-stone-200'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Retirada ({orders.filter(o => o.orderType === 'takeout').length})</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por #pedido, cliente, rua ou bairro..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 bg-stone-50 text-stone-900 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as OrderStatus | 'all')}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Todos os Status</option>
            <option value="received">Recebidos</option>
            <option value="preparing">Em Preparo</option>
            <option value="ready">Prontos / Embalados</option>
            <option value="dispatched">Saiu p/ Entrega (Motoboy)</option>
            <option value="delivered">Entregues / Finalizados</option>
            <option value="cancelled">Cancelados</option>
          </select>

          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value as PaymentStatus | 'all')}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Todos os Pagamentos</option>
            <option value="pending">Pagamento Pendente</option>
            <option value="paid">Pago</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-stone-900 text-stone-300 font-bold border-b border-stone-800 text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-4">Pedido #</th>
                <th className="py-3.5 px-4">Tipo & Destino</th>
                <th className="py-3.5 px-4">Cliente / Contato</th>
                <th className="py-3.5 px-4">Itens</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Status Produção</th>
                <th className="py-3.5 px-4">Pagamento</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    Nenhum pedido encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const statusInfo = getStatusLabel(order.status, order.orderType);
                  const typeInfo = getOrderTypeInfo(order.orderType);
                  const elapsed = formatElapsedMinutes(order.createdAt);

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-stone-50/80 transition-colors"
                    >
                      {/* Order number & time */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-stone-900 text-sm">
                          #{order.orderNumber}
                        </div>
                        <div className="text-[11px] text-stone-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(order.createdAt)} ({elapsed} min)</span>
                        </div>
                      </td>

                      {/* Type & Location */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${typeInfo.badge} mb-1`}>
                          {order.orderType === 'delivery' ? (
                            <Bike className="w-3.5 h-3.5" />
                          ) : order.orderType === 'table' ? (
                            <Utensils className="w-3.5 h-3.5" />
                          ) : (
                            <Store className="w-3.5 h-3.5" />
                          )}
                          {typeInfo.label}
                        </span>

                        {order.orderType === 'table' && (
                          <div className="font-extrabold text-stone-900 text-xs">
                            Mesa {String(order.tableNumber).padStart(2, '0')}
                          </div>
                        )}

                        {order.deliveryAddress && (
                          <div className="text-[11px] text-stone-600 max-w-[200px] leading-tight">
                            <span className="font-medium">{order.deliveryAddress.street}, {order.deliveryAddress.number}</span>
                            <span className="text-stone-400 block">{order.deliveryAddress.neighborhood}</span>
                          </div>
                        )}
                      </td>

                      {/* Customer & Phone */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900">
                          {order.customerName}
                        </div>
                        {order.customerPhone ? (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[11px] text-stone-500">{order.customerPhone}</span>
                            <button
                              onClick={() => handleWhatsAppNotify(order)}
                              className="text-emerald-600 hover:text-emerald-700 p-0.5 transition-colors cursor-pointer"
                              title="Notificar no WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-stone-400">Sem telefone</span>
                        )}
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="space-y-0.5">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="text-xs truncate">
                              <span className="font-bold text-stone-800">
                                {item.quantity}x
                              </span>{' '}
                              <span>{item.product.name}</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-stone-900">
                          {formatBRL(order.total)}
                        </div>
                        {order.paymentMethod && (
                          <span className="text-[10px] uppercase font-bold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                            {order.paymentMethod}
                            {order.changeFor ? ` (Troco R$ ${order.changeFor})` : ''}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <select
                          value={order.status}
                          onChange={e => {
                            const newStatus = e.target.value as OrderStatus;
                            if (newStatus === 'dispatched' && order.orderType === 'delivery') {
                              handleOpenDispatchModal(order);
                            } else {
                              updateOrderStatus(order.id, newStatus);
                            }
                          }}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border focus:outline-hidden cursor-pointer ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}
                        >
                          <option value="received">Recebido</option>
                          <option value="preparing">Em Preparo</option>
                          <option value="ready">Pronto / Embalado</option>
                          <option value="dispatched">Saiu p/ Entrega (Motoboy)</option>
                          <option value="delivered">Entregue / Concluído</option>
                          <option value="cancelled">Cancelado</option>
                        </select>

                        {order.driverName && (
                          <div className="text-[10px] text-purple-700 font-bold mt-1 flex items-center gap-1">
                            <Bike className="w-3 h-3" />
                            <span>{order.driverName}</span>
                          </div>
                        )}
                      </td>

                      {/* Payment */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() =>
                            updateOrderPayment(
                              order.id,
                              order.paymentStatus === 'paid' ? 'pending' : 'paid',
                              order.paymentMethod || 'pix'
                            )
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            order.paymentStatus === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {order.paymentStatus === 'paid' ? '✓ Pago' : 'Pendente'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-1">
                        {order.orderType === 'delivery' && (
                          <button
                            onClick={() => handleOpenDispatchModal(order)}
                            title="Despachar Motoboy"
                            className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors cursor-pointer inline-flex items-center"
                          >
                            <Bike className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setReceiptOrderToPrint(order)}
                          title="Imprimir comanda térmica"
                          className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer inline-flex items-center"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
