'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  ArrowLeftIcon,
  PencilIcon,
  CheckIcon,
  XIcon,
  CalendarIcon,
  UserIcon,
  MapPinIcon,
  TagIcon,
  TrashIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TaskTimeline } from '@/components/tasks/TaskTimeline'
import { TaskCheckinDialog } from '@/components/tasks/TaskCheckinDialog'
import { useTaskStore } from '@/stores/taskStore'
import { cn } from '@/lib/utils'
import type { Task, TaskHistory, TaskHistoryAction, TaskStatus, TaskPriority } from '@/types/task'

// ---------------------------------------------------------------------------
// DB row → TaskHistory mapper (API returns snake_case from Supabase)
// ---------------------------------------------------------------------------
interface DbHistoryRow {
  id: string
  task_id: string
  user_id: string
  action: TaskHistoryAction
  previous_status?: TaskStatus | null
  new_status?: TaskStatus | null
  metadata: Record<string, unknown>
  created_at: string
}

function dbRowToHistory(row: DbHistoryRow): TaskHistory {
  return {
    id: row.id,
    taskId: row.task_id,
    userId: row.user_id,
    action: row.action,
    previousStatus: row.previous_status ?? undefined,
    newStatus: row.new_status ?? undefined,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  }
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------
const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  pending:     { label: '대기중',  className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  in_progress: { label: '진행중',  className: 'bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-400'   },
  completed:   { label: '완료',    className: 'bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400'  },
  postponed:   { label: '연기됨',  className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  cancelled:   { label: '취소됨',  className: 'bg-gray-100   text-gray-600   dark:bg-gray-800/50   dark:text-gray-400'   },
}

const priorityConfig: Record<TaskPriority, { label: string }> = {
  1: { label: 'P1 — 매우 낮음' },
  2: { label: 'P2 — 낮음' },
  3: { label: 'P3 — 보통' },
  4: { label: 'P4 — 높음' },
  5: { label: 'P5 — 매우 높음' },
}

// ---------------------------------------------------------------------------
// Editable field wrapper
// ---------------------------------------------------------------------------
function EditableField({
  label,
  icon: Icon,
  value,
  editValue,
  isEditing,
  children,
}: {
  label: string
  icon?: React.ElementType
  value: React.ReactNode
  editValue?: React.ReactNode
  isEditing: boolean
  children?: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </Label>
      {isEditing ? (editValue ?? children) : <div className="text-sm min-h-[1.5rem]">{value || <span className="text-muted-foreground">—</span>}</div>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
interface PageProps {
  params: Promise<{ id: string }>
}

export default function TaskDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const updateTask = useTaskStore((s) => s.updateTask)
  const deleteTask = useTaskStore((s) => s.deleteTask)

  const [task, setTask] = useState<Task | null>(null)
  const [history, setHistory] = useState<TaskHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Edit mode
  const [isEditing, setIsEditing] = useState(false)
  const [editFields, setEditFields] = useState<Partial<Task>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Checkin dialog
  const [checkinOpen, setCheckinOpen] = useState(false)

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------
  async function fetchTask() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/tasks/${id}`)
      if (res.status === 404) { setNotFound(true); return }
      if (!res.ok) throw new Error('Failed to fetch')
      // API returns raw Supabase rows (snake_case) for both task and history
      const data = await res.json() as { task: Record<string, unknown>; history: DbHistoryRow[] }

      // Map task (snake_case DB row → camelCase Task)
      const raw = data.task
      const mapped: Task = {
        id: raw.id as string,
        userId: raw.user_id as string,
        orgId: raw.org_id as string | undefined,
        sessionId: raw.session_id as string | undefined,
        intentId: raw.intent_id as string | undefined,
        title: raw.title as string,
        description: (raw.description as string | null) ?? undefined,
        status: raw.status as TaskStatus,
        priority: raw.priority as TaskPriority,
        dueAt: (raw.due_at as string | null) ?? undefined,
        completedAt: (raw.completed_at as string | null) ?? undefined,
        postponedUntil: (raw.postponed_until as string | null) ?? undefined,
        person: (raw.person as string | null) ?? undefined,
        place: (raw.place as string | null) ?? undefined,
        tags: (raw.tags as string[]) ?? [],
        createdAt: raw.created_at as string,
        updatedAt: raw.updated_at as string,
      }

      setTask(mapped)
      setHistory((data.history ?? []).map(dbRowToHistory))
    } catch {
      setNotFound(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchTask() }, [id])

  // ---------------------------------------------------------------------------
  // Edit
  // ---------------------------------------------------------------------------
  function startEdit() {
    if (!task) return
    setEditFields({
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      dueAt: task.dueAt ?? '',
      person: task.person ?? '',
      place: task.place ?? '',
      tags: [...task.tags],
    })
    setIsEditing(true)
    setSaveError(null)
  }

  function cancelEdit() {
    setIsEditing(false)
    setEditFields({})
    setSaveError(null)
  }

  function setField<K extends keyof Task>(key: K, value: Task[K]) {
    setEditFields((prev) => ({ ...prev, [key]: value }))
  }

  async function saveEdit() {
    if (!task) return
    setIsSaving(true)
    setSaveError(null)
    try {
      const payload: Partial<Task> = {}
      if (editFields.title !== undefined) payload.title = String(editFields.title).trim()
      if (editFields.description !== undefined) payload.description = String(editFields.description).trim() || undefined
      if (editFields.priority !== undefined) payload.priority = editFields.priority
      if (editFields.dueAt !== undefined) payload.dueAt = editFields.dueAt ? new Date(editFields.dueAt as string).toISOString() : undefined
      if (editFields.person !== undefined) payload.person = String(editFields.person).trim() || undefined
      if (editFields.place !== undefined) payload.place = String(editFields.place).trim() || undefined
      if (editFields.tags !== undefined) payload.tags = editFields.tags

      await updateTask(task.id, payload)
      setIsEditing(false)
      await fetchTask() // refresh task + history with proper mapping
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Status change
  // ---------------------------------------------------------------------------
  async function handleStatusChange(newStatus: TaskStatus) {
    if (!task) return
    try {
      await updateTask(task.id, { status: newStatus })
      await fetchTask()
    } catch {
      // silent
    }
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------
  async function handleDelete() {
    if (!task) return
    setIsDeleting(true)
    try {
      await deleteTask(task.id)
      router.push('/tasks')
    } catch {
      setIsDeleting(false)
      setDeleteConfirm(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Tag helpers in edit mode
  // ---------------------------------------------------------------------------
  function removeEditTag(tag: string) {
    setEditFields((prev) => ({
      ...prev,
      tags: (prev.tags ?? []).filter((t) => t !== tag),
    }))
  }

  function handleEditTagInput(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const target = e.target as HTMLInputElement
      const val = target.value.trim().replace(/,$/, '')
      if (!val) return
      const newTags = val.split(',').map((t) => t.trim()).filter(Boolean)
      setEditFields((prev) => ({
        ...prev,
        tags: Array.from(new Set([...(prev.tags ?? []), ...newTags])),
      }))
      target.value = ''
    }
  }

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (notFound || !task) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
        <p className="text-muted-foreground text-sm">할 일을 찾을 수 없습니다.</p>
        <Button variant="outline" onClick={() => router.push('/tasks')}>
          <ArrowLeftIcon className="h-4 w-4" />
          목록으로
        </Button>
      </div>
    )
  }

  const statusInfo = statusConfig[task.status]
  const isCompleted = task.status === 'completed' || task.status === 'cancelled'
  const editTagsArray = (editFields.tags ?? task.tags) as string[]
  const editDueAt = (editFields.dueAt as string | undefined) ?? (task.dueAt ? task.dueAt.slice(0, 16) : '')

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-5 pb-16">
      {/* Back + actions row */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" onClick={() => router.push('/tasks')} aria-label="뒤로 가기">
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground flex-1">할 일 상세</span>

        <div className="flex items-center gap-1">
          {!isEditing ? (
            <>
              {!isCompleted && (
                <Button variant="ghost" size="sm" onClick={() => setCheckinOpen(true)}>
                  체크인
                </Button>
              )}
              <Button variant="ghost" size="icon-sm" onClick={startEdit} aria-label="편집">
                <PencilIcon className="h-4 w-4" />
              </Button>
              {!deleteConfirm ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteConfirm(true)}
                  aria-label="삭제"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-destructive">삭제할까요?</span>
                  <Button
                    variant="destructive"
                    size="xs"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? '삭제 중...' : '삭제'}
                  </Button>
                  <Button variant="ghost" size="xs" onClick={() => setDeleteConfirm(false)}>
                    취소
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon-sm" onClick={cancelEdit} aria-label="취소">
                <XIcon className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={saveEdit} disabled={isSaving}>
                <CheckIcon className="h-4 w-4" />
                {isSaving ? '저장 중...' : '저장'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Title */}
      {isEditing ? (
        <div className="space-y-1">
          <Label htmlFor="detail-title">제목 <span className="text-destructive">*</span></Label>
          <Input
            id="detail-title"
            value={String(editFields.title ?? task.title)}
            onChange={(e) => setField('title', e.target.value)}
            className="text-lg font-semibold h-10"
          />
        </div>
      ) : (
        <h1 className={cn('text-xl font-bold leading-snug', isCompleted && 'line-through text-muted-foreground')}>
          {task.title}
        </h1>
      )}

      {/* Status + Priority badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium', statusInfo.className)}>
          {statusInfo.label}
        </span>
        <span className="text-xs text-muted-foreground">
          우선순위: {priorityConfig[task.priority].label}
        </span>
        {task.completedAt && (
          <span className="text-xs text-muted-foreground">
            완료: {format(new Date(task.completedAt), 'M월 d일 HH:mm', { locale: ko })}
          </span>
        )}
      </div>

      <Separator />

      {/* Fields grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Description */}
        <div className="sm:col-span-2 space-y-1">
          <EditableField
            label="설명"
            isEditing={isEditing}
            value={task.description || '—'}
            editValue={
              <Textarea
                value={String(editFields.description ?? task.description ?? '')}
                onChange={(e) => setField('description', e.target.value)}
                rows={3}
                placeholder="설명을 입력하세요"
              />
            }
          />
        </div>

        {/* Priority */}
        <EditableField
          label="우선순위"
          isEditing={isEditing}
          value={priorityConfig[task.priority].label}
          editValue={
            <Select
              value={String(editFields.priority ?? task.priority)}
              onValueChange={(v) => setField('priority', Number(v) as TaskPriority)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {([1, 2, 3, 4, 5] as TaskPriority[]).map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    {priorityConfig[p].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />

        {/* Due date */}
        <EditableField
          label="기한"
          icon={CalendarIcon}
          isEditing={isEditing}
          value={task.dueAt ? format(new Date(task.dueAt), 'yyyy년 M월 d일 HH:mm', { locale: ko }) : '—'}
          editValue={
            <Input
              type="datetime-local"
              value={editDueAt}
              onChange={(e) => setField('dueAt', e.target.value as unknown as string)}
            />
          }
        />

        {/* Person */}
        <EditableField
          label="담당자"
          icon={UserIcon}
          isEditing={isEditing}
          value={task.person || '—'}
          editValue={
            <Input
              value={String(editFields.person ?? task.person ?? '')}
              onChange={(e) => setField('person', e.target.value)}
              placeholder="예: 홍길동"
            />
          }
        />

        {/* Place */}
        <EditableField
          label="장소"
          icon={MapPinIcon}
          isEditing={isEditing}
          value={task.place || '—'}
          editValue={
            <Input
              value={String(editFields.place ?? task.place ?? '')}
              onChange={(e) => setField('place', e.target.value)}
              placeholder="예: 회의실 A"
            />
          }
        />

        {/* Tags */}
        <div className="sm:col-span-2 space-y-1">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <TagIcon className="h-3 w-3" />
            태그
          </Label>
          {isEditing ? (
            <div className="space-y-1.5">
              {editTagsArray.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {editTagsArray.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeEditTag(tag)}
                        className="rounded-full hover:bg-foreground/10 p-0.5"
                      >
                        <XIcon className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <Input
                placeholder="태그 입력 후 Enter"
                onKeyDown={handleEditTagInput}
              />
            </div>
          ) : (
            <div className="flex flex-wrap gap-1 min-h-[1.5rem]">
              {task.tags.length > 0
                ? task.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))
                : <span className="text-sm text-muted-foreground">—</span>
              }
            </div>
          )}
        </div>
      </div>

      {/* Save error */}
      {saveError && (
        <p className="text-xs text-destructive">{saveError}</p>
      )}

      {/* Status change buttons */}
      {!isEditing && !isCompleted && (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">상태 변경</p>
            <div className="flex flex-wrap gap-2">
              {task.status !== 'in_progress' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('in_progress')}
                >
                  진행 중으로 변경
                </Button>
              )}
              {task.status !== 'pending' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('pending')}
                >
                  대기 중으로 변경
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-green-700 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-900 dark:hover:bg-green-900/20"
                onClick={() => handleStatusChange('completed')}
              >
                완료 처리
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-gray-600 hover:text-gray-700"
                onClick={() => handleStatusChange('cancelled')}
              >
                취소 처리
              </Button>
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Metadata */}
      <div className="text-xs text-muted-foreground space-y-0.5">
        <p>생성: {format(new Date(task.createdAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}</p>
        <p>수정: {format(new Date(task.updatedAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}</p>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">활동 기록</h2>
        <TaskTimeline history={history} />
      </div>

      {/* Checkin Dialog */}
      <TaskCheckinDialog
        task={task}
        isOpen={checkinOpen}
        onClose={() => setCheckinOpen(false)}
        onSuccess={(updated) => {
          setTask(updated)
          setCheckinOpen(false)
          fetchTask()
        }}
      />
    </div>
  )
}
