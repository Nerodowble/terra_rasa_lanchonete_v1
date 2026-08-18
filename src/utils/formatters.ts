import { Order, CartItem } from '../types';

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
}

export function formatElapsedMinutes(isoString: string): number {
  try {
    const start = new Date(isoString).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((now - start) / (1000 * 60)));
  } catch {
    return 0;
  }
}

export function getStatusLabel(status: Order['status'], orderType?: Order['orderType']): { label: string; color: string; bg: string; border: string } {
  switch (status) {
    case 'received':
      return {
        label: 'Recebido',
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
      };
    case 'preparing':
      return {
        label: 'Em Preparo',
        color: 'text-blue-700',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
      };
    case 'ready':
      return {
        label: orderType === 'delivery' ? 'Pronto p/ Embalar' : 'Pronto p/ Servir',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
      };
    case 'dispatched':
      return {
        label: 'Saiu p/ Entrega (Motoboy)',
        color: 'text-purple-700',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
      };
    case 'delivered':
      return {
        label: orderType === 'delivery' ? 'Entregue no Endereço' : orderType === 'takeout' ? 'Retirado no Balcão' : 'Entregue na Mesa',
        color: 'text-indigo-700',
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
      };
    case 'cancelled':
      return {
        label: 'Cancelado',
        color: 'text-rose-700',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
      };
    default:
      return {
        label: 'Pendente',
        color: 'text-stone-700',
        bg: 'bg-stone-50',
        border: 'border-stone-200',
      };
  }
}

export function getOrderTypeInfo(type: Order['orderType']) {
  switch (type) {
    case 'delivery':
      return {
        label: 'Delivery 🛵',
        shortLabel: 'Delivery',
        badge: 'bg-purple-100 text-purple-900 border-purple-200',
        badgeBg: 'bg-purple-100 text-purple-900 border-purple-200',
      };
    case 'takeout':
      return {
        label: 'Retirada 🛍️',
        shortLabel: 'Retirada',
        badge: 'bg-teal-100 text-teal-900 border-teal-200',
        badgeBg: 'bg-teal-100 text-teal-900 border-teal-200',
      };
    case 'table':
    default:
      return {
        label: 'Mesa 🍽️',
        shortLabel: 'Mesa',
        badge: 'bg-amber-100 text-amber-900 border-amber-200',
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
      };
  }
}

export function getTableStatusInfo(status: 'available' | 'occupied' | 'bill_requested' | 'reserved') {
  switch (status) {
    case 'available':
      return { label: 'Livre', badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200', cardBg: 'bg-white' };
    case 'occupied':
      return { label: 'Ocupada', badgeBg: 'bg-blue-100 text-blue-800 border-blue-200', cardBg: 'bg-blue-50/40' };
    case 'bill_requested':
      return { label: 'Conta Pedida', badgeBg: 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse', cardBg: 'bg-amber-50/50' };
    case 'reserved':
      return { label: 'Reservada', badgeBg: 'bg-purple-100 text-purple-800 border-purple-200', cardBg: 'bg-purple-50/30' };
  }
}

export function generateThermalReceiptText(order: Order, restaurantName = 'GOUSTRÔ BISTRÔ & DELIVERY'): string {
  const line = '------------------------------------------\n';
  const doubleLine = '==========================================\n';
  
  let text = '';
  text += `           ${restaurantName}           \n`;
  if (order.orderType === 'delivery') {
    text += `          *** CUPOM DE DELIVERY ***       \n`;
  } else if (order.orderType === 'takeout') {
    text += `          *** RETIRADA NO BALCÃO ***      \n`;
  } else {
    text += `        COMANDA DE PEDIDO ELETRÔNICA       \n`;
  }
  text += doubleLine;
  text += `PEDIDO #${String(order.orderNumber).padStart(4, '0')} | TIPO: ${order.orderType.toUpperCase()}`;
  if (order.tableNumber) {
    text += ` | MESA: ${String(order.tableNumber).padStart(2, '0')}`;
  }
  text += '\n';
  text += `CLIENTE: ${order.customerName.toUpperCase()}\n`;
  if (order.customerPhone) {
    text += `FONE/WHATSAPP: ${order.customerPhone}\n`;
  }

  if (order.orderType === 'delivery' && order.deliveryAddress) {
    const addr = order.deliveryAddress;
    text += line;
    text += `ENDEREÇO DE ENTREGA:\n`;
    text += `${addr.street}, nº ${addr.number}`;
    if (addr.complement) text += ` - ${addr.complement}`;
    text += `\nBairro: ${addr.neighborhood} - ${addr.city}`;
    if (addr.cep) text += ` | CEP: ${addr.cep}`;
    if (addr.reference) text += `\nRef: ${addr.reference}`;
    text += '\n';
    if (order.driverName) {
      text += `ENTREGADOR: ${order.driverName}\n`;
    }
  }

  text += `HORÁRIO: ${formatTime(order.createdAt)} | DATA: ${new Date(order.createdAt).toLocaleDateString('pt-BR')}\n`;
  text += line;
  text += 'QTD  ITEM                             VALOR\n';
  text += line;

  order.items.forEach((item: CartItem) => {
    const qtyStr = `${item.quantity}x`.padEnd(5, ' ');
    const nameStr = item.product.name.slice(0, 24).padEnd(24, ' ');
    const priceStr = formatBRL(item.totalPrice).padStart(13, ' ');
    text += `${qtyStr}${nameStr}${priceStr}\n`;

    // Options
    item.selectedOptions.forEach(opt => {
      opt.selectedItems.forEach(si => {
        text += `     + ${si.name} (${formatBRL(si.price)})\n`;
      });
    });

    if (item.removedIngredients.length > 0) {
      text += `     - SEM: ${item.removedIngredients.join(', ')}\n`;
    }

    if (item.notes) {
      text += `     * OBS: ${item.notes}\n`;
    }
  });

  text += line;
  text += `SUBTOTAL:                       ${formatBRL(order.subtotal).padStart(11, ' ')}\n`;
  if (order.serviceFee > 0) {
    text += `TAXA DE SERVIÇO:                ${formatBRL(order.serviceFee).padStart(11, ' ')}\n`;
  }
  if (order.deliveryFee && order.deliveryFee > 0) {
    text += `TAXA DE ENTREGA:                ${formatBRL(order.deliveryFee).padStart(11, ' ')}\n`;
  }
  text += doubleLine;
  text += `TOTAL:                          ${formatBRL(order.total).padStart(11, ' ')}\n`;
  text += doubleLine;
  text += `STATUS: ${getStatusLabel(order.status).label.toUpperCase()} | PAGTO: ${order.paymentStatus === 'paid' ? 'PAGO' : 'PENDENTE'}\n`;
  if (order.paymentMethod) {
    text += `FORMA: ${order.paymentMethod.toUpperCase()}`;
    if (order.changeFor && order.changeFor > order.total) {
      text += ` (Troco p/ ${formatBRL(order.changeFor)}: ${formatBRL(order.changeFor - order.total)})`;
    }
    text += '\n';
  }
  text += `\n        Obrigado pela preferência!        \n`;
  text += `          Volte Sempre e Bom Apetite!      \n\n`;

  return text;
}

export function generateDriverSettlementReceiptText(
  data: {
    driverName: string;
    driverPhone?: string;
    orders: Order[];
    totalDeliveries: number;
    totalFee: number;
    totalCashCollected: number;
    netBalance: number;
    date: string;
  },
  restaurantName = 'GOUSTRÔ BISTRÔ & DELIVERY'
): string {
  const line = '------------------------------------------\n';
  const doubleLine = '==========================================\n';

  let text = '';
  text += `           ${restaurantName}           \n`;
  text += `       *** FECHAMENTO DE ENTREGADOR ***   \n`;
  text += doubleLine;
  text += `ENTREGADOR: ${data.driverName.toUpperCase()}\n`;
  if (data.driverPhone) {
    text += `CONTATO: ${data.driverPhone}\n`;
  }
  text += `DATA FECHAMENTO: ${data.date} | ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n`;
  text += `TOTAL DE CORRIDAS REALIZADAS: ${data.totalDeliveries}\n`;
  text += line;
  text += 'PEDIDO   HORA   FORMA      TAXA     DINHEIRO\n';
  text += line;

  data.orders.forEach(ord => {
    const num = `#${ord.orderNumber}`.padEnd(8, ' ');
    const hr = formatTime(ord.deliveredAt || ord.dispatchedAt || ord.createdAt).padEnd(7, ' ');
    const method = (ord.paymentMethod?.slice(0, 6) || 'ONLINE').padEnd(9, ' ');
    const fee = formatBRL(ord.driverFee || 0).padStart(8, ' ');
    const cash = ord.paymentMethod === 'cash' 
      ? formatBRL(ord.cashCollectedByDriver !== undefined ? ord.cashCollectedByDriver : ord.total).padStart(10, ' ')
      : '  R$ 0,00';
    text += `${num}${hr}${method} ${fee} ${cash}\n`;
  });

  text += line;
  text += `TOTAL TAXAS REPASSE (CRÉDITO MOT.): ${formatBRL(data.totalFee).padStart(7, ' ')}\n`;
  text += `TOTAL DINHEIRO RECOLHIDO (DEVOLUÇÃO): ${formatBRL(data.totalCashCollected).padStart(5, ' ')}\n`;
  text += doubleLine;

  if (data.netBalance > 0) {
    text += `SALDO FINAL: ENTREGADOR DEVOLVE AO CAIXA\n`;
    text += `VALOR A DEVOLVER: ${formatBRL(data.netBalance)}\n`;
  } else if (data.netBalance < 0) {
    text += `SALDO FINAL: CAIXA PAGA AO ENTREGADOR\n`;
    text += `VALOR A PAGAR: ${formatBRL(Math.abs(data.netBalance))}\n`;
  } else {
    text += `SALDO FINAL: CONTAS QUITES (R$ 0,00)\n`;
  }

  text += doubleLine;
  text += `\nASSINATURA CAIXA: _______________________\n\n`;
  text += `ASSINATURA ENTREGADOR: __________________\n\n`;
  return text;
}

