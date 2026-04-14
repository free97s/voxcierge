import { MODELS } from './models'

export async function generateSpeech(text: string): Promise<ArrayBuffer> {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODELS.tts,
      voice: 'alloy',
      input: text,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`TTS request failed: ${response.status} ${error}`)
  }

  return response.arrayBuffer()
}
