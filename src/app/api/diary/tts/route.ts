import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSpeech } from '@/lib/ai/tts'

export const dynamic = 'force-dynamic'

// POST /api/diary/tts { diaryId: string }
// Generates TTS audio for a diary entry, uploads to Supabase Storage, returns audio_url
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as { diaryId?: string }
    const { diaryId } = body
    if (!diaryId) {
      return NextResponse.json({ error: 'diaryId is required' }, { status: 400 })
    }

    // Fetch the diary
    const { data: diary, error: fetchError } = await supabase
      .from('daily_diaries')
      .select('id, content, diary_date, audio_url')
      .eq('id', diaryId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (fetchError || !diary) {
      return NextResponse.json({ error: 'Diary not found' }, { status: 404 })
    }

    // Return existing audio if available
    if (diary.audio_url) {
      return NextResponse.json({ audioUrl: diary.audio_url as string })
    }

    // Generate TTS
    const audioBuffer = await generateSpeech(diary.content as string)
    const audioBytes = new Uint8Array(audioBuffer)

    // Upload to Supabase Storage
    const storagePath = `diaries/${user.id}/${diary.diary_date as string}.mp3`
    const { error: uploadError } = await supabase.storage
      .from('audio')
      .upload(storagePath, audioBytes, {
        contentType: 'audio/mpeg',
        upsert: true,
      })

    if (uploadError) {
      console.error('[POST /api/diary/tts] storage upload error:', uploadError)
      // Return audio data directly as fallback — client can use blob URL
      return NextResponse.json(
        { error: 'Storage upload failed', audioUrl: null },
        { status: 500 },
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('audio').getPublicUrl(storagePath)
    const audioUrl = urlData.publicUrl

    // Save audio_url to diary
    await supabase
      .from('daily_diaries')
      .update({ audio_url: audioUrl })
      .eq('id', diaryId)
      .eq('user_id', user.id)

    return NextResponse.json({ audioUrl })
  } catch (err) {
    console.error('[POST /api/diary/tts] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
