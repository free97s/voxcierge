/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

interface WebSpeechOptions {
  language?: string
  continuous?: boolean
  interimResults?: boolean
}

interface WebSpeechCallbacks {
  onInterimResult: (text: string) => void
  onFinalResult: (text: string) => void
  onError: (error: string) => void
  onEnd: () => void
}

export class WebSpeechRecognizer {
  private recognition: any = null
  private options: WebSpeechOptions

  constructor(options: WebSpeechOptions = {}) {
    this.options = {
      language: 'ko-KR',
      continuous: true,
      interimResults: true,
      ...options,
    }
  }

  start(callbacks: WebSpeechCallbacks): void {
    if (!WebSpeechRecognizer.isSupported()) {
      callbacks.onError('이 브라우저는 실시간 음성 인식을 지원하지 않습니다.')
      return
    }

    const SpeechRecognitionImpl =
      window.SpeechRecognition ?? window.webkitSpeechRecognition

    this.recognition = new SpeechRecognitionImpl()
    this.recognition.lang = this.options.language ?? 'ko-KR'
    this.recognition.continuous = this.options.continuous ?? true
    this.recognition.interimResults = this.options.interimResults ?? true
    this.recognition.maxAlternatives = 1

    this.recognition.onresult = (event: any) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript
        if (result.isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      if (interimTranscript) {
        callbacks.onInterimResult(interimTranscript)
      }
      if (finalTranscript) {
        callbacks.onFinalResult(finalTranscript)
      }
    }

    this.recognition.onerror = (event: any) => {
      const errorMessages: Record<string, string> = {
        'no-speech': '음성이 감지되지 않았습니다.',
        'audio-capture': '마이크에 접근할 수 없습니다.',
        'not-allowed': '마이크 권한이 거부되었습니다.',
        network: '네트워크 오류가 발생했습니다.',
        aborted: '음성 인식이 중단되었습니다.',
        'service-not-allowed': '음성 인식 서비스가 허용되지 않습니다.',
        'bad-grammar': '문법 오류가 발생했습니다.',
        'language-not-supported': '지원되지 않는 언어입니다.',
      }
      const message = errorMessages[event.error] ?? `음성 인식 오류: ${event.error}`
      callbacks.onError(message)
    }

    this.recognition.onend = () => {
      callbacks.onEnd()
    }

    try {
      this.recognition.start()
    } catch {
      callbacks.onError('음성 인식을 시작할 수 없습니다.')
    }
  }

  stop(): void {
    if (this.recognition) {
      try {
        this.recognition.stop()
      } catch {
        // already stopped
      }
      this.recognition = null
    }
  }

  static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      (typeof window.SpeechRecognition !== 'undefined' ||
        typeof window.webkitSpeechRecognition !== 'undefined')
    )
  }
}
