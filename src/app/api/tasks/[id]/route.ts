import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { TaskStatus, TaskPriority } from '@/types/task';

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/tasks/[id]  — single task with its history
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest, context: RouteContext) {
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

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const { data: history } = await supabase
      .from('task_history')
      .select('*')
      .eq('task_id', id)
      .order('created_at', { ascending: false });

    return NextResponse.json({ task, history: history ?? [] });
  } catch (error) {
    console.error('GET /api/tasks/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/tasks/[id]  — update task fields
// ---------------------------------------------------------------------------
export async function PATCH(request: NextRequest, context: RouteContext) {
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

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('tasks')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const body = await request.json() as {
      title?: unknown;
      description?: unknown;
      status?: unknown;
      priority?: unknown;
      dueAt?: unknown;
      completedAt?: unknown;
      postponedUntil?: unknown;
      person?: unknown;
      place?: unknown;
      tags?: unknown;
    };

    // Build update payload — only include fields that were explicitly provided
    const updates: Record<string, unknown> = {};
    if (typeof body.title === 'string') updates.title = body.title.trim();
    if ('description' in body) updates.description = body.description ?? null;
    if (typeof body.status === 'string') updates.status = body.status as TaskStatus;
    if (typeof body.priority === 'number') updates.priority = body.priority as TaskPriority;
    if ('dueAt' in body) updates.due_at = body.dueAt ?? null;
    if ('completedAt' in body) updates.completed_at = body.completedAt ?? null;
    if ('postponedUntil' in body) updates.postponed_until = body.postponedUntil ?? null;
    if ('person' in body) updates.person = body.person ?? null;
    if ('place' in body) updates.place = body.place ?? null;
    if (Array.isArray(body.tags)) updates.tags = body.tags;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data: task, error: updateError } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !task) {
      console.error('Failed to update task:', updateError);
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    // Create history entry
    const historyEntry: Record<string, unknown> = {
      task_id: id,
      user_id: user.id,
      action: 'updated',
      metadata: updates,
    };

    if (typeof updates.status === 'string') {
      historyEntry.previous_status = existing.status;
      historyEntry.new_status = updates.status;
    }

    await supabase.from('task_history').insert(historyEntry);

    return NextResponse.json({ task });
  } catch (error) {
    console.error('PATCH /api/tasks/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/tasks/[id]
// ---------------------------------------------------------------------------
export async function DELETE(request: NextRequest, context: RouteContext) {
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

    // Verify ownership before deleting
    const { data: existing, error: fetchError } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Failed to delete task:', deleteError);
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/tasks/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
