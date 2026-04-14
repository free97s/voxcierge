import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateBriefingSummary } from '@/lib/ai/summarization';
import type { BriefingType } from '@/types/briefing';

function getBriefingType(hourOfDay: number): BriefingType {
  if (hourOfDay >= 5 && hourOfDay < 12) return 'morning';
  if (hourOfDay >= 18 || hourOfDay < 5) return 'evening';
  return 'adhoc';
}

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

    // Fetch user profile for display name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, display_name')
      .eq('id', user.id)
      .maybeSingle();

    const userName =
      profile?.display_name ??
      profile?.full_name ??
      user.email?.split('@')[0] ??
      '사용자';

    const now = new Date();
    const tzHeader = request.headers.get('x-timezone');
    let hourOfDay: number;

    if (tzHeader) {
      const localTime = new Date().toLocaleString('en-US', {
        timeZone: tzHeader,
        hour: 'numeric',
        hour12: false,
      });
      hourOfDay = parseInt(localTime, 10);
    } else {
      hourOfDay = now.getUTCHours();
    }

    const type = getBriefingType(hourOfDay);

    // Fetch tasks grouped by state
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const [pendingResult, completedResult, overdueResult] = await Promise.all([
      supabase
        .from('tasks')
        .select('id, title, due_at, priority')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .gte('due_at', todayStart.toISOString())
        .lte('due_at', todayEnd.toISOString()),

      supabase
        .from('tasks')
        .select('id, title, due_at, priority')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('completed_at', todayStart.toISOString()),

      supabase
        .from('tasks')
        .select('id, title, due_at, priority')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .lt('due_at', now.toISOString()),
    ]);

    const pendingTasks = pendingResult.data ?? [];
    const completedTasks = completedResult.data ?? [];
    const overdueTasks = overdueResult.data ?? [];

    const content = await generateBriefingSummary(
      pendingTasks,
      completedTasks,
      overdueTasks,
      userName
    );

    const tasksSummary = {
      pending: pendingTasks.length,
      completed: completedTasks.length,
      overdue: overdueTasks.length,
    };

    const { data: briefing, error: insertError } = await supabase
      .from('briefings')
      .insert({
        user_id: user.id,
        type,
        content,
        tasks_summary: tasksSummary,
        generated_at: now.toISOString(),
      })
      .select()
      .single();

    if (insertError || !briefing) {
      console.error('Failed to store briefing:', insertError);
      return NextResponse.json(
        { error: 'Failed to store briefing' },
        { status: 500 }
      );
    }

    return NextResponse.json({ briefing }, { status: 201 });
  } catch (error) {
    console.error('POST /api/briefing/generate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
