import { create } from 'zustand';
import type { RecordingState } from '@/types/voice';
import type { Intent } from '@/lib/ai/intent-extraction';

interface VoiceStore {
  // State
  currentSessionId: string | null;
  recordingState: RecordingState;
  transcript: string | null;
  intent: Intent | null;

  // Actions
  setSessionId: (sessionId: string | null) => void;
  setRecordingState: (state: RecordingState) => void;
  setTranscript: (transcript: string | null) => void;
  setIntent: (intent: Intent | null) => void;
  reset: () => void;
}

const initialState = {
  currentSessionId: null,
  recordingState: 'idle' as RecordingState,
  transcript: null,
  intent: null,
};

export const useVoiceStore = create<VoiceStore>((set) => ({
  ...initialState,

  setSessionId: (sessionId) => set({ currentSessionId: sessionId }),

  setRecordingState: (recordingState) => set({ recordingState }),

  setTranscript: (transcript) => set({ transcript }),

  setIntent: (intent) => set({ intent }),

  reset: () => set(initialState),
}));
