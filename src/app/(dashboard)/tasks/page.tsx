'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { MicIcon, PlusIcon, SearchIcon } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskCheckinDialog } from '@/components/tasks/TaskCheckinDialog'
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog'
import { useTaskStore } from '@/stores/taskStore'
import { useRealtimeTasks } from '@/hooks/useRealtimeTasks'
import { createClient } from '@/lib/supabase/client'
import type { Task, TaskStatus } from '@/types/task'

// ---------------------------------------------------------------------------
// Tab config
// ---------------------------------------------------------------------------
type TabKey = 'all' | 'active' | 'completed' | 'postponed'

const tabs: { key: TabKey; label: string; statuses: TaskStatus[] | null }[] = [
  { key: 'all',       label: '전체',   statuses: null },
  { key: 'active',    label: '진행중', statuses: ['pending', 'in_progress'] },
  { key: 'completed', label: '완료',   statuses: ['completed'] },
  { key: 'postponed', label: '연기',   statuses: ['postponed'] },
]

// ---------------------------------------------------------------------------
// Overdue tasks: pending/in_progress with dueAt in the past
// ---------------------------------------------------------------------------
function getOverdueTasks(tasks: Task[]): Task[] {
  const now = new Date()
  return tasks.filter(
    (t) =>
      (t.status === 'pending' || t.status === 'in_progress') &&
      t.dueAt &&
      new Date(t.dueAt) < now
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function TasksPage() {
  const { tasks, isLoading, fetchTasks } = useTaskStore()
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [search, setSearch] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [checkinTask, setCheckinTask] = useState<Task | null>(null)

  // Fetch user for realtime subscription
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser()
      .then(({ data }: { data: { user: { id: string } | null } }) => {
        setUserId(data.user?.id ?? null)
      })
      .catch(() => { /* no user — stay null */ })
  }, [])

  // Fetch tasks on mount
  useEffect(() => {
    fetchTasks({ limit: 100 }).catch(() => { /* API unavailable — store stays empty */ })
  }, [fetchTasks])

  // Realtime subscription
  useRealtimeTasks(userId)

  // Filter by tab
  const tabConfig = tabs.find((t) => t.key === activeTab)!
  const filtered = useMemo(() => {
    let list = tasks

    // Tab filter
    if (tabConfig.statuses) {
      list = list.filter((t) => tabConfig.statuses!.includes(t.status))
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.person?.toLowerCase().includes(q) ||
          t.place?.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    }

    return list
  }, [tasks, tabConfig, search])

  // Count per tab
  const counts = useMemo(() => {
    const result: Record<TabKey, number> = { all: 0, active: 0, completed: 0, postponed: 0 }
    for (const t of tasks) {
      result.all++
      if (t.status === 'pending' || t.status === 'in_progress') result.active++
      if (t.status === 'completed') result.completed++
      if (t.status === 'postponed') result.postponed++
    }
    return result
  }, [tasks])

  // Overdue banner
  const overdueCount = useMemo(() => getOverdueTasks(tasks).length, [tasks])
  const firstOverdue = useMemo(() => getOverdueTasks(tasks)[0] ?? null, [tasks])

  const emptyMessages: Record<TabKey, string> = {
    all:       '할 일이 없습니다. 새 할 일을 추가해 보세요!',
    active:    '진행 중인 할 일이 없습니다.',
    completed: '완료된 할 일이 없습니다.',
    postponed: '연기된 할 일이 없습니다.',
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">할 일 목록</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            총 {tasks.length}개
          </Badge>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            추가
          </Button>
        </div>
      </div>

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10 px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-red-700 dark:text-red-400">
            기한이 지난 할 일이 <strong>{overdueCount}개</strong> 있습니다.
          </p>
          {firstOverdue && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setCheckinTask(firstOverdue)}
            >
              체크인
            </Button>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="할 일 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
        <TabsList className="w-full">
          {tabs.map(({ key, label }) => (
            <TabsTrigger key={key} value={key} className="flex-1 gap-1.5">
              {label}
              {counts[key] > 0 && (
                <span className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-foreground/10 px-1 text-[10px] font-medium">
                  {counts[key]}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(({ key }) => (
          <TabsContent key={key} value={key} className="mt-4">
            <TaskList
              tasks={filtered}
              isLoading={isLoading}
              emptyMessage={emptyMessages[key]}
              onCheckin={(task) => setCheckinTask(task)}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Floating mic button */}
      <Link
        href="/capture"
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
        aria-label="음성으로 할 일 추가"
      >
        <MicIcon className="h-6 w-6" />
      </Link>

      {/* Dialogs */}
      <CreateTaskDialog
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => fetchTasks({ limit: 100 })}
      />

      <TaskCheckinDialog
        task={checkinTask}
        isOpen={checkinTask !== null}
        onClose={() => setCheckinTask(null)}
        onSuccess={() => fetchTasks({ limit: 100 })}
      />
    </div>
  )
}
