export type GenderFilter = 'Homme' | 'Femme' | 'Unisexe';

export type OrderStatus =
  | 'En attente'
  | 'Confirmée'
  | 'En préparation'
  | 'Expédiée'
  | 'Livrée'
  | 'Annulée';

export const ORDER_STATUSES: readonly OrderStatus[] = [
  'En attente',
  'Confirmée',
  'En préparation',
  'Expédiée',
  'Livrée',
  'Annulée',
] as const;

export type PaymentMethod = 'cod' | 'electronic';

export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string;
  displayOrder: number;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  brand: string;
  categoryId: number;
  categorySlug: string;
  categoryName: string;
  gender: GenderFilter;
  priceMad: number;
  promoPriceMad: number | null;
  stock: number;
  color: string;
  material: string;
  frameType: string;
  sizes: string[];
  colors: string[];
  images: string[];
  description: string;
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isBestseller: boolean;
  isDemo: boolean;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor: string;
  selectedSize: string;
}

export interface OrderItem {
  productId: number;
  productName: string;
  image: string;
  unitPriceMad: number;
  quantity: number;
  selectedColor: string;
  selectedSize: string;
  lineTotalMad: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId: number | null;
  userId: number | null;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  notes: string;
  items: OrderItem[];
  subtotalMad: number;
  discountMad: number;
  promoCode: string | null;
  shippingMad: number;
  totalMad: number;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: number;
  userId: number | null;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  ordersCount: number;
  totalSpentMad: number;
  createdAt: string;
}

export interface Promotion {
  id: number;
  code: string;
  description: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

export interface Review {
  id: number;
  productId: number | null;
  authorName: string;
  city: string;
  rating: number;
  comment: string;
  verified: boolean;
  createdAt: string;
}

export interface SiteSettings {
  brandName: string;
  slogan: string;
  logoUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBannerUrl: string;
  aboutText: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  hours: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  shippingFeeMad: number;
  freeShippingThresholdMad: number;
  electronicPaymentConfigured: boolean;
  electronicPaymentProviderName: string;
}

export interface UserSession {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  role: 'admin' | 'customer';
  createdAt: string;
}

export interface AdminDashboardStats {
  revenueMad: number;
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  totalCustomers: number;
  totalProducts: number;
  outOfStockProducts: number;
  salesSeries: { date: string; revenueMad: number; ordersCount: number }[];
  recentOrders: Order[];
}
