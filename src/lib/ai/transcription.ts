import { MODELS } from './models'

interface TranscriptionResult {
  text: string
  segments: Array<{
    id: number
    start: number
    end: number
    text: string
  }>
  language: string
  duration: number
}

export async function transcribeAudio(audioBlob: Blob, language = 'ko'): Promise<TranscriptionResult> {
  const formData = new FormData()
  formData.append('file', audioBlob, 'audio.webm')
  formData.append('model', MODELS.transcription)
  formData.append('language', language)
  formData.append('response_format', 'verbose_json')

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Transcription request failed: ${response.status} ${error}`)
  }

  const data = await response.json()

  return {
    text: data.text,
    segments: data.segments ?? [],
    language: data.language,
    duration: data.duration,
  }
}
