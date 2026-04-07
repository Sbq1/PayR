export interface KpiOverview {
  totalSales: number; // COP cents
  orderCount: number;
  avgTicket: number; // COP cents
  avgTipPercentage: number;
}

export interface SalesDataPoint {
  date: string;
  sales: number; // COP cents
  orders: number;
}

export interface TopProduct {
  name: string;
  quantity: number;
  revenue: number; // COP cents
}

export interface PaymentMethodDistribution {
  method: string;
  count: number;
  percentage: number;
}

export interface PeakHour {
  hour: number; // 0-23
  orders: number;
  sales: number; // COP cents
}

export interface KpiDashboard {
  overview: KpiOverview;
  salesOverTime: SalesDataPoint[];
  topProducts: TopProduct[];
  paymentMethods: PaymentMethodDistribution[];
  peakHours: PeakHour[];
  upsellConversion: {
    offered: number;
    accepted: number;
    rate: number;
  };
}

export type KpiPeriod = "today" | "week" | "month" | "custom";
