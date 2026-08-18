import React, { useState, useEffect } from 'react';
import { Order, CourierType } from '../../types';
import { useComanda } from '../../context/ComandaContext';
import { formatBRL } from '../../utils/formatters';
import {
  Bike,
  MapPin,
  User,
  Phone,
  Check,
  X,
  Send,
  Navigation,
  DollarSign,
  UserCheck,
  Zap,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Copy,
} from 'lucide-react';

interface DispatchDeliveryModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDispatch?: (orderId: string, driverName: string) => void;
}

export const DispatchDeliveryModal: React.FC<DispatchDeliveryModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const { couriers, dispatchOrder, config } = useComanda();

  const [deliveryMode, setDeliveryMode] = useState<'courier' | 'own' | 'freelancer' | 'app'>('courier');
  const [selectedCourierId, setSelectedCourierId] = useState<string>('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverVehicle, setDriverVehicle] = useState('');
  const [driverFee, setDriverFee] = useState<number>(config.defaultDriverPayoutFee || 6.00);
  const [trackingCode, setTrackingCode] = useState('');
  const [notifyCustomerWhatsApp, setNotifyCustomerWhatsApp] = useState(true);
  const [copiedInfo, setCopiedInfo] = useState(false);

  // Active couriers from context
  const activeCouriers = couriers.filter(c => c.active);

  useEffect(() => {
    if (order && isOpen) {
      if (order.courierId) {
        setSelectedCourierId(order.courierId);
        const match = couriers.find(c => c.id === order.courierId);
        if (match) {
          setDeliveryMode(match.type);
          setDriverName(match.name);
          setDriverPhone(match.phone || '');
          setDriverVehicle(match.vehicle || '');
          setDriverFee(order.driverFee !== undefined ? order.driverFee : match.defaultFee);
        }
      } else if (order.driverName) {
        setDriverName(order.driverName);
        setDriverPhone(order.driverPhone || '');
        setDriverVehicle(order.driverVehicle || '');
        setDriverFee(order.driverFee || 6.00);
        setDeliveryMode(order.deliveryType || 'courier');
      } else {
        // Default to first active courier or own delivery
        const defaultCourier = activeCouriers.find(c => c.type !== 'own') || activeCouriers[0];
        if (defaultCourier) {
          setSelectedCourierId(defaultCourier.id);
          setDeliveryMode(defaultCourier.type);
          setDriverName(defaultCourier.name);
          setDriverPhone(defaultCourier.phone || '');
          setDriverVehicle(defaultCourier.vehicle || '');
          setDriverFee(defaultCourier.defaultFee);
        } else {
          setDeliveryMode('own');
          setDriverName('Eu Mesmo (Entrega Própria)');
          setDriverPhone(config.phone || '');
          setDriverVehicle('Veículo Próprio');
          setDriverFee(0);
        }
      }
    }
  }, [order, isOpen, couriers, config.defaultDriverPayoutFee, config.phone]);

  if (!isOpen || !order) return null;

  const handleSelectPresetCourier = (courierId: string) => {
    setSelectedCourierId(courierId);
    const selected = couriers.find(c => c.id === courierId);
    if (selected) {
      setDeliveryMode(selected.type);
      setDriverName(selected.name);
      setDriverPhone(selected.phone || '');
      setDriverVehicle(selected.vehicle || '');
      setDriverFee(selected.defaultFee);
    }
  };

  const handleSelectModeTab = (mode: 'courier' | 'own' | 'freelancer' | 'app') => {
    setDeliveryMode(mode);
    if (mode === 'own') {
      const ownCourier = couriers.find(c => c.type === 'own');
      setSelectedCourierId(ownCourier?.id || 'courier-own');
      setDriverName(ownCourier?.name || 'Eu Mesmo (Entrega Própria)');
      setDriverPhone(ownCourier?.phone || config.phone || '');
      setDriverVehicle(ownCourier?.vehicle || 'Moto / Carro Próprio');
      setDriverFee(0);
    } else if (mode === 'courier') {
      const firstFixed = couriers.find(c => c.type === 'fixed' && c.active) || activeCouriers[0];
      if (firstFixed) {
        setSelectedCourierId(firstFixed.id);
        setDriverName(firstFixed.name);
        setDriverPhone(firstFixed.phone || '');
        setDriverVehicle(firstFixed.vehicle || '');
        setDriverFee(firstFixed.defaultFee);
      }
    } else if (mode === 'freelancer') {
      setSelectedCourierId('');
      setDriverName('');
      setDriverPhone('');
      setDriverVehicle('Moto Avulsa');
      setDriverFee(config.defaultDriverPayoutFee || 7.00);
    } else if (mode === 'app') {
      const appCourier = couriers.find(c => c.type === 'app');
      setSelectedCourierId(appCourier?.id || 'courier-app');
      setDriverName(appCourier?.name || 'App Terceirizado (Lalamove/iFood)');
      setDriverPhone('');
      setDriverVehicle('App Entrega');
      setDriverFee(appCourier?.defaultFee || 8.50);
    }
  };

  const formattedAddressText = order.deliveryAddress
    ? `${order.deliveryAddress.street}, ${order.deliveryAddress.number}${
        order.deliveryAddress.complement ? ` (${order.deliveryAddress.complement})` : ''
      } - ${order.deliveryAddress.neighborhood}, ${order.deliveryAddress.city}`
    : 'Retirada no Balcão';

  const mapsQuery = order.deliveryAddress
    ? encodeURIComponent(
        `${order.deliveryAddress.street}, ${order.deliveryAddress.number}, ${order.deliveryAddress.neighborhood}, ${order.deliveryAddress.city}`
      )
    : '';

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  const wazeUrl = `https://waze.com/ul?q=${mapsQuery}`;

  const courierWhatsAppSummary = `🛵 *ENTREGA #${order.orderNumber} - ${config.name}*\n` +
    `👤 *Cliente:* ${order.customerName}\n` +
    (order.customerPhone ? `📞 *Tel. Cliente:* ${order.customerPhone}\n` : '') +
    `📍 *Endereço:* ${formattedAddressText}\n` +
    (order.deliveryAddress?.reference ? `🚩 *Referência:* ${order.deliveryAddress.reference}\n` : '') +
    `🗺️ *GPS Rota:* ${mapsUrl}\n\n` +
    `📦 *Itens do Pedido:*\n` +
    order.items.map(i => `• ${i.quantity}x ${i.product.name}`).join('\n') +
    `\n\n💰 *Total Pedido:* ${formatBRL(order.total)}\n` +
    `💳 *Cobrar no Local:* ${
      order.paymentStatus === 'paid'
        ? 'NADA (Já Pago via PIX/Online ✅)'
        : `${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'DINHEIRO/CARTÃO'} - Cobrar ${formatBRL(order.total)}` +
          (order.paymentMethod === 'cash' && order.changeFor ? ` (Levar Troco p/ ${formatBRL(order.changeFor)}: ${formatBRL(order.changeFor - order.total)})` : '')
    }\n` +
    (driverFee > 0 ? `💵 *Seu Repasse da Corrida:* ${formatBRL(driverFee)}\n` : '');

  const copyCourierText = () => {
    navigator.clipboard.writeText(courierWhatsAppSummary);
    setCopiedInfo(true);
    setTimeout(() => setCopiedInfo(false), 2500);
  };

  const handleSendToCourierWhatsApp = () => {
    if (!driverPhone) return;
    const cleanPhone = driverPhone.replace(/\D/g, '');
    const encoded = encodeURIComponent(courierWhatsAppSummary);
    window.open(`https://wa.me/55${cleanPhone}?text=${encoded}`, '_blank');
  };

  const handleConfirm = () => {
    const finalName = driverName.trim() || (deliveryMode === 'own' ? 'Eu Mesmo (Entrega Própria)' : 'Entregador');

    dispatchOrder(order.id, {
      courierId: selectedCourierId || undefined,
      deliveryType: deliveryMode,
      driverName: finalName,
      driverPhone: driverPhone.trim(),
      driverVehicle: driverVehicle.trim(),
      driverFee: Number(driverFee) || 0,
      trackingUrlOrCode: trackingCode.trim(),
    });

    // Notify client via WhatsApp if selected
    if (notifyCustomerWhatsApp && order.customerPhone) {
      const cleanPhone = order.customerPhone.replace(/\D/g, '');
      if (cleanPhone.length >= 10) {
        const msg = encodeURIComponent(
          `Olá, *${order.customerName}*! 🛵💨\n\n` +
            `Seu pedido *#${String(order.orderNumber).padStart(4, '0')}* do *${config.name}* acabou de sair para entrega!\n\n` +
            `🛵 *Entregador:* ${finalName}${driverVehicle ? ` (${driverVehicle})` : ''}\n` +
            `📍 *Endereço:* ${formattedAddressText}\n` +
            `💰 *Total:* ${formatBRL(order.total)}\n` +
            `💳 *Pagamento:* ${order.paymentStatus === 'paid' ? 'Já Pago Online ✅' : (order.paymentMethod ? order.paymentMethod.toUpperCase() : 'Na Entrega')}\n\n` +
            `Agradecemos pela preferência! Bom apetite! 😋`
        );
        window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, '_blank');
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-md">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white leading-tight">
                  Despachar Pedido #{order.orderNumber}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-stone-800 text-amber-400 text-xs font-bold">
                  {order.customerName}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Escolha o tipo de entrega, defina o repasse e envie as coordenadas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Quick Route & Destination Card */}
          <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                <div className="text-xs text-stone-800">
                  <div className="font-bold text-stone-900">{formattedAddressText}</div>
                  {order.deliveryAddress?.reference && (
                    <div className="text-[11px] text-amber-800 font-semibold mt-0.5">
                      Ref: {order.deliveryAddress.reference}
                    </div>
                  )}
                  {order.customerPhone && (
                    <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-600" />
                      {order.customerPhone}
                    </div>
                  )}
                </div>
              </div>

              {/* GPS Navigation Buttons */}
              {order.deliveryAddress && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-stone-300 hover:border-blue-500 hover:text-blue-600 text-stone-700 text-[11px] font-bold flex items-center gap-1 transition-colors"
                    title="Abrir no Google Maps"
                  >
                    <Navigation className="w-3.5 h-3.5 text-blue-600" />
                    Maps
                  </a>
                  <a
                    href={wazeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-stone-300 hover:border-cyan-500 hover:text-cyan-700 text-stone-700 text-[11px] font-bold flex items-center gap-1 transition-colors"
                    title="Abrir no Waze"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-600" />
                    Waze
                  </a>
                </div>
              )}
            </div>

            {/* Financial summary banner */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-200">
              <span className="text-stone-600 font-medium">
                Cobrança:{' '}
                <strong className="text-stone-900">
                  {order.paymentStatus === 'paid' ? 'Pago Online (PIX/Cartão)' : `A Cobrar (${order.paymentMethod?.toUpperCase() || 'Dinheiro'})`}
                </strong>
              </span>
              <span className="font-black text-sm text-stone-900">
                {formatBRL(order.total)}
                {order.paymentMethod === 'cash' && order.changeFor ? (
                  <span className="text-[10px] text-amber-700 font-bold ml-1">
                    (Troco p/ {formatBRL(order.changeFor)}: {formatBRL(order.changeFor - order.total)})
                  </span>
                ) : null}
              </span>
            </div>
          </div>

          {/* Delivery Mode Tabs */}
          <div>
            <label className="text-xs font-black text-stone-700 uppercase tracking-wider block mb-2">
              Modo de Entrega
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleSelectModeTab('own')}
                className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  deliveryMode === 'own'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-500 font-bold'
                    : 'border-stone-200 bg-white hover:border-stone-300 text-stone-700'
                }`}
              >
                <UserCheck className="w-5 h-5 text-amber-600" />
                <span className="text-xs font-bold">Eu Mesmo</span>
                <span className="text-[10px] text-stone-500">Entrega Própria</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectModeTab('courier')}
                className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  deliveryMode === 'courier'
                    ? 'border-purple-600 bg-purple-50 text-purple-950 ring-2 ring-purple-600 font-bold'
                    : 'border-stone-200 bg-white hover:border-stone-300 text-stone-700'
                }`}
              >
                <Bike className="w-5 h-5 text-purple-600" />
                <span className="text-xs font-bold">Equipe Fixa</span>
                <span className="text-[10px] text-stone-500">Motoboys Loja</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectModeTab('freelancer')}
                className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  deliveryMode === 'freelancer'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-600 font-bold'
                    : 'border-stone-200 bg-white hover:border-stone-300 text-stone-700'
                }`}
              >
                <Zap className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold">Avulso / Diária</span>
                <span className="text-[10px] text-stone-500">Motoboy Externo</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectModeTab('app')}
                className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  deliveryMode === 'app'
                    ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-600 font-bold'
                    : 'border-stone-200 bg-white hover:border-stone-300 text-stone-700'
                }`}
              >
                <Smartphone className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-bold">App Entrega</span>
                <span className="text-[10px] text-stone-500">Lalamove / iFood</span>
              </button>
            </div>
          </div>

          {/* Preset Couriers Picker (if fixed or freelancer list) */}
          {deliveryMode === 'courier' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 block">
                Escolha o Motoboy da Lista:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {activeCouriers
                  .filter(c => c.type === 'fixed' || c.type === 'freelancer')
                  .map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectPresetCourier(c.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedCourierId === c.id
                          ? 'border-purple-600 bg-purple-50 text-purple-950 ring-1 ring-purple-600'
                          : 'border-stone-200 bg-white hover:border-stone-300 text-stone-800'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span>{c.name}</span>
                        {selectedCourierId === c.id && <Check className="w-3.5 h-3.5 text-purple-600" />}
                      </div>
                      <div className="text-[10px] text-stone-500 flex items-center justify-between mt-1">
                        <span>{c.vehicle || 'Moto'}</span>
                        <span className="font-bold text-purple-800">Repasse: {formatBRL(c.defaultFee)}</span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Form Fields: Name, Vehicle, Phone, Driver Fee */}
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-stone-600 uppercase block mb-1">
                  Nome do Entregador *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Motoboy"
                  value={driverName}
                  onChange={e => setDriverName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white text-stone-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-600 uppercase block mb-1">
                  WhatsApp / Celular do Entregador
                </label>
                <input
                  type="text"
                  placeholder="Ex: (11) 99111-2233"
                  value={driverPhone}
                  onChange={e => setDriverPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-stone-600 uppercase block mb-1">
                  Veículo / Placa
                </label>
                <input
                  type="text"
                  placeholder="Ex: Honda Fan 160 Vermelha"
                  value={driverVehicle}
                  onChange={e => setDriverVehicle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-600 uppercase block mb-1">
                  Taxa de Repasse ao Entregador (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-stone-500">R$</span>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    placeholder="0.00"
                    value={driverFee}
                    onChange={e => setDriverFee(parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 bg-white text-stone-900 font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick WhatsApp Tools for Motoboy & Client */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700">
              <span>Ações Rápidas de Despacho</span>
              <button
                type="button"
                onClick={copyCourierText}
                className="text-[11px] text-stone-600 hover:text-stone-900 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                {copiedInfo ? 'Copiado!' : 'Copiar Comanda do Motoboy'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Send Order to Courier WhatsApp */}
              <button
                type="button"
                onClick={handleSendToCourierWhatsApp}
                disabled={!driverPhone}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                  driverPhone
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-950 hover:bg-emerald-100'
                    : 'border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Send className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-bold block">WhatsApp do Motoboy</span>
                  <span className="text-[10px] text-emerald-800">
                    {driverPhone ? `Enviar endereço & GPS` : 'Preencha o celular acima'}
                  </span>
                </div>
              </button>

              {/* Notify Client Checkbox */}
              <label className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-950 flex items-center gap-2.5 cursor-pointer hover:bg-blue-100 transition-colors">
                <input
                  type="checkbox"
                  checked={notifyCustomerWhatsApp}
                  onChange={e => setNotifyCustomerWhatsApp(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold block">Avisar Cliente no WhatsApp</span>
                  <span className="text-[10px] text-blue-800">
                    Avisa que o motoboy saiu agora
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-2 shrink-0">
          <div className="text-xs text-stone-500 font-medium hidden sm:block">
            {deliveryMode === 'own' ? (
              <span className="text-amber-800 font-bold">✨ Entrega própria (sem repasse a terceiros)</span>
            ) : (
              <span>
                Repasse ao motoboy: <strong className="text-stone-900">{formatBRL(driverFee)}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs flex items-center gap-2 shadow-md transition-colors cursor-pointer"
            >
              <Bike className="w-4 h-4" />
              <span>Confirmar Saída para Entrega</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

