import React from 'react';
import { useComanda } from '../../context/ComandaContext';
import { formatBRL } from '../../utils/formatters';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Clock,
  ShoppingBag,
  CreditCard,
  QrCode,
  Banknote,
  Award,
  Calendar,
  Bike,
  Utensils,
  Store,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { orders, config } = useComanda();

  const validOrders = orders.filter(o => o.status !== 'cancelled');

  const totalRevenue = validOrders.reduce((acc, o) => acc + o.total, 0);
  const totalServiceFee = validOrders.reduce((acc, o) => acc + o.serviceFee, 0);
  const totalDeliveryFee = validOrders.reduce((acc, o) => acc + (o.deliveryFee || 0), 0);
  const totalSubtotal = validOrders.reduce((acc, o) => acc + o.subtotal, 0);
  const avgTicket = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;
  const avgPrepTime =
    validOrders.length > 0
      ? Math.round(validOrders.reduce((acc, o) => acc + o.estimatedPrepTime, 0) / validOrders.length)
      : 0;

  // Channel Breakdown
  const deliveryOrders = validOrders.filter(o => o.orderType === 'delivery');
  const tableOrders = validOrders.filter(o => o.orderType === 'table');
  const takeoutOrders = validOrders.filter(o => o.orderType === 'takeout');

  const channelBreakdown = {
    delivery: deliveryOrders.reduce((acc, o) => acc + o.total, 0),
    table: tableOrders.reduce((acc, o) => acc + o.total, 0),
    takeout: takeoutOrders.reduce((acc, o) => acc + o.total, 0),
  };

  // Payment Breakdown
  const paymentBreakdown = {
    pix: validOrders.filter(o => o.paymentMethod === 'pix' || (!o.paymentMethod && o.paymentStatus === 'paid')).reduce((acc, o) => acc + o.total, 0),
    card: validOrders.filter(o => o.paymentMethod === 'credit' || o.paymentMethod === 'debit').reduce((acc, o) => acc + o.total, 0),
    cash: validOrders.filter(o => o.paymentMethod === 'cash').reduce((acc, o) => acc + o.total, 0),
    pending: validOrders.filter(o => o.paymentStatus === 'pending').reduce((acc, o) => acc + o.total, 0),
  };

  // Top Selling Items
  const itemMap: Record<string, { name: string; quantity: number; revenue: number; image: string }> = {};
  validOrders.forEach(order => {
    order.items.forEach(item => {
      if (!itemMap[item.product.id]) {
        itemMap[item.product.id] = {
          name: item.product.name,
          quantity: 0,
          revenue: 0,
          image: item.product.image,
        };
      }
      itemMap[item.product.id].quantity += item.quantity;
      itemMap[item.product.id].revenue += item.totalPrice;
    });
  });

  const topItems = Object.values(itemMap).sort((a, b) => b.quantity - a.quantity);
  const maxItemQty = topItems.length > 0 ? topItems[0].quantity : 1;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-900 text-white p-4 rounded-2xl border border-stone-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">
              Relatório Diário de Vendas & Delivery
            </h1>
            <p className="text-xs text-stone-400">
              Métricas financeiras consolidadas, canais de venda e ranking de produtos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-stone-300 bg-stone-800 px-3 py-1.5 rounded-xl border border-stone-700">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>Hoje, {new Date().toLocaleDateString('pt-BR', { dateStyle: 'long' })}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Faturamento do Dia
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900">
            {formatBRL(totalRevenue)}
          </div>
          <p className="text-[11px] text-stone-500">
            {totalDeliveryFee > 0 ? `Inclui ${formatBRL(totalDeliveryFee)} em taxas de entrega` : 'Vendas salão e balcão'}
          </p>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Pedidos Realizados
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900">
            {validOrders.length} pedidos
          </div>
          <p className="text-[11px] text-purple-600 font-semibold">
            {deliveryOrders.length} Delivery • {tableOrders.length} Salão • {takeoutOrders.length} Balcão
          </p>
        </div>

        {/* Average Ticket */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Ticket Médio
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900">
            {formatBRL(avgTicket)}
          </div>
          <p className="text-[11px] text-stone-500">
            Média por comanda / pedido
          </p>
        </div>

        {/* Avg Prep Time */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Tempo Médio Cozinha
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900">
            ~{avgPrepTime} minutos
          </div>
          <p className="text-[11px] text-stone-500">
            Dentro da meta estabelecida
          </p>
        </div>
      </div>

      {/* Channel & Payments Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales by Channel */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
            <Bike className="w-4 h-4 text-purple-600" />
            <span>Faturamento por Canal</span>
          </h3>

          <div className="space-y-3">
            {/* Delivery */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-purple-900">
                  <Bike className="w-3.5 h-3.5 text-purple-600" /> Delivery em Casa ({deliveryOrders.length})
                </span>
                <span className="text-stone-900">{formatBRL(channelBreakdown.delivery)}</span>
              </div>
              <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full"
                  style={{
                    width: `${totalRevenue > 0 ? (channelBreakdown.delivery / totalRevenue) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Mesas / Salão */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-amber-900">
                  <Utensils className="w-3.5 h-3.5 text-amber-600" /> Salão / Mesas ({tableOrders.length})
                </span>
                <span className="text-stone-900">{formatBRL(channelBreakdown.table)}</span>
              </div>
              <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{
                    width: `${totalRevenue > 0 ? (channelBreakdown.table / totalRevenue) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Retirada */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-teal-900">
                  <Store className="w-3.5 h-3.5 text-teal-600" /> Retirada Balcão ({takeoutOrders.length})
                </span>
                <span className="text-stone-900">{formatBRL(channelBreakdown.takeout)}</span>
              </div>
              <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full"
                  style={{
                    width: `${totalRevenue > 0 ? (channelBreakdown.takeout / totalRevenue) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-stone-500" />
            <span>Formas de Pagamento</span>
          </h3>

          <div className="space-y-3">
            {/* PIX */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-stone-800">
                  <QrCode className="w-3.5 h-3.5 text-emerald-600" /> PIX Instantâneo
                </span>
                <span className="text-stone-900">{formatBRL(paymentBreakdown.pix)}</span>
              </div>
              <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${totalRevenue > 0 ? (paymentBreakdown.pix / totalRevenue) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Cards */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-stone-800">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" /> Cartão Débito / Crédito
                </span>
                <span className="text-stone-900">{formatBRL(paymentBreakdown.card)}</span>
              </div>
              <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{
                    width: `${totalRevenue > 0 ? (paymentBreakdown.card / totalRevenue) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Cash */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-stone-800">
                  <Banknote className="w-3.5 h-3.5 text-amber-600" /> Dinheiro em Espécie
                </span>
                <span className="text-stone-900">{formatBRL(paymentBreakdown.cash)}</span>
              </div>
              <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{
                    width: `${totalRevenue > 0 ? (paymentBreakdown.cash / totalRevenue) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Dishes */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Pratos Mais Pedidos Hoje</span>
          </h3>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {topItems.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-stone-800 truncate">{item.name}</span>
                  </div>
                  <span className="font-bold text-stone-900 shrink-0">
                    {item.quantity} un ({formatBRL(item.revenue)})
                  </span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{
                      width: `${(item.quantity / maxItemQty) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* JSON Database & Data Export Section */}
      <JSONDatabaseSection />
    </div>
  );
};

const JSONDatabaseSection: React.FC = () => {
  const { exportDatabaseJSON, importDatabaseJSON, downloadDatabaseJSON } = useComanda();
  const [copied, setCopied] = React.useState(false);
  const [showJsonPreview, setShowJsonPreview] = React.useState(false);
  const [importStatus, setImportStatus] = React.useState<string | null>(null);

  const handleCopyJSON = () => {
    const json = exportDatabaseJSON();
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDatabaseJSON(content);
        if (success) {
          setImportStatus('Banco de dados JSON importado e restaurado com sucesso!');
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          setImportStatus('Erro: Arquivo JSON inválido ou corrompido.');
          setTimeout(() => setImportStatus(null), 4000);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h3 className="font-black text-stone-900 text-base sm:text-lg">
              Banco de Dados em Arquivo JSON & Relatórios
            </h3>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Gera e sincroniza os dados completos de vendas, contas, produtos, motoboys e histórico em formato JSON puro para relatórios e backup.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-download-json-db"
            onClick={downloadDatabaseJSON}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <span>Baixar JSON (.json)</span>
          </button>

          <button
            id="btn-copy-json-db"
            onClick={handleCopyJSON}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 font-semibold text-xs transition-colors cursor-pointer"
          >
            <span>{copied ? 'Copiado!' : 'Copiar JSON'}</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 font-semibold text-xs transition-colors cursor-pointer">
            <span>Restaurar JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {importStatus && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          {importStatus}
        </div>
      )}

      {/* Accordion / Toggle Preview */}
      <div>
        <button
          type="button"
          onClick={() => setShowJsonPreview(!showJsonPreview)}
          className="text-xs font-bold text-amber-700 hover:text-amber-800 underline cursor-pointer"
        >
          {showJsonPreview ? 'Ocultar pré-visualização do JSON' : 'Ver prévia do documento JSON'}
        </button>

        {showJsonPreview && (
          <pre className="mt-3 p-4 bg-stone-900 text-amber-300 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-72 border border-stone-800">
            {exportDatabaseJSON()}
          </pre>
        )}
      </div>
    </div>
  );
};
