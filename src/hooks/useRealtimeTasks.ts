'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTaskStore } from '@/stores/taskStore';
import type { Task } from '@/types/task';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Subscribes to Supabase Realtime postgres_changes on the tasks table,
 * scoped to the current user. Syncs changes into the Zustand task store.
 *
 * Call this hook once in a top-level client layout or page component.
 */
export function useRealtimeTasks(userId: string | null | undefined) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  const addTaskToStore = useTaskStore((s) => s._addTaskToStore);
  const updateTaskInStore = useTaskStore((s) => s._updateTaskInStore);
  const removeTaskFromStore = useTaskStore((s) => s._removeTaskFromStore);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`tasks:user_id=eq.${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const task = dbRowToTask(payload.new as DbTaskRow);
          addTaskToStore(task);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const task = dbRowToTask(payload.new as DbTaskRow);
          updateTaskInStore(task);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const id = (payload.old as { id?: string }).id;
          if (id) removeTaskFromStore(id);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, addTaskToStore, updateTaskInStore, removeTaskFromStore]);
}

// ---------------------------------------------------------------------------
// Utility: map snake_case DB row to camelCase Task interface
// ---------------------------------------------------------------------------
interface DbTaskRow {
  id: string;
  user_id: string;
  org_id?: string | null;
  session_id?: string | null;
  intent_id?: string | null;
  title: string;
  description?: string | null;
  status: Task['status'];
  priority: Task['priority'];
  due_at?: string | null;
  completed_at?: string | null;
  postponed_until?: string | null;
  person?: string | null;
  place?: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

function dbRowToTask(row: DbTaskRow): Task {
  return {
    id: row.id,
    userId: row.user_id,
    orgId: row.org_id ?? undefined,
    sessionId: row.session_id ?? undefined,
    intentId: row.intent_id ?? undefined,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status,
    priority: row.priority,
    dueAt: row.due_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    postponedUntil: row.postponed_until ?? undefined,
    person: row.person ?? undefined,
    place: row.place ?? undefined,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
