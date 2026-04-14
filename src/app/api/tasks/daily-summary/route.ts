import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// GET /api/tasks/daily-summary
// Returns today's task statistics and pending task lists for check-in.
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayStart);
    yesterdayEnd.setMilliseconds(yesterdayEnd.getMilliseconds() - 1);

    // Tasks completed today
    const { data: completedToday, error: completedError } = await supabase
      .from('tasks')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('completed_at', todayStart.toISOString())
      .lte('completed_at', todayEnd.toISOString());

    if (completedError) {
      console.error('daily-summary completed query error:', completedError);
    }

    // Tasks added today
    const { data: addedToday, error: addedError } = await supabase
      .from('tasks')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString());

    if (addedError) {
      console.error('daily-summary added query error:', addedError);
    }

    // Still-pending tasks with due_at today or earlier (overdue + today)
    const { data: pendingDueTodayOrOverdue, error: pendingError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['pending', 'in_progress'])
      .lte('due_at', todayEnd.toISOString())
      .order('due_at', { ascending: true });

    if (pendingError) {
      console.error('daily-summary pending query error:', pendingError);
    }

    // Yesterday's uncompleted tasks (no due_at filter — any that are still pending and created yesterday)
    const { data: yesterdayPending, error: yestError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['pending', 'in_progress'])
      .gte('created_at', yesterdayStart.toISOString())
      .lte('created_at', yesterdayEnd.toISOString())
      .order('created_at', { ascending: true });

    if (yestError) {
      console.error('daily-summary yesterday query error:', yestError);
    }

    // All pending tasks (for wrapup total)
    const { count: totalPending } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('status', ['pending', 'in_progress']);

    return NextResponse.json({
      stats: {
        completed: completedToday?.length ?? 0,
        pending: totalPending ?? 0,
        added: addedToday?.length ?? 0,
      },
      pendingDueTodayOrOverdue: pendingDueTodayOrOverdue ?? [],
      yesterdayPending: yesterdayPending ?? [],
    });
  } catch (error) {
    console.error('GET /api/tasks/daily-summary error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
