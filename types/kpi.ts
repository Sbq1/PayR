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

export interface KpiComparison {
  salesDelta: number;  // percentage change vs previous period
  ordersDelta: number; // percentage change vs previous period
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
  bestSeller: TopProduct | null;
  avgDailyRevenue: number; // COP cents
  comparison: KpiComparison;
}

export type KpiPeriod = "today" | "week" | "month";
