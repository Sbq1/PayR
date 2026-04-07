export interface PlanFeatures {
  maxTables: number;
  allowSplitBill: boolean;
  allowUpsell: boolean;
  allowAnalytics: boolean;
  allowCustomTheme: boolean;
}

export interface PlanUsage {
  tablesUsed: number;
  tablesLimit: number;
  canAddTable: boolean;
}
