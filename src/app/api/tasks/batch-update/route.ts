import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { TaskStatus } from '@/types/task';

// ---------------------------------------------------------------------------
// POST /api/tasks/batch-update
// Body: { taskIds: string[], action: 'complete' | 'postpone' | 'cancel', postponeDate?: string }
// ---------------------------------------------------------------------------
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

    const body = await request.json() as {
      taskIds?: unknown;
      action?: unknown;
      postponeDate?: unknown;
    };

    if (!Array.isArray(body.taskIds) || body.taskIds.length === 0) {
      return NextResponse.json({ error: 'taskIds must be a non-empty array' }, { status: 400 });
    }

    const taskIds = body.taskIds.filter((id): id is string => typeof id === 'string');
    if (taskIds.length === 0) {
      return NextResponse.json({ error: 'taskIds must contain valid string IDs' }, { status: 400 });
    }

    const validActions = ['complete', 'postpone', 'cancel'] as const;
    type BatchAction = typeof validActions[number];

    if (typeof body.action !== 'string' || !validActions.includes(body.action as BatchAction)) {
      return NextResponse.json(
        { error: `action must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    const action = body.action as BatchAction;

    if (action === 'postpone') {
      if (typeof body.postponeDate !== 'string' || !body.postponeDate) {
        return NextResponse.json({ error: 'postponeDate is required for postpone action' }, { status: 400 });
      }
      const parsed = new Date(body.postponeDate);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'postponeDate is not a valid date' }, { status: 400 });
      }
    }

    // Map action to DB fields
    const statusMap: Record<BatchAction, TaskStatus> = {
      complete: 'completed',
      postpone: 'postponed',
      cancel: 'cancelled',
    };

    const newStatus = statusMap[action];
    const updates: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (action === 'complete') {
      updates.completed_at = new Date().toISOString();
    }

    if (action === 'postpone' && typeof body.postponeDate === 'string') {
      updates.postponed_until = new Date(body.postponeDate).toISOString();
    }

    // Verify ownership of all tasks (only update tasks belonging to this user)
    const { data: updatedTasks, error: updateError } = await supabase
      .from('tasks')
      .update(updates)
      .eq('user_id', user.id)
      .in('id', taskIds)
      .in('status', ['pending', 'in_progress'])
      .select();

    if (updateError) {
      console.error('batch-update error:', updateError);
      return NextResponse.json({ error: 'Failed to update tasks' }, { status: 500 });
    }

    // Write history entries for each updated task
    if (updatedTasks && updatedTasks.length > 0) {
      const historyEntries = updatedTasks.map((task: { id: string; status: TaskStatus }) => ({
        task_id: task.id,
        user_id: user.id,
        action: action === 'complete' ? 'completed' : action === 'postpone' ? 'postponed' : 'cancelled',
        new_status: newStatus,
        metadata: action === 'postpone' ? { postponeDate: body.postponeDate } : {},
      }));

      await supabase.from('task_history').insert(historyEntries);
    }

    return NextResponse.json({
      updated: updatedTasks?.length ?? 0,
      tasks: updatedTasks ?? [],
    });
  } catch (error) {
    console.error('POST /api/tasks/batch-update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
