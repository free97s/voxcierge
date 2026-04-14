'use client'

import { useState } from 'react'
import { Check, Pencil, Trash2, X, Loader2, Tag, User, MapPin, Clock, Zap } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ExtractedIntent } from '@/types/ai'
import { cn } from '@/lib/utils'

interface IntentCardProps {
  intent: ExtractedIntent
  onConfirm: (editedIntent: ExtractedIntent) => void
  onEdit?: (editedIntent: ExtractedIntent) => void
  onDiscard: () => void
  isLoading?: boolean
}

const intentTypeLabels: Record<string, string> = {
  task: '할 일',
  note: '메모',
  reminder: '리마인더',
  query: '질문',
  unknown: '기타',
}

const confidenceLabel = (score: number) => {
  if (score >= 0.85) return { label: '높음', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' }
  if (score >= 0.6) return { label: '보통', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' }
  return { label: '낮음', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
}

export function IntentCard({ intent, onConfirm, onDiscard, isLoading = false }: IntentCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [edited, setEdited] = useState<ExtractedIntent>(intent)

  const conf = confidenceLabel(edited.confidence)

  function handleConfirm() {
    onConfirm(edited)
  }

  function handleEdit() {
    setIsEditing(true)
  }

  function handleCancelEdit() {
    setEdited(intent)
    setIsEditing(false)
  }

  function handleSaveEdit() {
    setIsEditing(false)
  }

  function removeTag(tag: string) {
    setEdited((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))
  }

  function addTag(tag: string) {
    const trimmed = tag.trim()
    if (trimmed && !edited.tags.includes(trimmed)) {
      setEdited((prev) => ({ ...prev, tags: [...prev.tags, trimmed] }))
    }
  }

  return (
    <Card className="w-full border-primary/20 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold">AI 분석 결과</CardTitle>
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="text-xs">
              {intentTypeLabels[edited.intentType] ?? '기타'}
            </Badge>
            <Badge className={cn('text-xs border-0', conf.className)}>
              신뢰도 {conf.label} ({Math.round(edited.confidence * 100)}%)
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-4">
        {/* Action (title) */}
        <div className="flex items-start gap-2">
          <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground mb-0.5">할 일</p>
            {isEditing ? (
              <Input
                value={edited.action}
                onChange={(e) => setEdited((prev) => ({ ...prev, action: e.target.value }))}
                className="h-8 text-sm"
                placeholder="할 일 내용"
              />
            ) : (
              <p className="text-sm font-medium">{edited.action || '—'}</p>
            )}
          </div>
        </div>

        {/* Person */}
        {(edited.person || isEditing) && (
          <div className="flex items-start gap-2">
            <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-0.5">관련 인물</p>
              {isEditing ? (
                <Input
                  value={edited.person ?? ''}
                  onChange={(e) => setEdited((prev) => ({ ...prev, person: e.target.value || undefined }))}
                  className="h-8 text-sm"
                  placeholder="인물 이름"
                />
              ) : (
                <p className="text-sm">{edited.person ?? '—'}</p>
              )}
            </div>
          </div>
        )}

        {/* Place */}
        {(edited.place || isEditing) && (
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-0.5">장소</p>
              {isEditing ? (
                <Input
                  value={edited.place ?? ''}
                  onChange={(e) => setEdited((prev) => ({ ...prev, place: e.target.value || undefined }))}
                  className="h-8 text-sm"
                  placeholder="장소"
                />
              ) : (
                <p className="text-sm">{edited.place ?? '—'}</p>
              )}
            </div>
          </div>
        )}

        {/* Time */}
        {(edited.timeRaw || edited.timeAbsolute || isEditing) && (
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-0.5">시간</p>
              {isEditing ? (
                <Input
                  value={edited.timeRaw ?? ''}
                  onChange={(e) => setEdited((prev) => ({ ...prev, timeRaw: e.target.value || undefined }))}
                  className="h-8 text-sm"
                  placeholder="시간 표현 (예: 오늘 오후 3시)"
                />
              ) : (
                <div>
                  {edited.timeRaw && <p className="text-sm">{edited.timeRaw}</p>}
                  {edited.timeAbsolute && (
                    <p className="text-xs text-muted-foreground mt-0.5">{edited.timeAbsolute}</p>
                  )}
                  {!edited.timeRaw && !edited.timeAbsolute && <p className="text-sm">—</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {(edited.tags.length > 0 || isEditing) && (
          <div className="flex items-start gap-2">
            <Tag className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">태그</p>
              <div className="flex flex-wrap gap-1.5">
                {edited.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs gap-1 pr-1">
                    {tag}
                    {isEditing && (
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                        aria-label={`태그 "${tag}" 삭제`}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </Badge>
                ))}
                {isEditing && (
                  <Input
                    className="h-6 w-24 text-xs px-2"
                    placeholder="태그 추가..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault()
                        addTag(e.currentTarget.value)
                        e.currentTarget.value = ''
                      }
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2 pt-0 flex-wrap">
        {isEditing ? (
          <>
            <Button size="sm" variant="default" onClick={handleSaveEdit} className="flex-1">
              <Check className="h-4 w-4 mr-1" />
              수정 완료
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="flex-1">
              <X className="h-4 w-4 mr-1" />
              취소
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="default"
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              {isLoading ? '저장 중...' : '할 일 저장'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleEdit}
              disabled={isLoading}
            >
              <Pencil className="h-4 w-4 mr-1" />
              수정
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDiscard}
              disabled={isLoading}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              취소
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
