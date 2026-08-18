import React from 'react';
import { useComanda } from '../../context/ComandaContext';
import { generateThermalReceiptText, generateDriverSettlementReceiptText } from '../../utils/formatters';
import { X, Printer, Copy, Check, Bike } from 'lucide-react';

export const ThermalReceiptModal: React.FC = () => {
  const {
    receiptOrderToPrint,
    setReceiptOrderToPrint,
    driverSettlementToPrint,
    setDriverSettlementToPrint,
    config,
  } = useComanda();

  const [copied, setCopied] = React.useState(false);

  if (!receiptOrderToPrint && !driverSettlementToPrint) return null;

  const isSettlement = !!driverSettlementToPrint;
  const receiptText = isSettlement && driverSettlementToPrint
    ? generateDriverSettlementReceiptText(driverSettlementToPrint, config.name)
    : receiptOrderToPrint
    ? generateThermalReceiptText(receiptOrderToPrint, config.name)
    : '';

  const handleClose = () => {
    if (receiptOrderToPrint) setReceiptOrderToPrint(null);
    if (driverSettlementToPrint) setDriverSettlementToPrint(null);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${isSettlement ? `Fechamento Motoboy ${driverSettlementToPrint?.driverName}` : `Comanda #${receiptOrderToPrint?.orderNumber}`}</title>
            <style>
              body {
                font-family: 'Courier New', Courier, monospace;
                font-size: 12px;
                line-height: 1.3;
                width: 300px;
                margin: 0 auto;
                padding: 10px;
                white-space: pre-wrap;
              }
            </style>
          </head>
          <body>${receiptText}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(receiptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-stone-200">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSettlement ? (
              <Bike className="w-5 h-5 text-amber-400" />
            ) : (
              <Printer className="w-5 h-5 text-amber-400" />
            )}
            <h2 className="font-black text-sm sm:text-base text-white">
              {isSettlement ? 'Fechamento de Entregador (80mm)' : 'Impressão Térmica 80mm'}
            </h2>
          </div>

          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Paper simulation */}
        <div className="p-5 bg-stone-100 flex justify-center">
          <div className="bg-white p-5 rounded-lg shadow-md border border-stone-300 w-full font-mono text-xs text-stone-900 whitespace-pre-wrap leading-relaxed select-all max-h-[60vh] overflow-y-auto">
            {receiptText}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3">
          <button
            onClick={handleCopy}
            className="px-3.5 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>{isSettlement ? 'Imprimir Fechamento' : 'Imprimir Cupom / Comanda'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

