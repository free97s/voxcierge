'use client'

import { useState, useRef } from 'react'
import { XIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTaskStore } from '@/stores/taskStore'
import type { Task, TaskPriority } from '@/types/task'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface CreateTaskDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: (task: Task) => void
}

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------
interface FormState {
  title: string
  description: string
  priority: TaskPriority
  dueAt: string
  person: string
  place: string
  tagInput: string
  tags: string[]
}

const defaultForm: FormState = {
  title: '',
  description: '',
  priority: 3,
  dueAt: '',
  person: '',
  place: '',
  tagInput: '',
  tags: [],
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function CreateTaskDialog({ isOpen, onClose, onCreated }: CreateTaskDialogProps) {
  const [form, setForm] = useState<FormState>(defaultForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const addTask = useTaskStore((s) => s.addTask)
  const tagInputRef = useRef<HTMLInputElement>(null)

  function handleClose() {
    if (isSubmitting) return
    setForm(defaultForm)
    setErrors({})
    onClose()
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  // Tags: parse comma-separated input on blur / Enter / comma
  function handleTagInput(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commitTagInput()
    }
  }

  function handleTagBlur() {
    commitTagInput()
  }

  function commitTagInput() {
    const raw = form.tagInput.trim().replace(/,$/, '')
    if (!raw) return
    const newTags = raw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const merged = Array.from(new Set([...form.tags, ...newTags]))
    setForm((prev) => ({ ...prev, tags: merged, tagInput: '' }))
  }

  function removeTag(tag: string) {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormState, string>> = {}
    if (!form.title.trim()) newErrors.title = '제목을 입력해 주세요.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const task = await addTask({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        priority: form.priority,
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined,
        person: form.person.trim() || undefined,
        place: form.place.trim() || undefined,
        tags: form.tags,
      })
      onCreated?.(task)
      handleClose()
    } catch (err) {
      setErrors({ title: err instanceof Error ? err.message : '오류가 발생했습니다.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const priorityOptions: { value: TaskPriority; label: string }[] = [
    { value: 1, label: 'P1 — 매우 낮음' },
    { value: 2, label: 'P2 — 낮음' },
    { value: 3, label: 'P3 — 보통' },
    { value: 4, label: 'P4 — 높음' },
    { value: 5, label: 'P5 — 매우 높음' },
  ]

  // Minimum datetime-local is now
  const minDatetime = new Date().toISOString().slice(0, 16)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>새 할 일 추가</DialogTitle>
          <DialogDescription>
            할 일의 세부 정보를 입력하세요.
          </DialogDescription>
        </DialogHeader>

        <form id="create-task-form" onSubmit={handleSubmit} className="space-y-3">
          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="ct-title">
              제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ct-title"
              placeholder="할 일을 입력하세요"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              aria-invalid={!!errors.title}
            />
            <div aria-live="polite" aria-atomic="true">
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="ct-desc">설명</Label>
            <Textarea
              id="ct-desc"
              placeholder="상세 내용을 입력하세요 (선택)"
              rows={2}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          {/* Priority + Due date row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="ct-priority">우선순위</Label>
              <Select
                value={String(form.priority)}
                onValueChange={(v) => set('priority', Number(v) as TaskPriority)}
              >
                <SelectTrigger id="ct-priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map(({ value, label }) => (
                    <SelectItem key={value} value={String(value)}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="ct-due">기한</Label>
              <Input
                id="ct-due"
                type="datetime-local"
                min={minDatetime}
                value={form.dueAt}
                onChange={(e) => set('dueAt', e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Person + Place row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="ct-person">담당자</Label>
              <Input
                id="ct-person"
                placeholder="예: 홍길동"
                value={form.person}
                onChange={(e) => set('person', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ct-place">장소</Label>
              <Input
                id="ct-place"
                placeholder="예: 회의실 A"
                value={form.place}
                onChange={(e) => set('place', e.target.value)}
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <Label htmlFor="ct-tags">태그</Label>
            {/* Existing tags */}
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {form.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    {tag}
                    <button
                      type="button"
                      aria-label={`${tag} 태그 제거`}
                      onClick={() => removeTag(tag)}
                      className="rounded-full hover:bg-foreground/10 p-0.5 transition-colors"
                    >
                      <XIcon className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <Input
              id="ct-tags"
              ref={tagInputRef}
              placeholder="태그 입력 후 Enter 또는 쉼표로 추가"
              value={form.tagInput}
              onChange={(e) => set('tagInput', e.target.value)}
              onKeyDown={handleTagInput}
              onBlur={handleTagBlur}
            />
            <p className="text-[11px] text-muted-foreground">
              쉼표(,) 또는 Enter로 여러 태그를 추가할 수 있습니다.
            </p>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button type="submit" form="create-task-form" disabled={isSubmitting}>
            {isSubmitting ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
