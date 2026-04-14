export type IntentType = 'task' | 'note' | 'reminder' | 'query' | 'unknown';

export interface ExtractedIntent {
  intentType: IntentType;
  action: string;
  person?: string;
  place?: string;
  timeRaw?: string;
  timeAbsolute?: string;
  confidence: number;
  tags: string[];
}

export interface ModelConfig {
  intent: string;
  briefing: string;
  insights: string;
  embedding: string;
  transcription: string;
  tts: string;
}
