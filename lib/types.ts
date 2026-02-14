export interface Category {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string | Date;
  _count?: { products: number };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string | null;
  price: number;
  stock?: number; // Optional as some queries might not return it
  minStock?: number;
  category?: { name: string };
  categoryId?: string;
  quantity?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Supplier {
  id: string;
  name: string;
  cnpj?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface Customer {
  id: string;
  name: string;
  cpfCnpj?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product: { name: string; sku: string };
  receivedQty?: number; // Specific to PO
}

export interface PurchaseOrder {
  id: string;
  code: string;
  status: "PENDENTE" | "APROVADA" | "EM_TRANSITO" | "RECEBIDA" | "CANCELADA";
  totalValue: number;
  notes: string | null;
  createdAt: string | Date;
  supplier: { name: string; id?: string };
  items: OrderItem[];
}

export interface SalesOrder {
  id: string;
  code: string;
  status: "PENDENTE" | "APROVADA" | "FATURADA" | "CANCELADA";
  totalValue: number;
  notes: string | null;
  createdAt: string | Date;
  customer: { name: string; id?: string };
  items: OrderItem[];
}

export interface Movement {
  id: string;
  type: "IN" | "OUT";
  quantity: number;
  reason: string | null;
  createdAt: string | Date;
  product: { name: string; sku: string };
}

export interface Payable {
  id: string;
  code: string;
  amount: number;
  status: "PENDENTE" | "PAGO";
  dueDate: string | Date | null;
  paidAt: string | Date | null;
  createdAt: string | Date;
  supplier?: { name: string };
  purchaseOrder?: {
    code: string;
    supplier?: { name: string };
  };
}

export interface Receivable {
  id: string;
  code: string;
  amount: number;
  status: "PENDENTE" | "RECEBIDO";
  dueDate: string | Date | null;
  receivedAt: string | Date | null;
  createdAt: string | Date;
  customer?: { name: string };
  salesOrder?: {
    code: string;
    customer?: { name: string };
  };
}

export type PeriodKey = "today" | "7d" | "30d" | "12m" | "custom";

export interface DashboardData {
  totalProducts: number;
  totalValue: number;
  totalQuantity: number;
  totalCategories: number;
  lowStockCount: number;
  totalIn: number;
  totalOut: number;
  lowStock: Array<{
    id: string;
    name: string;
    sku: string;
    quantity: number;
    minStock: number;
    category: { name: string };
  }>;
  recentMovements: Array<{
    id: string;
    type: string;
    quantity: number;
    reason: string;
    createdAt: string;
    product: { name: string; sku: string };
  }>;
  categories: Array<{ name: string; products: number; value: number }>;
  movementTimeline: Array<{ date: string; in: number; out: number }>;
  financials: {
    totalPayable: number;
    totalPaid: number;
    totalReceivable: number;
    totalReceived: number;
    balance: number;
  };
  purchaseOrdersByStatus: Record<string, number>;
  salesOrdersByStatus: Record<string, number>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
