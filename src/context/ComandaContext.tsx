import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Product,
  CartItem,
  Order,
  RestaurantTable,
  WaiterCall,
  WaiterCallType,
  RestaurantConfig,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  OrderType,
  DeliveryAddress,
  AppViewMode,
  AdminTab,
  Courier,
  CourierType,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_TABLES,
  INITIAL_ORDERS,
  INITIAL_COURIERS,
  INITIAL_WAITER_CALLS,
  DEFAULT_CONFIG,
} from '../data/initialData';
import { soundManager } from '../utils/audio';

export interface PlaceOrderParams {
  orderType?: OrderType;
  tableNumber?: number;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: DeliveryAddress;
  paymentMethod?: PaymentMethod;
  changeFor?: number;
}

export interface DispatchParams {
  courierId?: string;
  deliveryType?: CourierType;
  driverName: string;
  driverPhone?: string;
  driverVehicle?: string;
  driverFee?: number;
  trackingUrlOrCode?: string;
}

export interface DriverSettlementData {
  driverName: string;
  driverPhone?: string;
  orders: Order[];
  totalDeliveries: number;
  totalFee: number;
  totalCashCollected: number;
  netBalance: number; // positive = courier pays store, negative = store pays courier
  date: string;
}

interface ComandaContextType {
  // Navigation & View
  viewMode: AppViewMode;
  setViewMode: (mode: AppViewMode) => void;
  adminTab: AdminTab;
  setAdminTab: (tab: AdminTab) => void;

  // Configuration
  config: RestaurantConfig;
  updateConfig: (newConfig: Partial<RestaurantConfig>) => void;
  toggleStoreStatus: () => void;

  // Menu & Categories
  categories: typeof INITIAL_CATEGORIES;
  products: Product[];
  toggleProductAvailability: (productId: string) => void;
  updateProductPrice: (productId: string, newPrice: number) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (productId: string, data: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
  clearAllProducts: () => void;

  // Couriers / Motoboys
  couriers: Courier[];
  addCourier: (courier: Omit<Courier, 'id'>) => void;
  updateCourier: (courierId: string, data: Partial<Courier>) => void;
  deleteCourier: (courierId: string) => void;
  toggleCourierActive: (courierId: string) => void;

  // Order Mode (Delivery vs Mesa vs Balcão)
  orderMode: OrderType;
  setOrderMode: (mode: OrderType) => void;

  // Delivery Details
  deliveryAddress: DeliveryAddress;
  setDeliveryAddress: React.Dispatch<React.SetStateAction<DeliveryAddress>>;
  deliveryFee: number;
  selectedPaymentMethod: PaymentMethod;
  setSelectedPaymentMethod: (method: PaymentMethod) => void;
  cashChangeFor: string;
  setCashChangeFor: (val: string) => void;

  // Tables
  tables: RestaurantTable[];
  activeTableNumber: number;
  setActiveTableNumber: (tableNumber: number) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  occupyTable: (tableNumber: number, customerName: string) => void;
  requestBillForTable: (tableNumber: number) => void;
  closeTable: (tableNumber: number) => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'cartItemId' | 'totalPrice'>) => void;
  updateCartItemQuantity: (cartItemId: string, newQuantity: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartSubtotal: number;
  cartServiceFee: number;
  cartDeliveryFee: number;
  includeServiceFeeInCart: boolean;
  setIncludeServiceFeeInCart: (include: boolean) => void;

  // Orders
  orders: Order[];
  activeTrackingOrder: Order | null;
  setActiveTrackingOrder: (order: Order | null) => void;
  placeOrder: (params?: PlaceOrderParams) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus, driverName?: string) => void;
  dispatchOrder: (orderId: string, dispatchInfo: DispatchParams | string) => void;
  markOrderDelivered: (orderId: string, paymentMethod?: PaymentMethod, cashCollected?: number) => void;
  settleDriverAccounts: (driverNameOrCourierId?: string) => void;
  updateOrderPayment: (orderId: string, status: PaymentStatus, method?: PaymentMethod) => void;
  getOrderById: (orderId: string) => Order | undefined;
  getOrdersByTable: (tableNumber: number) => Order[];

  // Waiter Calls
  waiterCalls: WaiterCall[];
  callWaiter: (tableNumber: number, type: WaiterCallType, message?: string) => void;
  resolveWaiterCall: (callId: string) => void;

  // Modals & UI States
  isProductModalOpen: boolean;
  selectedProductForModal: Product | null;
  openProductModal: (product: Product) => void;
  closeProductModal: () => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  isOrderTrackerOpen: boolean;
  setIsOrderTrackerOpen: (open: boolean) => void;
  isBillModalOpen: boolean;
  setIsBillModalOpen: (open: boolean) => void;
  isWaiterModalOpen: boolean;
  setIsWaiterModalOpen: (open: boolean) => void;
  isTableSelectorOpen: boolean;
  setIsTableSelectorOpen: (open: boolean) => void;
  receiptOrderToPrint: Order | null;
  setReceiptOrderToPrint: (order: Order | null) => void;
  driverSettlementToPrint: DriverSettlementData | null;
  setDriverSettlementToPrint: (data: DriverSettlementData | null) => void;

  // Authentication & Management Access
  isAdminAuthenticated: boolean;
  isLoginModalOpen: boolean;
  openAdminLogin: () => void;
  closeAdminLogin: () => void;
  loginAdmin: (username: string, pass: string) => boolean;
  logoutAdmin: () => void;

  // JSON Database & Reports Export
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonString: string) => boolean;
  downloadDatabaseJSON: () => void;

  // Helper actions
  clearAllOrders: () => void;
  resetSystemToZero: (clearProducts?: boolean) => void;
  resetToInitialDemo: () => void;
  simulateIncomingOrder: () => void;
}

const STORAGE_PREFIX = 'restaurante_zero_v5_';

const STORAGE_KEYS = {
  ORDERS: `${STORAGE_PREFIX}orders`,
  TABLES: `${STORAGE_PREFIX}tables`,
  PRODUCTS: `${STORAGE_PREFIX}products`,
  COURIERS: `${STORAGE_PREFIX}couriers`,
  WAITER_CALLS: `${STORAGE_PREFIX}waiter_calls`,
  CONFIG: `${STORAGE_PREFIX}config`,
  ACTIVE_TABLE: `${STORAGE_PREFIX}active_table`,
  CUSTOMER_NAME: `${STORAGE_PREFIX}customer_name`,
  ORDER_MODE: `${STORAGE_PREFIX}order_mode`,
  DELIVERY_ADDRESS: `${STORAGE_PREFIX}delivery_address`,
  ADMIN_AUTH: `${STORAGE_PREFIX}admin_auth`,
};

// Immediate cleanup of any legacy keys with mock/sample data
if (typeof window !== 'undefined') {
  try {
    const isWiped = localStorage.getItem('restaurante_v5_wipe_done');
    if (!isWiped) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('goustro_') || k.startsWith('comanda_') || k.startsWith('restaurante_limpo_'))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      localStorage.setItem('restaurante_v5_wipe_done', 'true');
      fetch('/api/orders', { method: 'DELETE' }).catch(() => {});
    }
  } catch (e) {
    // Ignore
  }
}

const DEFAULT_DELIVERY_ADDRESS: DeliveryAddress = {
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  reference: '',
  cep: '',
};

const ComandaContext = createContext<ComandaContextType | null>(null);

export const ComandaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // App views
  const [viewMode, setViewMode] = useState<AppViewMode>('client');
  const [adminTab, setAdminTab] = useState<AdminTab>('kds');

  // Authentication for Management
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Config
  const [config, setConfig] = useState<RestaurantConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  // Menu Products
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  // Tables
  const [tables, setTables] = useState<RestaurantTable[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TABLES);
    return saved ? JSON.parse(saved) : INITIAL_TABLES;
  });

  // Orders
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  // Waiter Calls
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WAITER_CALLS);
    return saved ? JSON.parse(saved) : INITIAL_WAITER_CALLS;
  });

  // Order Mode (Delivery is primary, Table and Takeout supported)
  const [orderMode, setOrderModeState] = useState<OrderType>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDER_MODE);
    return (saved as OrderType) || 'delivery';
  });

  // Delivery Address
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DELIVERY_ADDRESS);
    return saved ? JSON.parse(saved) : DEFAULT_DELIVERY_ADDRESS;
  });

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('pix');
  const [cashChangeFor, setCashChangeFor] = useState<string>('');

  // Active Client Session
  const [activeTableNumber, setActiveTableNumberState] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_TABLE);
    return saved ? parseInt(saved, 10) : 1;
  });

  const [customerName, setCustomerNameState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CUSTOMER_NAME) || '';
  });

  const [customerPhone, setCustomerPhone] = useState<string>('');

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [includeServiceFeeInCart, setIncludeServiceFeeInCart] = useState<boolean>(true);

  // Active Tracking Order (for real-time modal tracking)
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState<string | null>(null);

  // Modals & Panels
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState<boolean>(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState<boolean>(false);
  const [isWaiterModalOpen, setIsWaiterModalOpen] = useState<boolean>(false);
  const [isTableSelectorOpen, setIsTableSelectorOpen] = useState<boolean>(false);
  const [receiptOrderToPrint, setReceiptOrderToPrint] = useState<Order | null>(null);

  // Couriers / Motoboys
  const [couriers, setCouriers] = useState<Courier[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COURIERS);
    return saved ? JSON.parse(saved) : INITIAL_COURIERS;
  });

  // Driver Settlement To Print
  const [driverSettlementToPrint, setDriverSettlementToPrint] = useState<DriverSettlementData | null>(null);

  // Initial fetch from SQLite database
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data && data.name) {
          setConfig(prev => ({ ...prev, ...data }));
        }
      })
      .catch(err => console.warn('SQLite config load fallback', err));

    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
      })
      .catch(err => console.warn('SQLite products load fallback', err));

    fetch('/api/orders')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setOrders(data);
        }
      })
      .catch(err => console.warn('SQLite orders load fallback', err));
  }, []);

  // Persistent storage synchronizers
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COURIERS, JSON.stringify(couriers));
  }, [couriers]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WAITER_CALLS, JSON.stringify(waiterCalls));
  }, [waiterCalls]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DELIVERY_ADDRESS, JSON.stringify(deliveryAddress));
  }, [deliveryAddress]);

  const setOrderMode = (mode: OrderType) => {
    setOrderModeState(mode);
    localStorage.setItem(STORAGE_KEYS.ORDER_MODE, mode);
  };

  const setActiveTableNumber = (tableNum: number) => {
    setActiveTableNumberState(tableNum);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TABLE, tableNum.toString());
  };

  const setCustomerName = (name: string) => {
    setCustomerNameState(name);
    localStorage.setItem(STORAGE_KEYS.CUSTOMER_NAME, name);
  };

  const updateConfig = useCallback((newConfig: Partial<RestaurantConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newConfig };
      fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(err => console.error('Erro ao salvar config no SQLite:', err));
      return updated;
    });
  }, []);

  const toggleStoreStatus = useCallback(() => {
    setConfig(prev => {
      const newStatus = prev.isOpen === undefined ? false : !prev.isOpen;
      const updated = { ...prev, isOpen: newStatus };
      fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(err => console.error('Erro ao salvar status no SQLite:', err));
      return updated;
    });
  }, []);

  // Cart calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.totalPrice, 0);
  }, [cart]);

  // Delivery Fee (Free if over threshold or if not delivery)
  const cartDeliveryFee = useMemo(() => {
    if (orderMode !== 'delivery') return 0;
    if (config.freeDeliveryThreshold && cartSubtotal >= config.freeDeliveryThreshold) {
      return 0;
    }
    return config.deliveryFee;
  }, [orderMode, cartSubtotal, config.freeDeliveryThreshold, config.deliveryFee]);

  // Service Fee (Only for table dine-in)
  const cartServiceFee = useMemo(() => {
    if (orderMode !== 'table' || !includeServiceFeeInCart) return 0;
    return (cartSubtotal * config.serviceFeePercent) / 100;
  }, [orderMode, cartSubtotal, includeServiceFeeInCart, config.serviceFeePercent]);

  const cartTotal = useMemo(() => {
    return cartSubtotal + cartServiceFee + cartDeliveryFee;
  }, [cartSubtotal, cartServiceFee, cartDeliveryFee]);

  // Derived active tracking order
  const activeTrackingOrder = useMemo(() => {
    if (activeTrackingOrderId) {
      const found = orders.find(o => o.id === activeTrackingOrderId);
      if (found) return found;
    }
    // Default to the newest non-cancelled order
    return orders.find(o => o.status !== 'cancelled') || null;
  }, [orders, activeTrackingOrderId]);

  const setActiveTrackingOrder = useCallback((order: Order | null) => {
    setActiveTrackingOrderId(order ? order.id : null);
  }, []);

  // Product Modal Open/Close
  const openProductModal = useCallback((product: Product) => {
    setSelectedProductForModal(product);
    setIsProductModalOpen(true);
  }, []);

  const closeProductModal = useCallback(() => {
    setIsProductModalOpen(false);
    setSelectedProductForModal(null);
  }, []);

  // Cart Handlers
  const addToCart = useCallback((itemData: Omit<CartItem, 'cartItemId' | 'totalPrice'>) => {
    const cartItemId = `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const totalPrice = itemData.unitPrice * itemData.quantity;

    const newItem: CartItem = {
      ...itemData,
      cartItemId,
      totalPrice,
    };

    setCart(prev => [...prev, newItem]);
    if (config.enableSoundAlerts) {
      soundManager.playReadySound();
    }
  }, [config.enableSoundAlerts]);

  const updateCartItemQuantity = useCallback((cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter(i => i.cartItemId !== cartItemId));
      return;
    }
    setCart(prev =>
      prev.map(item => {
        if (item.cartItemId === cartItemId) {
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: item.unitPrice * newQuantity,
          };
        }
        return item;
      })
    );
  }, []);

  const removeFromCart = useCallback((cartItemId: string) => {
    setCart(prev => prev.filter(i => i.cartItemId !== cartItemId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Place Order (Handles Delivery, Table, Takeout)
  const placeOrder = useCallback(async (params?: PlaceOrderParams): Promise<Order | null> => {
    if (cart.length === 0) return null;

    // Check if restaurant is online/open
    if (config.isOpen === false) {
      console.warn('Estabelecimento fechado: pedidos bloqueados.');
      return null;
    }

    const effectiveMode = params?.orderType || orderMode;
    const effectiveName = params?.customerName || customerName.trim() || (effectiveMode === 'table' ? `Mesa ${activeTableNumber}` : 'Cliente Delivery');
    const effectivePhone = params?.customerPhone || customerPhone;
    const effectiveAddress = params?.deliveryAddress || deliveryAddress;
    const effectivePaymentMethod = params?.paymentMethod || selectedPaymentMethod;
    const effectiveChangeFor = params?.changeFor || (cashChangeFor ? parseFloat(cashChangeFor) : undefined);

    const nextOrderNumber = orders.length > 0 
      ? Math.max(...orders.map(o => o.orderNumber)) + 1 
      : 1046;

    const maxPrep = Math.max(...cart.map(c => c.product.prepTimeMinutes), 12);
    const newOrderId = `ord-${Date.now()}`;

    // Delivery vs Table calculations
    const subtotal = cartSubtotal;
    let serviceFee = 0;
    let delivFee = 0;

    if (effectiveMode === 'table') {
      serviceFee = includeServiceFeeInCart ? (subtotal * config.serviceFeePercent) / 100 : 0;
    } else if (effectiveMode === 'delivery') {
      delivFee = config.freeDeliveryThreshold && subtotal >= config.freeDeliveryThreshold ? 0 : config.deliveryFee;
    }

    const total = subtotal + serviceFee + delivFee;

    const newOrder: Order = {
      id: newOrderId,
      orderNumber: nextOrderNumber,
      orderType: effectiveMode,
      tableNumber: effectiveMode === 'table' ? (params?.tableNumber || activeTableNumber) : undefined,
      customerName: effectiveName,
      customerPhone: effectivePhone,
      deliveryAddress: effectiveMode === 'delivery' ? effectiveAddress : undefined,
      deliveryFee: effectiveMode === 'delivery' ? delivFee : undefined,
      changeFor: effectiveChangeFor,
      items: [...cart],
      subtotal,
      serviceFee,
      total,
      status: 'received',
      paymentStatus: effectivePaymentMethod === 'pix' ? 'paid' : 'pending',
      paymentMethod: effectivePaymentMethod,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedPrepTime: maxPrep,
    };

    // Update orders list
    setOrders(prev => [newOrder, ...prev]);
    setActiveTrackingOrderId(newOrderId);

    // If table order, update table status
    if (effectiveMode === 'table') {
      const tblNum = params?.tableNumber || activeTableNumber;
      setTables(prev =>
        prev.map(tbl => {
          if (tbl.tableNumber === tblNum) {
            return {
              ...tbl,
              status: tbl.status === 'available' ? 'occupied' : tbl.status,
              customerName: tbl.customerName || newOrder.customerName,
              openedAt: tbl.openedAt || new Date().toISOString(),
              activeOrderIds: [...tbl.activeOrderIds, newOrderId],
            };
          }
          return tbl;
        })
      );
    }

    // Audio chime for order sent to kitchen/delivery
    if (config.enableSoundAlerts) {
      soundManager.playNewOrderSound();
    }

    // Reset cart
    clearCart();
    setIsCartDrawerOpen(false);
    setIsOrderTrackerOpen(true);

    return newOrder;
  }, [
    cart,
    orders,
    orderMode,
    activeTableNumber,
    customerName,
    customerPhone,
    deliveryAddress,
    selectedPaymentMethod,
    cashChangeFor,
    cartSubtotal,
    includeServiceFeeInCart,
    config.isOpen,
    config.serviceFeePercent,
    config.freeDeliveryThreshold,
    config.deliveryFee,
    config.enableSoundAlerts,
    clearCart,
  ]);

  // Order Status Updates (KDS & Admin)
  const updateOrderStatus = useCallback((orderId: string, newStatus: OrderStatus, driverName?: string) => {
    setOrders(prev =>
      prev.map(ord => {
        if (ord.id === orderId) {
          return {
            ...ord,
            status: newStatus,
            driverName: driverName || ord.driverName,
            updatedAt: new Date().toISOString(),
          };
        }
        return ord;
      })
    );

    if (newStatus === 'ready' && config.enableSoundAlerts) {
      soundManager.playReadySound();
    }
  }, [config.enableSoundAlerts]);

  // Dispatch Delivery Order with Motoboy / Own Delivery / Freelancer / App
  const dispatchOrder = useCallback((orderId: string, dispatchInfo: DispatchParams | string) => {
    const isString = typeof dispatchInfo === 'string';
    const driverName = isString ? dispatchInfo : dispatchInfo.driverName;
    const courierId = !isString ? dispatchInfo.courierId : undefined;
    const deliveryType = !isString ? dispatchInfo.deliveryType : undefined;
    const driverPhone = !isString ? dispatchInfo.driverPhone : undefined;
    const driverVehicle = !isString ? dispatchInfo.driverVehicle : undefined;
    const driverFee = !isString ? dispatchInfo.driverFee : config.defaultDriverPayoutFee || 6.00;
    const trackingUrlOrCode = !isString ? dispatchInfo.trackingUrlOrCode : undefined;

    setOrders(prev =>
      prev.map(ord => {
        if (ord.id === orderId) {
          return {
            ...ord,
            status: 'dispatched',
            courierId: courierId || ord.courierId,
            deliveryType: deliveryType || ord.deliveryType || 'fixed',
            driverName: driverName || ord.driverName || 'Entregador',
            driverPhone: driverPhone || ord.driverPhone,
            driverVehicle: driverVehicle || ord.driverVehicle,
            driverFee: driverFee !== undefined ? driverFee : ord.driverFee || 6.00,
            driverSettled: false,
            dispatchedAt: new Date().toISOString(),
            trackingUrlOrCode: trackingUrlOrCode || ord.trackingUrlOrCode,
            updatedAt: new Date().toISOString(),
          };
        }
        return ord;
      })
    );

    if (config.enableSoundAlerts) {
      soundManager.playReadySound();
    }
  }, [config.defaultDriverPayoutFee, config.enableSoundAlerts]);

  // Mark Delivery as Completed / Delivered
  const markOrderDelivered = useCallback((orderId: string, paymentMethod?: PaymentMethod, cashCollected?: number) => {
    setOrders(prev =>
      prev.map(ord => {
        if (ord.id === orderId) {
          const isCash = (paymentMethod || ord.paymentMethod) === 'cash';
          return {
            ...ord,
            status: 'delivered',
            paymentStatus: 'paid',
            paymentMethod: paymentMethod || ord.paymentMethod || 'pix',
            cashCollectedByDriver: isCash ? (cashCollected !== undefined ? cashCollected : ord.total) : 0,
            deliveredAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
        return ord;
      })
    );

    if (config.enableSoundAlerts) {
      soundManager.playSuccessSound();
    }
  }, [config.enableSoundAlerts]);

  // Settle driver accounts (marca as corridas como acertadas/pagas com o caixa)
  const settleDriverAccounts = useCallback((driverNameOrCourierId?: string) => {
    setOrders(prev =>
      prev.map(ord => {
        if (ord.orderType === 'delivery' && ord.status === 'delivered') {
          if (!driverNameOrCourierId || ord.driverName === driverNameOrCourierId || ord.courierId === driverNameOrCourierId) {
            return {
              ...ord,
              driverSettled: true,
              updatedAt: new Date().toISOString(),
            };
          }
        }
        return ord;
      })
    );

    if (config.enableSoundAlerts) {
      soundManager.playSuccessSound();
    }
  }, [config.enableSoundAlerts]);

  // Courier CRUD
  const addCourier = useCallback((courierData: Omit<Courier, 'id'>) => {
    const id = `courier-${Date.now()}`;
    const newCourier: Courier = {
      ...courierData,
      id,
    };
    setCouriers(prev => [...prev, newCourier]);
  }, []);

  const updateCourier = useCallback((courierId: string, data: Partial<Courier>) => {
    setCouriers(prev =>
      prev.map(c => (c.id === courierId ? { ...c, ...data } : c))
    );
  }, []);

  const deleteCourier = useCallback((courierId: string) => {
    setCouriers(prev => prev.filter(c => c.id !== courierId));
  }, []);

  const toggleCourierActive = useCallback((courierId: string) => {
    setCouriers(prev =>
      prev.map(c => (c.id === courierId ? { ...c, active: !c.active } : c))
    );
  }, []);

  // Order Payment Update
  const updateOrderPayment = useCallback((orderId: string, status: PaymentStatus, method?: PaymentMethod) => {
    setOrders(prev =>
      prev.map(ord => {
        if (ord.id === orderId) {
          return {
            ...ord,
            paymentStatus: status,
            paymentMethod: method || ord.paymentMethod,
            updatedAt: new Date().toISOString(),
          };
        }
        return ord;
      })
    );

    if (status === 'paid' && config.enableSoundAlerts) {
      soundManager.playSuccessSound();
    }
  }, [config.enableSoundAlerts]);

  // Table Management
  const occupyTable = useCallback((tableNumber: number, name: string) => {
    setTables(prev =>
      prev.map(tbl => {
        if (tbl.tableNumber === tableNumber) {
          return {
            ...tbl,
            status: 'occupied',
            customerName: name,
            openedAt: new Date().toISOString(),
          };
        }
        return tbl;
      })
    );
  }, []);

  const requestBillForTable = useCallback((tableNumber: number) => {
    setTables(prev =>
      prev.map(tbl => {
        if (tbl.tableNumber === tableNumber) {
          return {
            ...tbl,
            status: 'bill_requested',
          };
        }
        return tbl;
      })
    );

    // Also register a waiter call for bill
    const newCall: WaiterCall = {
      id: `call-${Date.now()}`,
      tableNumber,
      type: 'bill',
      message: 'Solicitou o fechamento e a conta da mesa',
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    setWaiterCalls(prev => [newCall, ...prev]);

    if (config.enableSoundAlerts) {
      soundManager.playWaiterCallSound();
    }
  }, [config.enableSoundAlerts]);

  const closeTable = useCallback((tableNumber: number) => {
    setTables(prev =>
      prev.map(tbl => {
        if (tbl.tableNumber === tableNumber) {
          return {
            ...tbl,
            status: 'available',
            customerName: undefined,
            openedAt: undefined,
            activeOrderIds: [],
          };
        }
        return tbl;
      })
    );

    // Mark all orders from this table as delivered & paid
    setOrders(prev =>
      prev.map(ord => {
        if (ord.tableNumber === tableNumber && ord.status !== 'cancelled') {
          return {
            ...ord,
            status: 'delivered',
            paymentStatus: 'paid',
            updatedAt: new Date().toISOString(),
          };
        }
        return ord;
      })
    );

    // Resolve waiter calls for this table
    setWaiterCalls(prev =>
      prev.map(call => {
        if (call.tableNumber === tableNumber) {
          return { ...call, status: 'resolved' };
        }
        return call;
      })
    );

    if (config.enableSoundAlerts) {
      soundManager.playSuccessSound();
    }
  }, [config.enableSoundAlerts]);

  // Waiter Calls
  const callWaiter = useCallback((tableNumber: number, type: WaiterCallType, message?: string) => {
    const newCall: WaiterCall = {
      id: `call-${Date.now()}`,
      tableNumber,
      type,
      message: message || (type === 'waiter' ? 'Chamou o Garçom' : type === 'bill' ? 'Pediu a Conta' : 'Solicitação'),
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    setWaiterCalls(prev => [newCall, ...prev]);

    if (config.enableSoundAlerts) {
      soundManager.playWaiterCallSound();
    }
  }, [config.enableSoundAlerts]);

  const resolveWaiterCall = useCallback((callId: string) => {
    setWaiterCalls(prev =>
      prev.map(c => (c.id === callId ? { ...c, status: 'resolved' } : c))
    );
  }, []);

  // Product CRUD
  const toggleProductAvailability = useCallback((productId: string) => {
    setProducts(prev => {
      const updated = prev.map(p => (p.id === productId ? { ...p, isAvailable: !p.isAvailable } : p));
      const target = updated.find(p => p.id === productId);
      if (target) {
        fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(target),
        }).catch(err => console.error('Erro ao atualizar disponibilidade no SQLite:', err));
      }
      return updated;
    });
  }, []);

  const updateProductPrice = useCallback((productId: string, newPrice: number) => {
    setProducts(prev => {
      const updated = prev.map(p => (p.id === productId ? { ...p, price: newPrice } : p));
      const target = updated.find(p => p.id === productId);
      if (target) {
        fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(target),
        }).catch(err => console.error('Erro ao atualizar preço no SQLite:', err));
      }
      return updated;
    });
  }, []);

  const addProduct = useCallback((productData: Omit<Product, 'id'>) => {
    const id = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...productData,
      id,
    };
    setProducts(prev => [newProduct, ...prev]);

    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct),
    }).catch(err => console.error('Erro ao salvar produto no SQLite:', err));
  }, []);

  const updateProduct = useCallback((productId: string, data: Partial<Product>) => {
    setProducts(prev => {
      const updated = prev.map(p => (p.id === productId ? { ...p, ...data } : p));
      const target = updated.find(p => p.id === productId);
      if (target) {
        fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(target),
        }).catch(err => console.error('Erro ao atualizar produto no SQLite:', err));
      }
      return updated;
    });
  }, []);

  const deleteProduct = useCallback((productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    fetch(`/api/products/${productId}`, {
      method: 'DELETE',
    }).catch(err => console.error('Erro ao excluir produto no SQLite:', err));
  }, []);

  const clearAllProducts = useCallback(() => {
    setProducts(prev => {
      prev.forEach(p => {
        fetch(`/api/products/${p.id}`, { method: 'DELETE' }).catch(() => {});
      });
      return [];
    });
  }, []);

  // Queries
  const getOrderById = useCallback((orderId: string) => {
    return orders.find(o => o.id === orderId);
  }, [orders]);

  const getOrdersByTable = useCallback((tableNumber: number) => {
    return orders.filter(o => o.tableNumber === tableNumber);
  }, [orders]);

  // Clear and Reset helpers
  const clearAllOrders = useCallback(() => {
    setOrders([]);
    setTables(INITIAL_TABLES);
    setWaiterCalls([]);
    setActiveTrackingOrderId(null);
    setReceiptOrderToPrint(null);
    setDriverSettlementToPrint(null);

    fetch('/api/orders', { method: 'DELETE' }).catch(err =>
      console.error('Erro ao limpar pedidos no SQLite:', err)
    );

    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.TABLES);
    localStorage.removeItem(STORAGE_KEYS.WAITER_CALLS);
  }, []);

  const resetSystemToZero = useCallback((clearProducts: boolean = false) => {
    setOrders([]);
    setTables(INITIAL_TABLES);
    setWaiterCalls([]);
    setCouriers([]);
    setCart([]);
    setActiveTrackingOrderId(null);
    setReceiptOrderToPrint(null);
    setDriverSettlementToPrint(null);
    setCustomerNameState('');
    setCustomerPhone('');
    setDeliveryAddress(DEFAULT_DELIVERY_ADDRESS);

    if (clearProducts) {
      setProducts([]);
      localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    }

    fetch('/api/reset-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clearProducts }),
    }).catch(err => console.error('Erro ao zerar sistema no SQLite:', err));

    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.TABLES);
    localStorage.removeItem(STORAGE_KEYS.WAITER_CALLS);
    localStorage.removeItem(STORAGE_KEYS.COURIERS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMER_NAME);
    localStorage.removeItem(STORAGE_KEYS.DELIVERY_ADDRESS);
  }, []);

  const resetToInitialDemo = useCallback(() => {
    clearAllOrders();
  }, [clearAllOrders]);

  const simulateIncomingOrder = useCallback(() => {
    const isDeliverySim = Math.random() > 0.4;
    const names = ['Fernanda Lima', 'Rodrigo Faro', 'Juliana Paes', 'Thiago Silva', 'Ana Clara', 'Bruno Gagliasso', 'Mariana Ximenes'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const orderNum = Math.max(...orders.map(o => o.orderNumber), 1045) + 1;

    const item: CartItem = {
      cartItemId: `item-sim-${Date.now()}`,
      product: randomProduct,
      quantity: 1,
      selectedOptions: [],
      removedIngredients: [],
      notes: isDeliverySim ? 'Pedido Delivery via App' : 'Pedido de Mesa via Cardápio Digital',
      unitPrice: randomProduct.price,
      totalPrice: randomProduct.price,
    };

    const subtotal = randomProduct.price;
    const delivFee = isDeliverySim ? (subtotal >= (config.freeDeliveryThreshold || 120) ? 0 : config.deliveryFee) : 0;
    const serviceFee = !isDeliverySim ? (subtotal * config.serviceFeePercent) / 100 : 0;
    const total = subtotal + serviceFee + delivFee;

    const randomTable = [1, 3, 5, 8, 9, 11][Math.floor(Math.random() * 6)];

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      orderType: isDeliverySim ? 'delivery' : 'table',
      tableNumber: isDeliverySim ? undefined : randomTable,
      customerName: randomName,
      customerPhone: '(11) 98765-4321',
      deliveryAddress: isDeliverySim ? {
        street: 'Rua Augusta',
        number: `${Math.floor(Math.random() * 900) + 100}`,
        neighborhood: 'Consolação',
        city: 'São Paulo',
        complement: `Apto ${Math.floor(Math.random() * 120) + 10}`,
        reference: 'Próximo à estação',
      } : undefined,
      deliveryFee: isDeliverySim ? delivFee : undefined,
      items: [item],
      subtotal,
      serviceFee,
      total,
      status: 'received',
      paymentStatus: 'paid',
      paymentMethod: 'pix',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedPrepTime: randomProduct.prepTimeMinutes || 15,
    };

    setOrders(prev => [newOrder, ...prev]);

    if (!isDeliverySim) {
      setTables(prev =>
        prev.map(tbl => {
          if (tbl.tableNumber === randomTable) {
            return {
              ...tbl,
              status: 'occupied',
              customerName: randomName,
              openedAt: tbl.openedAt || new Date().toISOString(),
              activeOrderIds: [...tbl.activeOrderIds, newOrder.id],
            };
          }
          return tbl;
        })
      );
    }

    if (config.enableSoundAlerts) {
      soundManager.playNewOrderSound();
    }
  }, [products, orders, config.serviceFeePercent, config.deliveryFee, config.freeDeliveryThreshold, config.enableSoundAlerts]);

  // Authentication & Management Access
  const openAdminLogin = useCallback(() => {
    setIsLoginModalOpen(true);
  }, []);

  const closeAdminLogin = useCallback(() => {
    setIsLoginModalOpen(false);
  }, []);

  const loginAdmin = useCallback((username: string, pass: string): boolean => {
    const u = username.trim().toLowerCase();
    const p = pass.trim();

    if (u === 'admin_willian' && p === 'Trymore1@3') {
      setIsAdminAuthenticated(true);
      localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
      setViewMode('admin');
      setIsLoginModalOpen(false);
      return true;
    }
    return false;
  }, []);

  const logoutAdmin = useCallback(() => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    setViewMode('client');
  }, []);

  // JSON Database Export, Import and Download
  const exportDatabaseJSON = useCallback((): string => {
    const totalRevenue = orders.filter(o => o.paymentStatus === 'paid').reduce((acc, o) => acc + o.total, 0);
    const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
    const avgTicket = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;
    const totalDeliveries = orders.filter(o => o.orderType === 'delivery').length;

    const dbPayload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      restaurant: {
        name: config.name,
        tagline: config.tagline,
        phone: config.phone,
        address: config.address,
        pixKey: config.pixKey,
        currency: config.currency,
        serviceFeePercent: config.serviceFeePercent,
        deliveryFee: config.deliveryFee,
      },
      stats: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalOrders: orders.length,
        paidOrdersCount: paidOrders.length,
        averageTicket: Number(avgTicket.toFixed(2)),
        totalDeliveries,
        activeTablesCount: tables.filter(t => t.status !== 'available').length,
      },
      products,
      categories: INITIAL_CATEGORIES,
      tables,
      couriers,
      orders,
      waiterCalls,
    };

    return JSON.stringify(dbPayload, null, 2);
  }, [config, orders, products, tables, couriers, waiterCalls]);

  const importDatabaseJSON = useCallback((jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.products && Array.isArray(data.products)) {
        setProducts(data.products);
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
      }
      if (data.orders && Array.isArray(data.orders)) {
        setOrders(data.orders);
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(data.orders));
      }
      if (data.tables && Array.isArray(data.tables)) {
        setTables(data.tables);
        localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(data.tables));
      }
      if (data.couriers && Array.isArray(data.couriers)) {
        setCouriers(data.couriers);
        localStorage.setItem(STORAGE_KEYS.COURIERS, JSON.stringify(data.couriers));
      }
      if (data.restaurant) {
        setConfig(prev => ({
          ...prev,
          ...data.restaurant,
        }));
        localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify({ ...config, ...data.restaurant }));
      }
      return true;
    } catch (e) {
      console.error('Failed to parse database JSON', e);
      return false;
    }
  }, [config]);

  const downloadDatabaseJSON = useCallback(() => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `comanda_restaurante_banco_dados_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportDatabaseJSON]);

  const value = {
    viewMode,
    setViewMode,
    adminTab,
    setAdminTab,
    isAdminAuthenticated,
    isLoginModalOpen,
    openAdminLogin,
    closeAdminLogin,
    loginAdmin,
    logoutAdmin,
    exportDatabaseJSON,
    importDatabaseJSON,
    downloadDatabaseJSON,
    config,
    updateConfig,
    toggleStoreStatus,
    categories: INITIAL_CATEGORIES,
    products,
    toggleProductAvailability,
    updateProductPrice,
    addProduct,
    updateProduct,
    deleteProduct,
    clearAllProducts,
    couriers,
    addCourier,
    updateCourier,
    deleteCourier,
    toggleCourierActive,
    orderMode,
    setOrderMode,
    deliveryAddress,
    setDeliveryAddress,
    deliveryFee: cartDeliveryFee,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    cashChangeFor,
    setCashChangeFor,
    tables,
    activeTableNumber,
    setActiveTableNumber,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    occupyTable,
    requestBillForTable,
    closeTable,
    cart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    cartSubtotal,
    cartServiceFee,
    cartDeliveryFee,
    includeServiceFeeInCart,
    setIncludeServiceFeeInCart,
    orders,
    activeTrackingOrder,
    setActiveTrackingOrder,
    placeOrder,
    updateOrderStatus,
    dispatchOrder,
    markOrderDelivered,
    settleDriverAccounts,
    updateOrderPayment,
    getOrderById,
    getOrdersByTable,
    waiterCalls,
    callWaiter,
    resolveWaiterCall,
    isProductModalOpen,
    selectedProductForModal,
    openProductModal,
    closeProductModal,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    isOrderTrackerOpen,
    setIsOrderTrackerOpen,
    isBillModalOpen,
    setIsBillModalOpen,
    isWaiterModalOpen,
    setIsWaiterModalOpen,
    isTableSelectorOpen,
    setIsTableSelectorOpen,
    receiptOrderToPrint,
    setReceiptOrderToPrint,
    driverSettlementToPrint,
    setDriverSettlementToPrint,
    clearAllOrders,
    resetSystemToZero,
    resetToInitialDemo,
    simulateIncomingOrder,
  };

  return <ComandaContext.Provider value={value}>{children}</ComandaContext.Provider>;
};

export const useComanda = (): ComandaContextType => {
  const context = useContext(ComandaContext);
  if (!context) {
    throw new Error('useComanda must be used within a ComandaProvider');
  }
  return context;
};
