import React, { useState, useMemo } from 'react';
import { useComanda, DispatchParams, DriverSettlementData } from '../../context/ComandaContext';
import { Order, Courier, CourierType } from '../../types';
import { formatBRL, formatTime } from '../../utils/formatters';
import { DispatchDeliveryModal } from './DispatchDeliveryModal';
import {
  Bike,
  MapPin,
  Clock,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Navigation,
  Send,
  Printer,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  Zap,
  Smartphone,
  ShieldCheck,
  Check,
  X,
  ChevronRight,
  TrendingUp,
  Receipt,
  Search,
  Filter,
} from 'lucide-react';

export const DeliveryManagerView: React.FC = () => {
  const {
    orders,
    couriers,
    config,
    updateOrderStatus,
    markOrderDelivered,
    settleDriverAccounts,
    addCourier,
    updateCourier,
    deleteCourier,
    toggleCourierActive,
    setReceiptOrderToPrint,
    setDriverSettlementToPrint,
  } = useComanda();

  // Active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'live' | 'settlement' | 'couriers'>('live');
  const [searchFilter, setSearchFilter] = useState('');

  // Selected Order for Dispatch Modal
  const [orderToDispatch, setOrderToDispatch] = useState<Order | null>(null);

  // Modal to Confirm Delivery with Cash/Card check
  const [orderToComplete, setOrderToComplete] = useState<Order | null>(null);
  const [completePaymentMethod, setCompletePaymentMethod] = useState<'pix' | 'credit' | 'debit' | 'cash'>('cash');
  const [completeCashReceived, setCompleteCashReceived] = useState<string>('');

  // Courier Form Modal (Add / Edit)
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [editingCourier, setEditingCourier] = useState<Courier | null>(null);
  const [courierName, setCourierName] = useState('');
  const [courierPhone, setCourierPhone] = useState('');
  const [courierVehicle, setCourierVehicle] = useState('');
  const [courierType, setCourierType] = useState<CourierType>('fixed');
  const [courierDefaultFee, setCourierDefaultFee] = useState<number>(6.00);

  // Delivery orders breakdown
  const deliveryOrders = useMemo(() => {
    return orders.filter(o => o.orderType === 'delivery');
  }, [orders]);

  const readyForDispatch = useMemo(() => {
    return deliveryOrders.filter(o => o.status === 'ready' || o.status === 'received' || o.status === 'preparing');
  }, [deliveryOrders]);

  const outOnDelivery = useMemo(() => {
    return deliveryOrders.filter(o => o.status === 'dispatched');
  }, [deliveryOrders]);

  const deliveredToday = useMemo(() => {
    return deliveryOrders.filter(o => o.status === 'delivered');
  }, [deliveryOrders]);

  // Financial calculations for couriers
  const totalRepasseHoje = useMemo(() => {
    return deliveredToday.reduce((acc, o) => acc + (o.driverFee || 0), 0);
  }, [deliveredToday]);

  const totalCashInDriversHands = useMemo(() => {
    // Delivered orders paid in cash that haven't been settled yet
    return deliveredToday
      .filter(o => o.paymentMethod === 'cash' && !o.driverSettled)
      .reduce((acc, o) => acc + (o.cashCollectedByDriver !== undefined ? o.cashCollectedByDriver : o.total), 0);
  }, [deliveredToday]);

  // Settlement breakdown by driver
  const settlementByDriver = useMemo(() => {
    const map = new Map<string, {
      driverName: string;
      driverPhone?: string;
      driverVehicle?: string;
      deliveryType?: CourierType;
      orders: Order[];
      totalFee: number;
      totalCashCollected: number;
      settledCount: number;
      unsettledCount: number;
    }>();

    deliveredToday.forEach(ord => {
      const key = ord.driverName || 'Entregador Geral';
      const existing = map.get(key) || {
        driverName: key,
        driverPhone: ord.driverPhone,
        driverVehicle: ord.driverVehicle,
        deliveryType: ord.deliveryType,
        orders: [],
        totalFee: 0,
        totalCashCollected: 0,
        settledCount: 0,
        unsettledCount: 0,
      };

      existing.orders.push(ord);
      existing.totalFee += ord.driverFee || 0;
      if (ord.paymentMethod === 'cash') {
        existing.totalCashCollected += ord.cashCollectedByDriver !== undefined ? ord.cashCollectedByDriver : ord.total;
      }
      if (ord.driverSettled) {
        existing.settledCount += 1;
      } else {
        existing.unsettledCount += 1;
      }

      map.set(key, existing);
    });

    return Array.from(map.values());
  }, [deliveredToday]);

  // Handle open Courier Modal
  const handleOpenNewCourierModal = () => {
    setEditingCourier(null);
    setCourierName('');
    setCourierPhone('');
    setCourierVehicle('');
    setCourierType('fixed');
    setCourierDefaultFee(config.defaultDriverPayoutFee || 6.00);
    setIsCourierModalOpen(true);
  };

  const handleEditCourier = (c: Courier) => {
    setEditingCourier(c);
    setCourierName(c.name);
    setCourierPhone(c.phone || '');
    setCourierVehicle(c.vehicle || '');
    setCourierType(c.type);
    setCourierDefaultFee(c.defaultFee);
    setIsCourierModalOpen(true);
  };

  const handleSaveCourier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courierName.trim()) return;

    if (editingCourier) {
      updateCourier(editingCourier.id, {
        name: courierName.trim(),
        phone: courierPhone.trim(),
        vehicle: courierVehicle.trim(),
        type: courierType,
        defaultFee: Number(courierDefaultFee) || 0,
      });
    } else {
      addCourier({
        name: courierName.trim(),
        phone: courierPhone.trim(),
        vehicle: courierVehicle.trim(),
        type: courierType,
        defaultFee: Number(courierDefaultFee) || 0,
        active: true,
      });
    }
    setIsCourierModalOpen(false);
  };

  // Open Deliver Modal
  const handleOpenCompleteDelivery = (ord: Order) => {
    setOrderToComplete(ord);
    setCompletePaymentMethod(ord.paymentMethod || 'pix');
    setCompleteCashReceived(ord.changeFor ? String(ord.changeFor) : String(ord.total));
  };

  const handleConfirmCompleteDelivery = () => {
    if (!orderToComplete) return;
    markOrderDelivered(
      orderToComplete.id,
      completePaymentMethod,
      completePaymentMethod === 'cash' ? (parseFloat(completeCashReceived) || orderToComplete.total) : 0
    );
    setOrderToComplete(null);
  };

  const handlePrintSettlement = (driverData: typeof settlementByDriver[0]) => {
    const netBalance = driverData.totalCashCollected - driverData.totalFee;
    const settlementData: DriverSettlementData = {
      driverName: driverData.driverName,
      driverPhone: driverData.driverPhone,
      orders: driverData.orders,
      totalDeliveries: driverData.orders.length,
      totalFee: driverData.totalFee,
      totalCashCollected: driverData.totalCashCollected,
      netBalance,
      date: new Date().toLocaleDateString('pt-BR'),
    };
    setDriverSettlementToPrint(settlementData);
  };

  const getMinutesInRoute = (dispatchedAt?: string) => {
    if (!dispatchedAt) return 0;
    const diffMs = Date.now() - new Date(dispatchedAt).getTime();
    return Math.floor(diffMs / 60000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Aguardando Saída</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">
            {readyForDispatch.filter(o => o.status === 'ready').length}
            <span className="text-xs font-normal text-stone-400 ml-1.5">
              ({readyForDispatch.length} totais)
            </span>
          </div>
          <span className="text-[11px] text-stone-400">Prontos na cozinha</span>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Em Rota (Na Rua)</span>
            <Bike className="w-4 h-4 text-purple-400 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-purple-400">
            {outOnDelivery.length}
          </div>
          <span className="text-[11px] text-stone-400">Com motoboys agora</span>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Entregues Hoje</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {deliveredToday.length}
          </div>
          <span className="text-[11px] text-stone-400">Finalizados com sucesso</span>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Repasse a Pagar</span>
            <DollarSign className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">
            {formatBRL(totalRepasseHoje)}
          </div>
          <span className="text-[11px] text-stone-400">Taxas de corridas</span>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-stone-900 border border-stone-800 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Dinheiro com Motoboys</span>
            <Receipt className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">
            {formatBRL(totalCashInDriversHands)}
          </div>
          <span className="text-[11px] text-stone-400">A acertar no caixa</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('live')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'live'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Bike className="w-4 h-4" />
            <span>Monitor Operacional & Despacho</span>
            {(outOnDelivery.length > 0 || readyForDispatch.length > 0) && (
              <span className="bg-stone-950 text-amber-400 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                {outOnDelivery.length + readyForDispatch.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('settlement')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'settlement'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Fechamento & Acerto Financeiro</span>
            {settlementByDriver.some(s => s.unsettledCount > 0) && (
              <span className="bg-rose-500 text-white px-1.5 py-0.2 rounded-full text-[10px] font-black">
                Pendente
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('couriers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'couriers'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Cadastro de Entregadores ({couriers.length})</span>
          </button>
        </div>

        {activeSubTab === 'couriers' && (
          <button
            onClick={handleOpenNewCourierModal}
            className="w-full sm:w-auto px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Novo Entregador</span>
          </button>
        )}
      </div>

      {/* SUB-TAB 1: LIVE DELIVERY MONITOR & DISPATCH */}
      {activeSubTab === 'live' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Ready / Cooking to Dispatch */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="font-black text-stone-900 text-sm uppercase tracking-wider">
                  1. Pedidos para Despachar ({readyForDispatch.length})
                </h3>
              </div>
              <span className="text-xs text-stone-500 font-medium">Prontos ou em preparo</span>
            </div>

            {readyForDispatch.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-400">
                <Bike className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="font-bold text-sm text-stone-600">Nenhum pedido aguardando entrega</p>
                <p className="text-xs">Novos pedidos de delivery cairão aqui automaticamente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {readyForDispatch.map(ord => {
                  const isReady = ord.status === 'ready';
                  const formattedAddr = ord.deliveryAddress
                    ? `${ord.deliveryAddress.street}, ${ord.deliveryAddress.number} - ${ord.deliveryAddress.neighborhood}`
                    : 'Balcão / Não especificado';

                  return (
                    <div
                      key={ord.id}
                      className={`p-4 rounded-2xl border transition-all bg-white shadow-xs ${
                        isReady
                          ? 'border-amber-400 ring-2 ring-amber-400/30'
                          : 'border-stone-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-xl bg-stone-900 text-amber-400 text-xs font-black">
                            #{ord.orderNumber}
                          </span>
                          <span className="font-bold text-stone-900 text-sm">
                            {ord.customerName}
                          </span>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isReady
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isReady ? '✅ Pronto na Cozinha' : '⏳ Na Chapa / Cozinha'}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 mb-3">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <span className="font-medium text-stone-800">{formattedAddr}</span>
                        </div>
                        {ord.deliveryAddress?.reference && (
                          <div className="text-[11px] text-amber-800 font-semibold pl-5">
                            Ref: {ord.deliveryAddress.reference}
                          </div>
                        )}
                        <div className="flex items-center justify-between text-stone-500 pt-1 border-t border-stone-200/60">
                          <span>{ord.items.length} itens ({ord.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ')})</span>
                          <span className="font-bold text-stone-900">{formatBRL(ord.total)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => setReceiptOrderToPrint(ord)}
                          className="px-3 py-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cupom</span>
                        </button>

                        <button
                          onClick={() => setOrderToDispatch(ord)}
                          className="flex-1 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                        >
                          <Bike className="w-4 h-4" />
                          <span>Despachar / Chamar Motoboy 🛵</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Column 2: Out on Delivery (In Transit) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
                <h3 className="font-black text-stone-900 text-sm uppercase tracking-wider">
                  2. Em Rota de Entrega ({outOnDelivery.length})
                </h3>
              </div>
              <span className="text-xs text-stone-500 font-medium">Na rua com entregador</span>
            </div>

            {outOnDelivery.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-400">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-40 text-emerald-500" />
                <p className="font-bold text-sm text-stone-600">Nenhum motoboy na rua agora</p>
                <p className="text-xs">Assim que despachar um pedido, ele aparecerá aqui com rastreio de tempo.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {outOnDelivery.map(ord => {
                  const minutesInRoute = getMinutesInRoute(ord.dispatchedAt);
                  const isLate = minutesInRoute > 35;
                  const mapsUrl = ord.deliveryAddress
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${ord.deliveryAddress.street}, ${ord.deliveryAddress.number}, ${ord.deliveryAddress.neighborhood}, ${ord.deliveryAddress.city}`
                      )}`
                    : '';

                  return (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl border border-purple-200 bg-purple-50/30 shadow-xs space-y-3"
                    >
                      {/* Order top info */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg bg-purple-900 text-purple-200 text-xs font-black">
                              #{ord.orderNumber}
                            </span>
                            <span className="font-black text-stone-900 text-sm">
                              {ord.customerName}
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-500">
                            Saiu às {ord.dispatchedAt ? formatTime(ord.dispatchedAt) : 'agora'}
                          </span>
                        </div>

                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold ${
                          isLate ? 'bg-rose-100 text-rose-800 animate-pulse' : 'bg-purple-100 text-purple-900'
                        }`}>
                          <Clock className="w-3.5 h-3.5" />
                          <span>Na rua há {minutesInRoute} min</span>
                        </div>
                      </div>

                      {/* Driver & Fee pill */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-purple-200 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                            {ord.deliveryType === 'own' ? '👤' : ord.deliveryType === 'app' ? '📱' : '🛵'}
                          </div>
                          <div>
                            <span className="font-bold text-stone-900 block">
                              {ord.driverName || 'Entregador'}
                            </span>
                            <span className="text-[10px] text-stone-500">
                              {ord.driverVehicle || (ord.deliveryType === 'own' ? 'Entrega Própria' : 'Moto')}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-stone-500 block">Taxa Repasse</span>
                          <span className="font-bold text-purple-900">{formatBRL(ord.driverFee || 0)}</span>
                        </div>
                      </div>

                      {/* Destination Address & GPS */}
                      <div className="text-xs text-stone-700 bg-white p-2.5 rounded-xl border border-stone-200 space-y-1">
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-medium text-stone-800">
                                {ord.deliveryAddress?.street}, nº {ord.deliveryAddress?.number}
                                {ord.deliveryAddress?.complement ? ` (${ord.deliveryAddress.complement})` : ''}
                              </span>
                              <div className="text-[11px] text-stone-500">
                                {ord.deliveryAddress?.neighborhood}
                              </div>
                            </div>
                          </div>

                          {mapsUrl && (
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 bg-stone-100 hover:bg-blue-50 text-blue-700 text-[11px] font-bold rounded-lg flex items-center gap-1 shrink-0"
                            >
                              <Navigation className="w-3 h-3" />
                              GPS
                            </a>
                          )}
                        </div>

                        {/* Payment check */}
                        <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-[11px]">
                          <span className="text-stone-600">
                            {ord.paymentStatus === 'paid' ? '✅ Pago Online' : `💵 Cobrar ${formatBRL(ord.total)} (${ord.paymentMethod?.toUpperCase() || 'Dinheiro'})`}
                          </span>
                          {ord.paymentMethod === 'cash' && ord.changeFor && (
                            <span className="text-amber-800 font-bold">
                              Troco p/ {formatBRL(ord.changeFor)}: {formatBRL(ord.changeFor - ord.total)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {/* WhatsApp to courier */}
                        {ord.driverPhone && (
                          <button
                            onClick={() => {
                              const clean = ord.driverPhone?.replace(/\D/g, '');
                              window.open(`https://wa.me/55${clean}`, '_blank');
                            }}
                            className="px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center gap-1 hover:bg-emerald-100 transition-colors cursor-pointer"
                            title="Falar com Motoboy"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Whats</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenCompleteDelivery(ord)}
                          className="flex-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Confirmar Entrega Realizada</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SETTLEMENT & DRIVER FINANCIAL CLOSING */}
      {activeSubTab === 'settlement' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-black text-stone-900 text-base">
                  Acerto Financeiro de Entregadores & Fechamento de Caixa
                </h3>
                <p className="text-xs text-stone-500">
                  Controle de taxas devidas aos motoboys e prestação de contas do dinheiro recolhido na rua
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => settleDriverAccounts()}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-amber-400 font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Liquidar Todos os Acertos</span>
                </button>
              </div>
            </div>

            {settlementByDriver.length === 0 ? (
              <div className="p-8 text-center text-stone-400 bg-stone-50 rounded-xl border border-stone-200">
                <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="font-bold text-stone-600 text-sm">Nenhuma entrega concluída hoje ainda</p>
                <p className="text-xs">Assim que as entregas forem marcadas como concluídas, o fechamento dos motoboys será consolidado aqui.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {settlementByDriver.map((driver, idx) => {
                  const netBalance = driver.totalCashCollected - driver.totalFee;
                  const isAllSettled = driver.unsettledCount === 0;

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all bg-white flex flex-col justify-between ${
                        isAllSettled
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : 'border-stone-200 shadow-sm'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black">
                              <Bike className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-black text-stone-900 text-sm">{driver.driverName}</h4>
                              <span className="text-[11px] text-stone-500">
                                {driver.orders.length} {driver.orders.length === 1 ? 'entrega realizada' : 'entregas realizadas'}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              isAllSettled
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isAllSettled ? '✅ Acerto Feito' : `${driver.unsettledCount} a acertar`}
                          </span>
                        </div>

                        {/* Financial summary breakdown */}
                        <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-stone-600">
                            <span>Taxas Ganhas pelo Motoboy:</span>
                            <span className="font-bold text-purple-900">{formatBRL(driver.totalFee)}</span>
                          </div>

                          <div className="flex items-center justify-between text-stone-600">
                            <span>Dinheiro Recolhido na Rua:</span>
                            <span className="font-bold text-stone-900">{formatBRL(driver.totalCashCollected)}</span>
                          </div>

                          <div className="pt-2 border-t border-stone-200 flex items-center justify-between font-black">
                            <span className="text-stone-800">Saldo da Prestação:</span>
                            <span
                              className={`text-sm ${
                                netBalance > 0
                                  ? 'text-emerald-700'
                                  : netBalance < 0
                                  ? 'text-rose-700'
                                  : 'text-stone-700'
                              }`}
                            >
                              {netBalance > 0
                                ? `Motoboy devolve ${formatBRL(netBalance)}`
                                : netBalance < 0
                                ? `Loja paga ${formatBRL(Math.abs(netBalance))}`
                                : 'Zerado (Contas Quites)'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-4 mt-2 border-t border-stone-100">
                        <button
                          onClick={() => handlePrintSettlement(driver)}
                          className="px-3 py-2 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Imprimir Comprovante Térmico de Acerto"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cupom Acerto</span>
                        </button>

                        {!isAllSettled && (
                          <button
                            onClick={() => settleDriverAccounts(driver.driverName)}
                            className="flex-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Confirmar Acerto</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: COURIER MANAGEMENT (CADASTRO DE ENTREGADORES) */}
      {activeSubTab === 'couriers' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-black text-stone-900 text-base">
                  Equipe de Entregadores & Tarifas Padrão
                </h3>
                <p className="text-xs text-stone-500">
                  Gerencie quem entrega seus pedidos e defina o valor padrão de repasse por corrida
                </p>
              </div>

              <button
                onClick={handleOpenNewCourierModal}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Entregador</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {couriers.map(courier => {
                return (
                  <div
                    key={courier.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      courier.active
                        ? 'border-stone-200 bg-white shadow-xs'
                        : 'border-stone-200 bg-stone-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center font-bold">
                          {courier.type === 'own' ? (
                            <UserCheck className="w-5 h-5 text-amber-600" />
                          ) : courier.type === 'app' ? (
                            <Smartphone className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Bike className="w-5 h-5 text-purple-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-stone-900 text-sm">{courier.name}</h4>
                          <span className="text-[11px] text-stone-500">
                            {courier.type === 'own'
                              ? 'Entrega Própria'
                              : courier.type === 'fixed'
                              ? 'Motoboy Fixo da Loja'
                              : courier.type === 'freelancer'
                              ? 'Freelancer / Avulso'
                              : 'App Terceirizado'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleCourierActive(courier.id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          courier.active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                        }`}
                      >
                        {courier.active ? 'Ativo' : 'Inativo'}
                      </button>
                    </div>

                    <div className="space-y-1.5 text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Veículo:</span>
                        <span className="font-semibold text-stone-800">{courier.vehicle || 'Não informado'}</span>
                      </div>
                      {courier.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Telefone / Whats:</span>
                          <span className="font-semibold text-stone-800">{courier.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1 border-t border-stone-200">
                        <span className="text-stone-500 font-medium">Repasse por Corrida:</span>
                        <span className="font-black text-purple-900">{formatBRL(courier.defaultFee)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditCourier(courier)}
                        className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      {courier.type !== 'own' && (
                        <button
                          onClick={() => deleteCourier(courier.id)}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* DISPATCH MODAL */}
      {orderToDispatch && (
        <DispatchDeliveryModal
          order={orderToDispatch}
          isOpen={!!orderToDispatch}
          onClose={() => setOrderToDispatch(null)}
        />
      )}

      {/* CONFIRM DELIVERY MODAL */}
      {orderToComplete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-5 border border-stone-200 animate-in fade-in zoom-in-95 duration-150 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-stone-900 text-base">
                    Finalizar Entrega #{orderToComplete.orderNumber}
                  </h3>
                  <span className="text-xs text-stone-500">{orderToComplete.customerName}</span>
                </div>
              </div>
              <button
                onClick={() => setOrderToComplete(null)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-stone-600">Total do Pedido:</span>
                <span className="text-stone-950 text-sm font-black">{formatBRL(orderToComplete.total)}</span>
              </div>
              <div className="flex items-center justify-between text-stone-500">
                <span>Entregador responsável:</span>
                <span className="font-bold text-stone-800">{orderToComplete.driverName || 'Entregador'}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 block">
                Forma de Pagamento Confirmada:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['pix', 'credit', 'debit', 'cash'] as const).map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setCompletePaymentMethod(method)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      completePaymentMethod === method
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    {method === 'pix' ? 'PIX' : method === 'credit' ? 'Crédito' : method === 'debit' ? 'Débito' : 'Dinheiro'}
                  </button>
                ))}
              </div>
            </div>

            {completePaymentMethod === 'cash' && (
              <div className="space-y-1 bg-amber-50 p-3 rounded-xl border border-amber-200">
                <label className="text-[11px] font-bold text-amber-950 block">
                  Valor recebido em Dinheiro pelo Motoboy:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-amber-700">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={completeCashReceived}
                    onChange={e => setCompleteCashReceived(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-amber-300 bg-white text-stone-900 font-bold focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setOrderToComplete(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmCompleteDelivery}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Entrega Concluída</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT COURIER MODAL */}
      {isCourierModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-5 border border-stone-200 animate-in fade-in zoom-in-95 duration-150 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-stone-900 text-base">
                    {editingCourier ? 'Editar Entregador' : 'Novo Entregador'}
                  </h3>
                  <span className="text-xs text-stone-500">Defina o tipo e o valor de repasse</span>
                </div>
              </div>
              <button
                onClick={() => setIsCourierModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCourier} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-stone-600 uppercase block mb-1">
                  Nome do Entregador *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Motoboy"
                  value={courierName}
                  onChange={e => setCourierName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white text-stone-900 font-semibold focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-stone-600 uppercase block mb-1">
                    WhatsApp / Telefone
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 99999-8888"
                    value={courierPhone}
                    onChange={e => setCourierPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white text-stone-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-600 uppercase block mb-1">
                    Veículo / Modelo
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: CG Fan 160"
                    value={courierVehicle}
                    onChange={e => setCourierVehicle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white text-stone-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-600 uppercase block mb-1">
                  Tipo de Vínculo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'fixed', label: 'Fixo da Loja' },
                    { id: 'freelancer', label: 'Freelancer' },
                    { id: 'own', label: 'Próprio / Dono' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setCourierType(t.id as CourierType)}
                      className={`p-2 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                        courierType === t.id
                          ? 'border-amber-500 bg-amber-50 text-amber-950 ring-1 ring-amber-500'
                          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-600 uppercase block mb-1">
                  Repasse Padrão por Corrida (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-stone-500">R$</span>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={courierDefaultFee}
                    onChange={e => setCourierDefaultFee(parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 bg-white text-stone-900 font-bold focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsCourierModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Entregador</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
