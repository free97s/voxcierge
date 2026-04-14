import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { TaskStatus, TaskPriority } from '@/types/task';

// ---------------------------------------------------------------------------
// GET /api/tasks
// Query params: status?, search?, sort?, page?, limit?
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as TaskStatus | null;
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') ?? 'created_at';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const offset = (page - 1) * limit;

    // Allowed sort columns to prevent injection
    const allowedSortColumns: Record<string, string> = {
      created_at: 'created_at',
      updated_at: 'updated_at',
      due_at: 'due_at',
      priority: 'priority',
      title: 'title',
    };
    const sortColumn = allowedSortColumns[sort] ?? 'created_at';

    let query = supabase
      .from('tasks')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order(sortColumn, { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data: tasks, error, count } = await query;

    if (error) {
      console.error('Failed to fetch tasks:', error);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    return NextResponse.json({
      tasks: tasks ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/tasks
// Body: { title, description?, dueAt?, priority?, person?, place?, tags?, sessionId?, intentId? }
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
      title?: unknown;
      description?: unknown;
      dueAt?: unknown;
      priority?: unknown;
      person?: unknown;
      place?: unknown;
      tags?: unknown;
      sessionId?: unknown;
      intentId?: unknown;
    };

    if (typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const priority: TaskPriority =
      typeof body.priority === 'number' &&
      [1, 2, 3, 4, 5].includes(body.priority)
        ? (body.priority as TaskPriority)
        : 3;

    const { data: task, error: insertError } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        session_id: typeof body.sessionId === 'string' ? body.sessionId : null,
        intent_id: typeof body.intentId === 'string' ? body.intentId : null,
        title: (body.title as string).trim(),
        description:
          typeof body.description === 'string' ? body.description : null,
        status: 'pending',
        priority,
        due_at: typeof body.dueAt === 'string' ? body.dueAt : null,
        person: typeof body.person === 'string' ? body.person : null,
        place: typeof body.place === 'string' ? body.place : null,
        tags: Array.isArray(body.tags) ? body.tags : [],
      })
      .select()
      .single();

    if (insertError || !task) {
      console.error('Failed to create task:', insertError);
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    // Create task_history entry
    await supabase.from('task_history').insert({
      task_id: task.id,
      user_id: user.id,
      action: 'created',
      new_status: 'pending',
      metadata: {},
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('POST /api/tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
