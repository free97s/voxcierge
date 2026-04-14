export type BriefingType = 'morning' | 'evening' | 'adhoc';

export interface Briefing {
  id: string;
  userId: string;
  type: BriefingType;
  content: string;
  ttsUrl?: string;
  tasksSummary: Record<string, unknown>;
  modelUsed?: string;
  generatedAt: string;
  deliveredAt?: string;
  readAt?: string;
}
