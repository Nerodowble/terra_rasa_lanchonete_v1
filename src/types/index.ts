export type CategoryId = string;

export interface Category {
  id: CategoryId;
  name: string;
  icon: string;
  description: string;
}

export type PreparationStation = 'kitchen' | 'bar' | 'dessert';

export interface ProductOptionItem {
  id: string;
  name: string;
  price: number;
}

export interface ProductOptionGroup {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  maxSelections?: number;
  options: ProductOptionItem[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: CategoryId;
  image: string;
  station: PreparationStation;
  prepTimeMinutes: number;
  isAvailable: boolean;
  badges?: string[]; // e.g. ['Mais Pedido', 'Artesanal', 'Vegetariano']
  removableIngredients?: string[];
  optionGroups?: ProductOptionGroup[];
  isVegetarian?: boolean;
  isGlutenFree?: boolean;
  isHighlight?: boolean;
}

export interface SelectedOption {
  groupId: string;
  groupName: string;
  selectedItems: {
    id: string;
    name: string;
    price: number;
  }[];
}

export interface CartItem {
  cartItemId: string;
  product: Product;
  quantity: number;
  selectedOptions: SelectedOption[];
  removedIngredients: string[];
  notes: string;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus = 'received' | 'preparing' | 'ready' | 'dispatched' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid';
export type PaymentMethod = 'pix' | 'credit' | 'debit' | 'cash';
export type OrderType = 'table' | 'takeout' | 'delivery';
export type CourierType = 'own' | 'fixed' | 'freelancer' | 'app';

export interface Courier {
  id: string;
  name: string;
  phone?: string;
  vehicle?: string;
  type: CourierType;
  defaultFee: number;
  active: boolean;
}

export interface DeliveryAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  reference?: string;
  cep?: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  orderType: OrderType;
  tableNumber?: number; // Optional for delivery / takeout
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: DeliveryAddress;
  deliveryFee?: number;
  changeFor?: number; // Troco para quanto (if cash payment)
  
  // Delivery & Courier Specifics
  courierId?: string;
  deliveryType?: CourierType;
  driverName?: string; // Motoboy or "Eu Mesmo"
  driverPhone?: string;
  driverVehicle?: string;
  driverFee?: number; // Valor de repasse pago ao motoboy pela entrega
  cashCollectedByDriver?: number; // Dinheiro recebido pelo motoboy na entrega
  driverSettled?: boolean; // Se o acerto financeiro do motoboy com a loja já foi concluído
  dispatchedAt?: string; // ISO string de quando saiu para entrega
  deliveredAt?: string; // ISO string de quando foi entregue
  trackingUrlOrCode?: string;

  items: CartItem[];
  subtotal: number;
  serviceFee: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  createdAt: string; // ISO string
  updatedAt: string;
  estimatedPrepTime: number; // minutes
}

export type TableStatus = 'available' | 'occupied' | 'bill_requested' | 'reserved';

export interface RestaurantTable {
  tableNumber: number;
  name: string;
  capacity: number;
  status: TableStatus;
  customerName?: string;
  openedAt?: string;
  activeOrderIds: string[];
}

export type WaiterCallType = 'waiter' | 'bill' | 'cutlery' | 'ice_lemon' | 'clean_table' | 'custom';

export interface WaiterCall {
  id: string;
  tableNumber: number;
  type: WaiterCallType;
  message?: string;
  createdAt: string;
  status: 'pending' | 'resolved';
}

export interface RestaurantConfig {
  name: string;
  tagline: string;
  phone: string;
  whatsapp?: string;
  instagram?: string;
  address: string;
  logoUrl?: string;
  bannerUrl?: string;
  isOpen: boolean; // Controla se o restaurante está ONLINE (recebendo pedidos) ou OFFLINE (fechado)
  serviceFeePercent: number;
  deliveryFee: number;
  defaultDriverPayoutFee?: number; // Repasse padrão de motoboy
  freeDeliveryThreshold?: number;
  estimatedDeliveryMinutes: number;
  minOrderDelivery: number;
  pixKey: string;
  enableSoundAlerts: boolean;
  currency: string;
}

export type AppViewMode = 'client' | 'admin';
export type AdminTab = 'kds' | 'tables' | 'orders' | 'deliveries' | 'menu' | 'reports' | 'settings';
