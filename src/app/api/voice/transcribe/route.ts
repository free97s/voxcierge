import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transcribeAudio } from '@/lib/ai/transcription';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio');
    const language = (formData.get('language') as string | null) ?? 'ko';

    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json(
        { error: 'Missing or invalid audio file' },
        { status: 400 }
      );
    }

    // Create a voice_sessions row with status 'processing' before transcribing
    const { data: session, error: insertError } = await supabase
      .from('voice_sessions')
      .insert({
        user_id: user.id,
        status: 'processing',
        whisper_language: language,
        stt_method: 'whisper',
      })
      .select()
      .single();

    if (insertError || !session) {
      return NextResponse.json(
        { error: 'Failed to create voice session' },
        { status: 500 }
      );
    }

    const result = await transcribeAudio(audioFile, language);

    const { error: updateError } = await supabase
      .from('voice_sessions')
      .update({
        status: 'transcribed',
        raw_transcript: result.text,
        duration_seconds: Math.round(result.duration),
        processed_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('Failed to update voice session:', updateError);
    }

    return NextResponse.json({
      sessionId: session.id,
      text: result.text,
      segments: result.segments,
      language: result.language,
      duration: result.duration,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Transcription failed' },
      { status: 500 }
    );
  }
}
