export interface Recommendation {
  type: string;
  message: string;
  priority: number;
}

export interface Insight {
  id: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
  productiveDays: string[];
  productiveTimes: string[];
  taskCategories: Record<string, number>;
  completionRate: number;
  recommendations: Recommendation[];
  modelUsed?: string;
  generatedAt: string;
}
