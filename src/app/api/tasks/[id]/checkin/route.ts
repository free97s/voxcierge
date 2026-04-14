import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { CheckinAction, TaskStatus } from '@/types/task';

type RouteContext = { params: Promise<{ id: string }> };

const actionToStatus: Record<CheckinAction, TaskStatus> = {
  completed: 'completed',
  postponed: 'postponed',
  cancelled: 'cancelled',
  ignored: 'pending',
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as {
      action?: unknown;
      postponedUntil?: unknown;
    };

    const validActions: CheckinAction[] = ['completed', 'postponed', 'cancelled'];
    if (
      typeof body.action !== 'string' ||
      !validActions.includes(body.action as CheckinAction)
    ) {
      return NextResponse.json(
        { error: `action must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    const action = body.action as CheckinAction;

    if (action === 'postponed' && typeof body.postponedUntil !== 'string') {
      return NextResponse.json(
        { error: 'postponedUntil is required when action is "postponed"' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const newStatus = actionToStatus[action];
    const now = new Date().toISOString();

    const taskUpdates: Record<string, unknown> = {
      status: newStatus,
      updated_at: now,
    };

    if (action === 'completed') {
      taskUpdates.completed_at = now;
    } else if (action === 'postponed') {
      taskUpdates.postponed_until = body.postponedUntil;
    }

    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update(taskUpdates)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedTask) {
      console.error('Failed to update task during checkin:', updateError);
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    // Update the latest unanswered checkin_event for this task
    const { data: checkinEvent } = await supabase
      .from('checkin_events')
      .select('id')
      .eq('task_id', id)
      .is('responded_at', null)
      .order('sent_at', { ascending: false })
      .limit(1)
      .single();

    if (checkinEvent) {
      await supabase
        .from('checkin_events')
        .update({
          responded_at: now,
          response_action: action,
          postponed_until:
            action === 'postponed' ? body.postponedUntil : null,
        })
        .eq('id', checkinEvent.id);
    }

    // Create task_history entry
    await supabase.from('task_history').insert({
      task_id: id,
      user_id: user.id,
      action: 'checkin_responded',
      previous_status: task.status,
      new_status: newStatus,
      metadata: {
        checkin_action: action,
        postponed_until:
          action === 'postponed' ? body.postponedUntil : null,
      },
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error('POST /api/tasks/[id]/checkin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
