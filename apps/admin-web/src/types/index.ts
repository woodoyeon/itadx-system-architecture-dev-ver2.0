export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type Role = 'bank' | 'mart' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  martId: string | null;
}

export interface Mart {
  id: string;
  name: string;
  businessNumber: string;
  representative: string | null;
  status: 'active' | 'inactive' | 'suspended';
  screeningResult: string | null;
  createdAt: string;
}

export interface Branch {
  id: string;
  martId: string;
  name: string;
  riskIndex: number | null;
  riskChange: number | null;
  isActive: boolean;
}

export interface Merchant {
  id: string;
  martId: string;
  name: string;
  businessNumber: string;
  category: string | null;
  score: number | null;
  grade: string | null;
  isActive: boolean;
}

export interface Receiving {
  id: string;
  merchantId: string;
  martId: string;
  receivingDate: string;
  totalAmount: number;
  items: Record<string, unknown>[];
  status: 'pending' | 'confirmed' | 'cancelled';
  confirmedAt: string | null;
  merchant?: Merchant;
  mart?: Mart;
}

export interface Settlement {
  id: string;
  merchantId: string;
  martId: string;
  period: string;
  amount: number;
  status: 'pending' | 'completed' | 'overdue';
}
