import React, { useState } from 'react';
import { useComanda } from '../../context/ComandaContext';
import { PaymentMethod, OrderType } from '../../types';
import { formatBRL } from '../../utils/formatters';
import confetti from 'canvas-confetti';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ChefHat,
  ShoppingBag,
  User,
  Phone,
  CheckCircle,
  ArrowRight,
  Bike,
  Utensils,
  Store,
  MapPin,
  CreditCard,
  QrCode,
  Banknote,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    orderMode,
    setOrderMode,
    cart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartServiceFee,
    cartDeliveryFee,
    cartTotal,
    includeServiceFeeInCart,
    setIncludeServiceFeeInCart,
    activeTableNumber,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    deliveryAddress,
    setDeliveryAddress,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    cashChangeFor,
    setCashChangeFor,
    placeOrder,
    setIsOrderTrackerOpen,
    config,
  } = useComanda();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrderNum, setSuccessOrderNum] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isCartDrawerOpen) return null;

  const handleSendOrder = async () => {
    setFormError(null);
    if (cart.length === 0 || isSubmitting) return;

    // Store status validation
    if (config.isOpen === false) {
      setFormError('O estabelecimento está FECHADO no momento. Não é possível enviar pedidos enquanto o restaurante estiver offline.');
      return;
    }

    // Delivery validation
    if (orderMode === 'delivery') {
      if (!deliveryAddress.street.trim() || !deliveryAddress.number.trim() || !deliveryAddress.neighborhood.trim()) {
        setFormError('Por favor, preencha o endereço completo de entrega (Rua, Número e Bairro).');
        return;
      }
      if (!customerName.trim()) {
        setFormError('Por favor, informe seu nome para a entrega.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const createdOrder = await placeOrder({
        orderType: orderMode,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        deliveryAddress: orderMode === 'delivery' ? deliveryAddress : undefined,
        paymentMethod: selectedPaymentMethod,
        changeFor: selectedPaymentMethod === 'cash' && cashChangeFor ? Number(cashChangeFor) : undefined,
      });

      if (createdOrder) {
        setSuccessOrderNum(createdOrder.orderNumber);

        // Confetti celebration
        try {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }

        setTimeout(() => {
          setSuccessOrderNum(null);
          setIsCartDrawerOpen(false);
          setIsOrderTrackerOpen(true);
        }, 1800);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        id="drawer-cart"
        className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-stone-200 animate-in slide-in-from-right duration-300"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              {orderMode === 'delivery' ? (
                <Bike className="w-4 h-4" />
              ) : orderMode === 'table' ? (
                <Utensils className="w-4 h-4" />
              ) : (
                <Store className="w-4 h-4" />
              )}
            </div>
            <div>
              <h2 className="font-black text-base text-white">Sua Sacola</h2>
              <p className="text-xs text-stone-400">
                {orderMode === 'delivery'
                  ? 'Delivery em Domicílio'
                  : orderMode === 'table'
                  ? `Mesa ${String(activeTableNumber).padStart(2, '0')} • Comanda`
                  : 'Retirada no Balcão'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                id="btn-clear-cart"
                onClick={clearCart}
                className="text-xs text-stone-400 hover:text-rose-400 px-2 py-1 rounded transition-colors cursor-pointer"
                title="Esvaziar carrinho"
              >
                Limpar
              </button>
            )}
            <button
              id="btn-close-cart"
              onClick={() => setIsCartDrawerOpen(false)}
              className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {successOrderNum ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                {orderMode === 'delivery' ? 'Pedido Delivery Enviado!' : 'Pedido Confirmado!'}
              </span>
              <h3 className="text-2xl font-black text-stone-900 mt-1">
                Pedido #{successOrderNum}
              </h3>
              <p className="text-xs text-stone-500 mt-2 max-w-xs mx-auto">
                {orderMode === 'delivery'
                  ? 'Seu pedido já foi para a cozinha e nosso motoboy entregará quentinho no seu endereço!'
                  : 'Seu pedido foi enviado diretamente para o painel de produção da cozinha.'}
              </p>
            </div>
          </div>
        ) : cart.length === 0 ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-stone-800 text-base">Sua sacola está vazia</h3>
            <p className="text-xs text-stone-500 max-w-xs">
              Explore os pratos, combos e bebidas artesanais do cardápio e adicione aqui.
            </p>
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="mt-2 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 cursor-pointer"
            >
              Ver Cardápio
            </button>
          </div>
        ) : (
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {/* Mode selector tab in cart */}
            <div className="grid grid-cols-3 gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => setOrderMode('delivery')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  orderMode === 'delivery'
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Delivery</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderMode('table')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  orderMode === 'table'
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Mesa</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderMode('takeout')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  orderMode === 'takeout'
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Retirada</span>
              </button>
            </div>

            {/* Error banner if any */}
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Delivery address & info inputs */}
            {orderMode === 'delivery' && (
              <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                    <MapPin className="w-3.5 h-3.5 text-purple-600" />
                    <span>Endereço de Entrega</span>
                  </div>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                    {cartSubtotal >= config.freeDeliveryThreshold
                      ? '🎉 Entrega Grátis'
                      : `Taxa: ${formatBRL(config.deliveryFee)}`}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Rua / Avenida *"
                    value={deliveryAddress.street}
                    onChange={e => setDeliveryAddress(prev => ({ ...prev, street: e.target.value }))}
                    className="col-span-2 px-2.5 py-1.5 text-xs rounded-lg border border-purple-200 bg-white text-stone-900 focus:ring-1 focus:ring-purple-500 focus:outline-hidden"
                  />
                  <input
                    type="text"
                    placeholder="Nº *"
                    value={deliveryAddress.number}
                    onChange={e => setDeliveryAddress(prev => ({ ...prev, number: e.target.value }))}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-purple-200 bg-white text-stone-900 focus:ring-1 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Bairro *"
                    value={deliveryAddress.neighborhood}
                    onChange={e => setDeliveryAddress(prev => ({ ...prev, neighborhood: e.target.value }))}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-purple-200 bg-white text-stone-900 focus:ring-1 focus:ring-purple-500 focus:outline-hidden"
                  />
                  <input
                    type="text"
                    placeholder="Complemento / Apto"
                    value={deliveryAddress.complement || ''}
                    onChange={e => setDeliveryAddress(prev => ({ ...prev, complement: e.target.value }))}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-purple-200 bg-white text-stone-900 focus:ring-1 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            {/* Customer identification */}
            <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                    Nome {orderMode === 'delivery' ? '*' : ''}
                  </label>
                  <input
                    type="text"
                    placeholder="Seu Nome"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 bg-white text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                    WhatsApp (Avisos)
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 bg-white text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector (For Delivery & Takeout) */}
            {orderMode !== 'table' && (
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80 space-y-2">
                <span className="text-[10px] font-bold text-stone-600 uppercase block">
                  Forma de Pagamento (na entrega / retirada)
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('pix')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedPaymentMethod === 'pix'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <QrCode className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                    <span className="text-[11px] block">PIX</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('credit')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedPaymentMethod === 'credit'
                        ? 'border-blue-500 bg-blue-50 text-blue-950 font-bold'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                    <span className="text-[11px] block">Cartão</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('cash')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedPaymentMethod === 'cash'
                        ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <Banknote className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                    <span className="text-[11px] block">Dinheiro</span>
                  </button>
                </div>

                {selectedPaymentMethod === 'cash' && (
                  <div className="pt-1.5">
                    <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                      Precisa de troco para quanto? (Deixe em branco se não precisar)
                    </label>
                    <div className="relative">
                      <DollarSign className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        placeholder="Ex: 100"
                        value={cashChangeFor}
                        onChange={e => setCashChangeFor(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-white text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* List of cart items */}
            <div className="space-y-3 pt-1">
              <span className="text-xs font-bold text-stone-700 block">
                Itens Adicionados ({cart.reduce((a, b) => a + b.quantity, 0)})
              </span>

              {cart.map(item => (
                <div
                  key={item.cartItemId}
                  className="bg-white rounded-2xl border border-stone-200 p-3 shadow-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-bold text-stone-900 text-sm leading-tight">
                        {item.product.name}
                      </h4>
                      <span className="text-xs text-stone-500 font-semibold">
                        {formatBRL(item.unitPrice)} un
                      </span>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.cartItemId)}
                      className="text-stone-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                      title="Remover item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Options & Notes tags */}
                  {(item.selectedOptions.length > 0 ||
                    item.removedIngredients.length > 0 ||
                    item.notes) && (
                    <div className="text-[11px] text-stone-600 bg-stone-50 p-2 rounded-xl border border-stone-100 space-y-1">
                      {item.selectedOptions.map((g, idx) => (
                        <div key={idx} className="flex flex-wrap gap-1">
                          <span className="font-semibold text-stone-700">{g.groupName}:</span>
                          {g.selectedItems.map(si => (
                            <span key={si.id} className="text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded font-medium">
                              +{si.name} {si.price > 0 ? `(${formatBRL(si.price)})` : ''}
                            </span>
                          ))}
                        </div>
                      ))}

                      {item.removedIngredients.length > 0 && (
                        <div className="text-rose-700 font-medium">
                          • Sem: {item.removedIngredients.join(', ')}
                        </div>
                      )}

                      {item.notes && (
                        <div className="text-stone-500 italic">
                          • Obs: &quot;{item.notes}&quot;
                        </div>
                      )}
                    </div>
                  )}

                  {/* Item footer with quantity buttons & total */}
                  <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                    <div className="flex items-center bg-stone-100 rounded-lg p-0.5">
                      <button
                        onClick={() =>
                          updateCartItemQuantity(item.cartItemId, item.quantity - 1)
                        }
                        className="w-6 h-6 rounded flex items-center justify-center text-stone-700 hover:bg-white cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-xs text-stone-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateCartItemQuantity(item.cartItemId, item.quantity + 1)
                        }
                        className="w-6 h-6 rounded flex items-center justify-center text-stone-700 hover:bg-white cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-black text-sm text-stone-900">
                      {formatBRL(item.totalPrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer with totals and action button */}
        {!successOrderNum && cart.length > 0 && (
          <div className="p-4 bg-stone-50 border-t border-stone-200 space-y-3 shrink-0">
            {/* Service fee toggle in table mode */}
            {orderMode === 'table' && (
              <div className="flex items-center justify-between text-xs text-stone-600 bg-white p-2 rounded-xl border border-stone-200">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeServiceFeeInCart}
                    onChange={e => setIncludeServiceFeeInCart(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span className="font-medium">Taxa de Serviço Garçom ({config.serviceFeePercent}%)</span>
                </label>
                <span className="font-semibold text-stone-800">
                  {formatBRL(cartServiceFee)}
                </span>
              </div>
            )}

            {/* Delivery fee breakdown */}
            {orderMode === 'delivery' && (
              <div className="flex items-center justify-between text-xs text-stone-600 bg-white p-2 rounded-xl border border-stone-200">
                <span className="font-medium flex items-center gap-1.5">
                  <Bike className="w-3.5 h-3.5 text-purple-600" />
                  Taxa de Entrega
                </span>
                <span className="font-bold text-stone-900">
                  {cartDeliveryFee === 0 ? (
                    <span className="text-emerald-600 font-extrabold">GRÁTIS</span>
                  ) : (
                    formatBRL(cartDeliveryFee)
                  )}
                </span>
              </div>
            )}

            {/* Subtotal & Total */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-stone-500">
                <span>Subtotal dos itens</span>
                <span>{formatBRL(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-900 font-black text-base pt-1 border-t border-stone-200">
                <span>Total a Pagar</span>
                <span className="text-amber-600">{formatBRL(cartTotal)}</span>
              </div>
            </div>

            {/* Closed store warning banner */}
            {config.isOpen === false && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-900">Estabelecimento Fechado no Momento</p>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Não estamos recebendo novos pedidos agora. Você pode manter os itens na sacola, mas o envio só estará disponível quando o restaurante abrir.
                  </p>
                </div>
              </div>
            )}

            {/* Send order button */}
            <button
              id="btn-submit-order"
              onClick={handleSendOrder}
              disabled={isSubmitting || config.isOpen === false}
              className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-extrabold text-sm shadow-md transition-all ${
                config.isOpen === false
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed shadow-none'
                  : 'bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-stone-950 cursor-pointer'
              }`}
            >
              {config.isOpen === false ? (
                <span>❌ Estabelecimento Fechado (Envio Indisponível)</span>
              ) : (
                <>
                  {orderMode === 'delivery' ? (
                    <Bike className="w-5 h-5" />
                  ) : (
                    <ChefHat className="w-5 h-5" />
                  )}
                  <span>
                    {isSubmitting
                      ? 'Processando Pedido...'
                      : orderMode === 'delivery'
                      ? 'Confirmar Pedido Delivery'
                      : orderMode === 'table'
                      ? 'Enviar Pedido para Cozinha'
                      : 'Confirmar Retirada'}
                  </span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
