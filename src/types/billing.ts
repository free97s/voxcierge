import type { TierName } from '@/config/tiers';

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'paused';

export type UsageMetricType =
  | 'voice_minutes'
  | 'transcriptions'
  | 'ai_calls'
  | 'briefings'
  | 'storage_mb';

export interface Subscription {
  id: string;
  userId: string;
  tier: TierName;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  status: SubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
}

export interface UsageMetric {
  id: string;
  userId: string;
  metricType: UsageMetricType;
  value: number;
  periodMonth: string;
}
