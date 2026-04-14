import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractIntent } from '@/lib/ai/intent-extraction';

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

    const body = await request.json() as { sessionId?: unknown; text?: unknown };
    const { sessionId, text } = body;

    if (typeof sessionId !== 'string' || !sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }
    if (typeof text !== 'string' || !text) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    // Verify the session belongs to the user
    const { data: session, error: sessionError } = await supabase
      .from('voice_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Voice session not found' }, { status: 404 });
    }

    // Derive timezone from request headers, fall back to UTC
    const userTimezone =
      request.headers.get('x-timezone') ??
      Intl.DateTimeFormat().resolvedOptions().timeZone ??
      'UTC';

    const intent = await extractIntent(text, userTimezone);

    // Store result in intent_extractions table
    const { data: extraction, error: insertError } = await supabase
      .from('intent_extractions')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        intent_type: intent.intentType,
        action: intent.action,
        person: intent.person ?? null,
        place: intent.place ?? null,
        time_raw: intent.timeRaw ?? null,
        time_absolute: intent.timeAbsolute ?? null,
        confidence: intent.confidence,
        tags: intent.tags,
      })
      .select()
      .single();

    if (insertError || !extraction) {
      console.error('Failed to insert intent extraction:', insertError);
      return NextResponse.json(
        { error: 'Failed to store intent extraction' },
        { status: 500 }
      );
    }

    // Update voice_sessions status to 'analyzed'
    const { error: updateError } = await supabase
      .from('voice_sessions')
      .update({ status: 'analyzed' })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Failed to update voice session status:', updateError);
    }

    return NextResponse.json({
      intentId: extraction.id,
      intent,
    });
  } catch (error) {
    console.error('Intent analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
