import { Category, Product, RestaurantConfig, RestaurantTable, Order, WaiterCall, Courier } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'lanches',
    name: 'Lanches & Hambúrgueres',
    icon: 'Flame',
    description: 'Hambúrgueres artesanais, sanduíches e lanches',
  },
  {
    id: 'pratos',
    name: 'Pratos Principais',
    icon: 'Utensils',
    description: 'Refeições, pratos executivos e especialidades',
  },
  {
    id: 'porcoes',
    name: 'Porções & Entradas',
    icon: 'Sparkles',
    description: 'Porções, petiscos e entradas crocantes',
  },
  {
    id: 'bebidas',
    name: 'Bebidas',
    icon: 'Wine',
    description: 'Refrigerantes, sucos, cervejas e drinks',
  },
  {
    id: 'sobremesas',
    name: 'Sobremesas',
    icon: 'Sparkles',
    description: 'Doces, bolos e sobremesas especiais',
  },
];

// Clean initial products - ready for user to register their own items in Admin > Cardápio
export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_TABLES: RestaurantTable[] = [
  { tableNumber: 1, name: 'Mesa 01', capacity: 2, status: 'available', activeOrderIds: [] },
  { tableNumber: 2, name: 'Mesa 02', capacity: 4, status: 'available', activeOrderIds: [] },
  { tableNumber: 3, name: 'Mesa 03', capacity: 4, status: 'available', activeOrderIds: [] },
  { tableNumber: 4, name: 'Mesa 04', capacity: 6, status: 'available', activeOrderIds: [] },
  { tableNumber: 5, name: 'Mesa 05', capacity: 2, status: 'available', activeOrderIds: [] },
  { tableNumber: 6, name: 'Mesa 06', capacity: 8, status: 'available', activeOrderIds: [] },
  { tableNumber: 7, name: 'Mesa 07', capacity: 4, status: 'available', activeOrderIds: [] },
  { tableNumber: 8, name: 'Mesa 08', capacity: 4, status: 'available', activeOrderIds: [] },
  { tableNumber: 9, name: 'Mesa 09', capacity: 6, status: 'available', activeOrderIds: [] },
  { tableNumber: 10, name: 'Mesa 10', capacity: 2, status: 'available', activeOrderIds: [] },
];

export const INITIAL_COURIERS: Courier[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_WAITER_CALLS: WaiterCall[] = [];

export const DEFAULT_CONFIG: RestaurantConfig = {
  name: 'Meu Estabelecimento',
  tagline: 'Cardápio Digital & Delivery Rápido',
  phone: '',
  whatsapp: '',
  instagram: '',
  address: '',
  logoUrl: '',
  bannerUrl: '',
  isOpen: true,
  serviceFeePercent: 10,
  deliveryFee: 5.00,
  defaultDriverPayoutFee: 5.00,
  freeDeliveryThreshold: 60.00,
  estimatedDeliveryMinutes: 35,
  minOrderDelivery: 15.00,
  pixKey: '',
  enableSoundAlerts: true,
  currency: 'BRL',
};
