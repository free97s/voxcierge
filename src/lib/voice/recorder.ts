export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private stream: MediaStream | null = null
  private onDataAvailableCallback?: (chunk: Blob) => void

  async start(onDataAvailable?: (chunk: Blob) => void): Promise<void> {
    this.onDataAvailableCallback = onDataAvailable
    this.audioChunks = []

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          throw new Error('마이크 권한이 거부되었습니다. 브라우저 설정에서 허용해 주세요.')
        }
        if (err.name === 'NotFoundError') {
          throw new Error('마이크를 찾을 수 없습니다. 마이크가 연결되어 있는지 확인해 주세요.')
        }
      }
      throw new Error('마이크에 접근할 수 없습니다.')
    }

    const mimeType = this.getSupportedMimeType()
    const options: MediaRecorderOptions = mimeType ? { mimeType } : {}

    this.mediaRecorder = new MediaRecorder(this.stream, options)

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data)
        this.onDataAvailableCallback?.(event.data)
      }
    }

    this.mediaRecorder.start(250)
  }

  pause(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.pause()
    }
  }

  resume(): void {
    if (this.mediaRecorder?.state === 'paused') {
      this.mediaRecorder.resume()
    }
  }

  async stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('녹음이 시작되지 않았습니다.'))
        return
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType ?? 'audio/webm'
        const audioBlob = new Blob(this.audioChunks, { type: mimeType })
        this.stopStream()
        resolve(audioBlob)
      }

      this.mediaRecorder.onerror = (event) => {
        this.stopStream()
        reject(new Error(`녹음 오류: ${(event as ErrorEvent).message ?? '알 수 없는 오류'}`))
      }

      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop()
      } else {
        this.stopStream()
        const mimeType = this.mediaRecorder.mimeType ?? 'audio/webm'
        resolve(new Blob(this.audioChunks, { type: mimeType }))
      }
    })
  }

  getStream(): MediaStream | null {
    return this.stream
  }

  destroy(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
    }
    this.stopStream()
    this.mediaRecorder = null
    this.audioChunks = []
  }

  private stopStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }
  }

  private getSupportedMimeType(): string {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ]
    for (const type of candidates) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }
    return ''
  }
}
