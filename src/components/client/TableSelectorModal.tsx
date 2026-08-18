import React, { useState } from 'react';
import { useComanda } from '../../context/ComandaContext';
import { OrderType, DeliveryAddress } from '../../types';
import { formatBRL } from '../../utils/formatters';
import {
  X,
  MapPin,
  User,
  Phone,
  Check,
  QrCode,
  Bike,
  Utensils,
  ShoppingBag,
  Home,
  Clock,
  Sparkles,
} from 'lucide-react';

export const TableSelectorModal: React.FC = () => {
  const {
    isTableSelectorOpen,
    setIsTableSelectorOpen,
    orderMode,
    setOrderMode,
    activeTableNumber,
    setActiveTableNumber,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    deliveryAddress,
    setDeliveryAddress,
    tables,
    config,
  } = useComanda();

  const [tempMode, setTempMode] = useState<OrderType>(orderMode);
  const [tempTable, setTempTable] = useState<number>(activeTableNumber);
  const [tempName, setTempName] = useState<string>(customerName);
  const [tempPhone, setTempPhone] = useState<string>(customerPhone);
  const [tempAddress, setTempAddress] = useState<DeliveryAddress>({ ...deliveryAddress });

  if (!isTableSelectorOpen) return null;

  const handleSave = () => {
    setOrderMode(tempMode);
    if (tempMode === 'table') {
      setActiveTableNumber(tempTable);
    }
    if (tempName.trim()) setCustomerName(tempName.trim());
    if (tempPhone.trim()) setCustomerPhone(tempPhone.trim());
    if (tempMode === 'delivery') {
      setDeliveryAddress(tempAddress);
    }
    setIsTableSelectorOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        id="modal-order-mode-selector"
        className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-stone-200 my-8"
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-200 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              {tempMode === 'delivery' ? (
                <Bike className="w-5 h-5" />
              ) : tempMode === 'table' ? (
                <Utensils className="w-5 h-5" />
              ) : (
                <ShoppingBag className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Como deseja receber seu pedido?
              </h2>
              <p className="text-xs text-stone-400">
                Delivery em domicílio, Mesa no restaurante ou Retirada
              </p>
            </div>
          </div>

          <button
            id="btn-close-mode-selector"
            onClick={() => setIsTableSelectorOpen(false)}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 text-stone-800 max-h-[75vh] overflow-y-auto">
          {/* Mode Selector Segmented Tabs */}
          <div className="grid grid-cols-3 gap-2 bg-stone-100 p-1.5 rounded-2xl border border-stone-200">
            <button
              id="tab-mode-delivery"
              type="button"
              onClick={() => setTempMode('delivery')}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all cursor-pointer ${
                tempMode === 'delivery'
                  ? 'bg-amber-500 text-stone-950 font-black shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 font-semibold'
              }`}
            >
              <Bike className="w-4 h-4 mb-1" />
              <span className="text-xs">Delivery 🛵</span>
            </button>

            <button
              id="tab-mode-table"
              type="button"
              onClick={() => setTempMode('table')}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all cursor-pointer ${
                tempMode === 'table'
                  ? 'bg-amber-500 text-stone-950 font-black shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 font-semibold'
              }`}
            >
              <Utensils className="w-4 h-4 mb-1" />
              <span className="text-xs">Mesa 🍽️</span>
            </button>

            <button
              id="tab-mode-takeout"
              type="button"
              onClick={() => setTempMode('takeout')}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all cursor-pointer ${
                tempMode === 'takeout'
                  ? 'bg-amber-500 text-stone-950 font-black shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 font-semibold'
              }`}
            >
              <ShoppingBag className="w-4 h-4 mb-1" />
              <span className="text-xs">Retirar 🛍️</span>
            </button>
          </div>

          {/* Customer Info (Name & Phone) */}
          <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
              <User className="w-3.5 h-3.5 text-amber-600" />
              <span>Seus Dados de Contato</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-stone-600 block mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Ex: Beatriz Albuquerque"
                    value={tempName}
                    onChange={e => setTempName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-600 block mb-1">
                  WhatsApp (p/ Notificação)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={tempPhone}
                    onChange={e => setTempPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Conditional Options based on Mode */}
          {tempMode === 'delivery' && (
            <div className="space-y-3 bg-purple-50/50 p-4 rounded-2xl border border-purple-200/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                  <Home className="w-4 h-4 text-purple-600" />
                  <span>Endereço de Entrega</span>
                </div>
                <span className="text-[11px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                  Taxa: {formatBRL(config.deliveryFee)} ({config.estimatedDeliveryMinutes} min)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-stone-600 uppercase block mb-1">
                    Rua / Avenida *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Av. Brigadeiro Faria Lima"
                    value={tempAddress.street}
                    onChange={e => setTempAddress(prev => ({ ...prev, street: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white text-stone-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-600 uppercase block mb-1">
                    Número *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 2100"
                    value={tempAddress.number}
                    onChange={e => setTempAddress(prev => ({ ...prev, number: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white text-stone-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-stone-600 uppercase block mb-1">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Itaim Bibi"
                    value={tempAddress.neighborhood}
                    onChange={e => setTempAddress(prev => ({ ...prev, neighborhood: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white text-stone-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-600 uppercase block mb-1">
                    Complemento / Apto
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Apto 82, Bloco 2"
                    value={tempAddress.complement || ''}
                    onChange={e => setTempAddress(prev => ({ ...prev, complement: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white text-stone-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-stone-600 uppercase block mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: São Paulo"
                    value={tempAddress.city}
                    onChange={e => setTempAddress(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white text-stone-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-600 uppercase block mb-1">
                    Ponto de Referência
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Próximo ao Shopping"
                    value={tempAddress.reference || ''}
                    onChange={e => setTempAddress(prev => ({ ...prev, reference: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white text-stone-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {tempMode === 'table' && (
            <div className="space-y-3 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 block">
                  Selecione sua Mesa no Restaurante
                </span>
                <span className="text-[11px] font-medium text-amber-700">
                  Taxa de serviço ({config.serviceFeePercent}%)
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {tables.map(tbl => {
                  const isSelected = tempTable === tbl.tableNumber;

                  return (
                    <button
                      key={tbl.tableNumber}
                      type="button"
                      onClick={() => setTempTable(tbl.tableNumber)}
                      className={`py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500 text-stone-950 font-black shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 bg-white text-stone-800'
                      }`}
                    >
                      <div className="text-sm font-extrabold">{tbl.name}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-stone-900 font-medium' : 'text-stone-400'}`}>
                        {tbl.capacity} {tbl.capacity === 1 ? 'lugar' : 'lugares'}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-amber-200/60 flex items-center gap-2 text-xs text-stone-600">
                <QrCode className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Na mesa física, você também pode escanear o QR Code da plaquinha.</span>
              </div>
            </div>
          )}

          {tempMode === 'takeout' && (
            <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 text-xs text-teal-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShoppingBag className="w-4 h-4 text-teal-700" />
                <span>Retirada no Balcão</span>
              </div>
              <p className="text-stone-600">
                Seu pedido será preparado com agilidade. Avisaremos no seu WhatsApp e na tela assim que estiver pronto para retirar no balcão de entregas.
              </p>
              <div className="flex items-center gap-2 font-semibold text-teal-800">
                <Clock className="w-4 h-4" />
                <span>Tempo estimado de preparo: 15 a 25 minutos (Sem taxas extras)</span>
              </div>
            </div>
          )}

          {/* Save Action */}
          <button
            id="btn-confirm-order-mode"
            onClick={handleSave}
            className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>
              {tempMode === 'delivery'
                ? 'Confirmar Endereço de Delivery'
                : tempMode === 'table'
                ? `Confirmar Mesa ${String(tempTable).padStart(2, '0')}`
                : 'Confirmar Retirada no Balcão'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
