import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateInsights } from '@/lib/ai/insights';
import type { Task } from '@/types/task';

// Insights are considered stale after 24 hours
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  // Suppress unused-variable warning for request while keeping the signature
  void request;

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: insight, error } = await supabase
      .from('insights')
      .select('*')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch insights:', error);
      return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 });
    }

    if (!insight) {
      return NextResponse.json({ insight: null, needsGeneration: true });
    }

    const generatedAt = new Date(insight.generated_at).getTime();
    const isStale = Date.now() - generatedAt > STALE_THRESHOLD_MS;

    return NextResponse.json({ insight, needsGeneration: isStale });
  } catch (error) {
    console.error('GET /api/insights error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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

    const body = await request.json().catch(() => ({})) as { action?: string };
    if (body.action !== 'generate') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Fetch tasks for the last 30 days
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd);
    periodStart.setDate(periodEnd.getDate() - 30);

    const { data: rawTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', periodStart.toISOString())
      .order('created_at', { ascending: true });

    if (tasksError) {
      console.error('Failed to fetch tasks for insights:', tasksError);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    const tasks = (rawTasks ?? []).map((row) => ({
      id: row.id as string,
      userId: row.user_id as string,
      title: row.title as string,
      description: row.description as string | undefined,
      status: row.status as Task['status'],
      priority: row.priority as Task['priority'],
      dueAt: row.due_at as string | undefined,
      completedAt: row.completed_at as string | undefined,
      postponedUntil: row.postponed_until as string | undefined,
      person: row.person as string | undefined,
      place: row.place as string | undefined,
      tags: (row.tags ?? []) as string[],
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    })) as Task[];

    const insightData = await generateInsights(user.id, tasks, {
      start: periodStart,
      end: periodEnd,
    });

    const { data: insight, error: insertError } = await supabase
      .from('insights')
      .insert({
        user_id: insightData.userId,
        period_start: insightData.periodStart,
        period_end: insightData.periodEnd,
        productive_days: insightData.productiveDays,
        productive_times: insightData.productiveTimes,
        task_categories: insightData.taskCategories,
        completion_rate: insightData.completionRate,
        recommendations: insightData.recommendations,
        model_used: insightData.modelUsed,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !insight) {
      console.error('Failed to store insight:', insertError);
      return NextResponse.json({ error: 'Failed to store insight' }, { status: 500 });
    }

    return NextResponse.json({ insight }, { status: 201 });
  } catch (error) {
    console.error('POST /api/insights error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
