import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadVoiceAudio } from '@/lib/voice/upload';

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

    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json(
        { error: 'Missing or invalid audio file' },
        { status: 400 }
      );
    }

    // Create the voice_sessions row first so we have a sessionId for the storage path
    const { data: session, error: insertError } = await supabase
      .from('voice_sessions')
      .insert({
        user_id: user.id,
        status: 'recording',
        whisper_language: 'ko',
      })
      .select()
      .single();

    if (insertError || !session) {
      return NextResponse.json(
        { error: 'Failed to create voice session' },
        { status: 500 }
      );
    }

    const storagePath = await uploadVoiceAudio(
      supabase,
      user.id,
      session.id,
      audioFile
    );

    // Update the session with the storage path
    const { error: updateError } = await supabase
      .from('voice_sessions')
      .update({ audio_storage_path: storagePath })
      .eq('id', session.id);

    if (updateError) {
      console.error('Failed to update audio_storage_path:', updateError);
    }

    return NextResponse.json({
      sessionId: session.id,
      storagePath,
    });
  } catch (error) {
    console.error('Voice upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
