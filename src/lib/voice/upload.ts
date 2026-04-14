import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Uploads a voice recording to Supabase Storage.
 * Bucket: 'voice-recordings'
 * Path: {userId}/{sessionId}.webm
 *
 * @returns The storage path (e.g. "user-123/session-abc.webm")
 */
export async function uploadVoiceAudio(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string,
  audioBlob: Blob
): Promise<string> {
  const storagePath = `${userId}/${sessionId}.webm`

  const { error } = await supabase.storage
    .from('voice-recordings')
    .upload(storagePath, audioBlob, {
      contentType: audioBlob.type || 'audio/webm',
      upsert: true,
    })

  if (error) {
    throw new Error(`오디오 업로드 실패: ${error.message}`)
  }

  return storagePath
}
