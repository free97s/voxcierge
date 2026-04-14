'use client'

import { VoiceRecorder } from '@/components/voice/VoiceRecorder'

export default function CapturePage() {
  return (
    <div className="flex flex-col items-center p-4 md:p-6 gap-8 max-w-2xl mx-auto">
      <div className="text-center space-y-2 pt-4">
        <h1 className="text-2xl font-bold tracking-tight">음성 캡처</h1>
        <p className="text-muted-foreground">음성으로 할 일을 등록하세요</p>
      </div>

      <VoiceRecorder />
    </div>
  )
}
