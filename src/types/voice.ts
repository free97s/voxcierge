export type VoiceSessionStatus =
  | 'recording'
  | 'processing'
  | 'transcribed'
  | 'analyzed'
  | 'failed'
  | 'deleted';

export type SttMethod = 'whisper' | 'webspeech' | 'hybrid';

export type RecordingState = 'idle' | 'recording' | 'paused' | 'processing';

export interface VoiceSession {
  id: string;
  userId: string;
  status: VoiceSessionStatus;
  audioStoragePath?: string;
  audioDeletedAt?: string;
  durationSeconds?: number;
  rawTranscript?: string;
  whisperLanguage: string;
  sttMethod?: SttMethod;
  createdAt: string;
  processedAt?: string;
}

export interface TranscriptSegment {
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
}
