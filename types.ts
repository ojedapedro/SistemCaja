export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku: string;
  category: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export type Role = 'admin' | 'seller' | 'warehouse';

export interface User {
  id: string;
  name: string;
  username: string;
  role: Role;
  password?: string; // In a real app, never store plain text passwords
}

export interface Sale {
  id: string;
  date: string; // ISO string
  items: { productId: string; quantity: number; priceAtSale: number; name: string }[];
  total: number;
  paymentMethod: string; // Changed to string to support specific types (Zelle, Binance, etc.)
  paymentType?: 'contado' | 'credito';
  customerId?: string;
  customerName?: string;
  exchangeRate?: number;
}

export interface Purchase {
  id: string;
  date: string;
  supplier: string;
  items: { productId: string; quantity: number; cost: number; name: string }[];
  total: number;
}

export interface Return {
  id: string;
  saleId: string;
  date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  customerId?: string;
}

export interface ExternalApp {
  id: string;
  name: string;
  url: string;
  description: string;
  iconName: string; // Representing icon name
}

export type ViewState = 'dashboard' | 'sales' | 'purchases' | 'returns' | 'inventory' | 'apps' | 'customers' | 'users';