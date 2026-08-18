import React, { useState } from 'react';
import { useComanda } from '../../context/ComandaContext';
import { formatBRL, formatTime } from '../../utils/formatters';
import confetti from 'canvas-confetti';
import {
  X,
  ReceiptText,
  Users,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle,
  Copy,
  Check,
  Sparkles,
  Heart,
} from 'lucide-react';

export const DigitalBillModal: React.FC = () => {
  const {
    isBillModalOpen,
    setIsBillModalOpen,
    activeTableNumber,
    customerName,
    getOrdersByTable,
    config,
    requestBillForTable,
    closeTable,
  } = useComanda();

  const [splitCount, setSplitCount] = useState<number>(1);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'pix' | 'card' | 'cash'>('pix');
  const [isCopiedPix, setIsCopiedPix] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  if (!isBillModalOpen) return null;

  const tableOrders = getOrdersByTable(activeTableNumber).filter(
    o => o.status !== 'cancelled'
  );

  const subtotal = tableOrders.reduce((acc, o) => acc + o.subtotal, 0);
  const serviceFee = (subtotal * config.serviceFeePercent) / 100;
  const grandTotal = subtotal + serviceFee;
  const splitAmount = grandTotal / splitCount;

  // Mock PIX payload
  const pixPayload = `00020126580014br.gov.bcb.pix0136${config.pixKey}520400005303986540${grandTotal.toFixed(2)}5802BR5915${config.name.slice(0, 15)}6009SAO PAULO62070503***6304ABCD`;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixPayload);
    setIsCopiedPix(true);
    setTimeout(() => setIsCopiedPix(false), 2000);
  };

  const handleConfirmPayment = () => {
    setPaymentSuccess(true);

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    setTimeout(() => {
      closeTable(activeTableNumber);
      setPaymentSuccess(false);
      setIsBillModalOpen(false);
    }, 2500);
  };

  const handleCallWaiterForBill = () => {
    requestBillForTable(activeTableNumber);
    alert('Garçom notificado! Ele virá à sua mesa com a maquininha.');
    setIsBillModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        id="modal-digital-bill"
        className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-stone-200"
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-200 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Comanda & Fechamento de Conta
              </h2>
              <p className="text-xs text-stone-400">
                Mesa {String(activeTableNumber).padStart(2, '0')} • {customerName || 'Cliente'}
              </p>
            </div>
          </div>

          <button
            id="btn-close-bill"
            onClick={() => setIsBillModalOpen(false)}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {paymentSuccess ? (
          <div className="p-8 text-center space-y-4 flex flex-col items-center justify-center flex-1">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-black text-stone-900">
              Pagamento Confirmado!
            </h3>
            <p className="text-sm text-stone-500 max-w-sm">
              Muito obrigado pela sua visita ao {config.name}. Sua comanda foi encerrada com sucesso. Volte sempre!
            </p>
          </div>
        ) : (
          <div className="p-5 overflow-y-auto space-y-6 flex-1 text-stone-800">
            {/* Orders Summary */}
            <div className="space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-stone-500">
                Itens Consumidos na Mesa
              </span>

              <div className="bg-stone-50 rounded-2xl border border-stone-200/80 p-3 space-y-3">
                {tableOrders.map(order => (
                  <div key={order.id} className="space-y-1.5 pb-2 border-b border-stone-200/60 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center text-xs font-semibold text-stone-600">
                      <span>Pedido #{order.orderNumber} ({formatTime(order.createdAt)})</span>
                      <span className="text-stone-900 font-bold">{formatBRL(order.total)}</span>
                    </div>

                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-stone-700 pl-2">
                        <span>{item.quantity}x {item.product.name}</span>
                        <span>{formatBRL(item.totalPrice)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Split Bill Calculator */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-700" />
                  <span className="font-bold text-sm text-stone-900">
                    Dividir a Conta
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-white border border-amber-300 rounded-xl p-1">
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <button
                      key={num}
                      onClick={() => setSplitCount(num)}
                      className={`w-7 h-7 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        splitCount === num
                          ? 'bg-amber-500 text-stone-950 shadow-xs'
                          : 'text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {splitCount > 1 && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-200">
                  <span className="text-stone-600">Valor individual por pessoa ({splitCount}x):</span>
                  <span className="font-black text-base text-amber-900">
                    {formatBRL(splitAmount)}
                  </span>
                </div>
              )}
            </div>

            {/* Totals Breakdown */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal dos pratos & bebidas</span>
                <span>{formatBRL(subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Taxa de serviço recomendada ({config.serviceFeePercent}%)</span>
                <span>{formatBRL(serviceFee)}</span>
              </div>
              <div className="flex justify-between text-stone-900 font-black text-lg pt-2 border-t border-stone-200">
                <span>Total Geral</span>
                <span className="text-emerald-700">{formatBRL(grandTotal)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-stone-500">
                Forma de Pagamento
              </span>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedPaymentMethod('pix')}
                  className={`flex flex-col items-center p-3 rounded-2xl border transition-all cursor-pointer ${
                    selectedPaymentMethod === 'pix'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-xs font-bold'
                      : 'border-stone-200 hover:border-stone-300 text-stone-700'
                  }`}
                >
                  <QrCode className="w-5 h-5 mb-1 text-emerald-600" />
                  <span className="text-xs">PIX Instantâneo</span>
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod('card')}
                  className={`flex flex-col items-center p-3 rounded-2xl border transition-all cursor-pointer ${
                    selectedPaymentMethod === 'card'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-xs font-bold'
                      : 'border-stone-200 hover:border-stone-300 text-stone-700'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mb-1 text-blue-600" />
                  <span className="text-xs">Cartão no Garçom</span>
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod('cash')}
                  className={`flex flex-col items-center p-3 rounded-2xl border transition-all cursor-pointer ${
                    selectedPaymentMethod === 'cash'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-xs font-bold'
                      : 'border-stone-200 hover:border-stone-300 text-stone-700'
                  }`}
                >
                  <Banknote className="w-5 h-5 mb-1 text-amber-600" />
                  <span className="text-xs">Dinheiro</span>
                </button>
              </div>

              {/* PIX Details */}
              {selectedPaymentMethod === 'pix' && (
                <div className="bg-stone-900 text-white rounded-2xl p-4 text-center space-y-3">
                  <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl flex items-center justify-center shadow-inner">
                    {/* SVG Realistic QR Code simulation */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                        pixPayload
                      )}`}
                      alt="PIX QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-stone-400 block">Chave PIX: {config.pixKey}</span>
                    <button
                      onClick={handleCopyPix}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      {isCopiedPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopiedPix ? 'Chave Copiada!' : 'Copiar Código PIX'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        {!paymentSuccess && (
          <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
            <button
              onClick={handleCallWaiterForBill}
              className="px-4 py-3 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Pedir Maquininha
            </button>

            <button
              id="btn-confirm-pay-bill"
              onClick={handleConfirmPayment}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Confirmar Pagamento ({formatBRL(grandTotal)})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
