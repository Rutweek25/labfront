export type Role = "DOCTOR" | "TECHNICIAN" | "ADMIN";

export interface User {
  id: string | number;
  name: string;
  email: string;
  role: Role;
  isActive?: boolean;
  createdAt?: string;
}

export interface Patient {
  id: string | number;
  name: string;
  phone: string;
  age: number;
  gender: string;
  createdAt: string;
}

export interface TestItem {
  id: string | number;
  name: string;
  price: number;
}

export interface OrderTest {
  testId: string | number;
  unitPrice: number;
  test: TestItem;
}

export interface Payment {
  id: string | number;
  orderId: string | number;
  amount: number;
  status: "PENDING" | "PAID";
  method: "CASH" | "ONLINE";
  createdAt: string;
}

export interface Report {
  id: string | number;
  fileName: string;
  fileUrl: string;
  filePath: string;
  fileType: string;
  status: "UPLOADED" | "READY" | "REJECTED";
  createdAt: string;
}

export interface Order {
  id: string | number;
  patientId: string | number;
  doctorId: string | number;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  sampleStatus: "PENDING" | "COLLECTED" | "RECEIVED" | "PROCESSING";
  createdAt: string;
  patient: Patient;
  orderTests: OrderTest[];
  payments: Payment[];
  reports: Report[];
  totalAmount: number;
  paymentStatus: "PAID" | "PENDING";
}

export interface NotificationItem {
  id: string | number;
  recipientId: string | number;
  type: string;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | number | null;
  metadata?: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string | number;
  actorId?: string | number | null;
  actorRole?: Role | null;
  entityType: string;
  entityId?: string | number | null;
  action: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface PaymentStatusRow {
  orderId: string | number;
  patientName: string;
  phone: string;
  tests: string[];
  totalAmount: number;
  paymentStatus: "PAID" | "PENDING";
}

export interface LabPaymentRow {
  orderId: string | number;
  patientName: string;
  tests: string[];
  totalAmount: number;
  paymentStatus: "PAID" | "PENDING";
}

export interface AdminDashboardCards {
  totalDoctors: number;
  totalLabTechnicians: number;
  patientCount: number;
  orderCount: number;
  revenue: number;
  pendingPayments: number;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface PaymentStatusPoint {
  name: "PAID" | "PENDING";
  value: number;
}

export interface AdminDashboardAnalytics {
  cards: AdminDashboardCards;
  charts: {
    revenueOverTime: TimeSeriesPoint[];
    ordersPerDay: TimeSeriesPoint[];
    revenueByTest: Array<{ name: string; value: number }>;
    topTests: Array<{ name: string; value: number }>;
    doctorPerformance: Array<{ name: string; orders: number; paidOrders: number }>;
    paymentStatusBreakdown: PaymentStatusPoint[];
  };
}

export interface AdminPaymentRow {
  id: string | number;
  orderId: string | number;
  patientName: string;
  tests: string[];
  amount: number;
  status: "PAID" | "PENDING";
  method: "CASH" | "ONLINE";
  createdAt: string;
}

export interface AdminReportRow {
  id: string | number;
  orderId: string | number;
  patientName: string;
  status: "UPLOADED" | "READY" | "REJECTED";
  fileName: string;
  fileUrl: string;
  createdAt: string;
}

export interface AdminSettings {
  appName: string;
  currency: string;
  defaultRole: "DOCTOR" | "TECHNICIAN" | "ADMIN";
  allowSelfRegistration: boolean;
}
