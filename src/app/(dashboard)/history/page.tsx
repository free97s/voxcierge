'use client'

import { useState, useEffect, useCallback } from 'react'
import { Mic, Clock, ChevronDown, ChevronUp, Trash2, Loader2, AlertCircle, FileText } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SessionStatus = 'pending' | 'processing' | 'completed' | 'failed'

interface VoiceSession {
  id: string
  created_at: string
  duration_seconds: number | null
  transcript: string | null
  status: SessionStatus
  task_count: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10

function formatDuration(seconds: number | null): string {
  if (!seconds) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const STATUS_CONFIG: Record<
  SessionStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  completed: { label: '완료', variant: 'default' },
  processing: { label: '처리 중', variant: 'secondary' },
  pending: { label: '대기 중', variant: 'outline' },
  failed: { label: '실패', variant: 'destructive' },
}

// ---------------------------------------------------------------------------
// Session card component
// ---------------------------------------------------------------------------

function SessionCard({
  session,
  onDelete,
}: {
  session: VoiceSession
  onDelete: (id: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const statusConfig = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.pending
  const previewText = session.transcript?.slice(0, 100)
  const hasFullText = (session.transcript?.length ?? 0) > 100

  const handleDelete = async () => {
    setIsDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('voice_sessions').delete().eq('id', session.id)
    if (error) {
      console.error('[HistoryPage] delete error:', error.message)
      setIsDeleting(false)
      setShowDeleteDialog(false)
      return
    }
    onDelete(session.id)
  }

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
              <Clock className="h-3 w-3 shrink-0" />
              <span className="truncate">{formatDate(session.created_at)}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant="secondary" className="text-xs">
                {formatDuration(session.duration_seconds)}
              </Badge>
              {session.task_count > 0 && (
                <Badge variant="outline" className="text-xs">
                  할일 {session.task_count}개
                </Badge>
              )}
              <Badge variant={statusConfig.variant} className="text-xs">
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          {session.transcript ? (
            <>
              <div className="flex items-start gap-2">
                <Mic className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isExpanded ? session.transcript : (previewText ?? '')}
                  {!isExpanded && hasFullText && '…'}
                </p>
              </div>
              {hasFullText && (
                <button
                  type="button"
                  onClick={() => setIsExpanded((v) => !v)}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5" />
                      접기
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5" />
                      전체 보기
                    </>
                  )}
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              <span>
                {session.status === 'processing'
                  ? '음성을 텍스트로 변환하는 중…'
                  : '스크립트가 없습니다'}
              </span>
            </div>
          )}

          <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-muted-foreground hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              삭제
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>음성 기록 삭제</DialogTitle>
            <DialogDescription>
              이 음성 기록을 삭제하시겠습니까? 관련된 할일은 유지되지만 음성 기록과 스크립트는
              영구적으로 삭제됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={
              <Button variant="outline" disabled={isDeleting}>취소</Button>
            } />
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function HistoryPage() {
  const [sessions, setSessions] = useState<VoiceSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(0)
  const [error, setError] = useState('')
  const [totalCount, setTotalCount] = useState(0)

  const fetchSessions = useCallback(async (pageIndex: number, append = false) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsLoading(false)
      return
    }

    const from = pageIndex * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data, error: fetchError, count } = await supabase
      .from('voice_sessions')
      .select(
        `id, created_at, duration_seconds, transcript, status,
         tasks:tasks(count)`,
        { count: 'exact' },
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (fetchError) {
      setError('음성 기록을 불러오지 못했습니다.')
      setIsLoading(false)
      setIsLoadingMore(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped: VoiceSession[] = (data ?? []).map((row: any) => ({
      id: row.id,
      created_at: row.created_at,
      duration_seconds: row.duration_seconds ?? null,
      transcript: row.transcript ?? null,
      status: (row.status ?? 'completed') as SessionStatus,
      // tasks is an aggregated count array: [{count: N}]
      task_count: Array.isArray(row.tasks) ? (row.tasks[0] as { count: number })?.count ?? 0 : 0,
    }))

    setSessions((prev) => (append ? [...prev, ...mapped] : mapped))
    setTotalCount(count ?? 0)
    setHasMore((count ?? 0) > (pageIndex + 1) * PAGE_SIZE)
    setIsLoading(false)
    setIsLoadingMore(false)
  }, [])

  useEffect(() => {
    void fetchSessions(0)
  }, [fetchSessions])

  const handleLoadMore = async () => {
    const nextPage = page + 1
    setPage(nextPage)
    setIsLoadingMore(true)
    await fetchSessions(nextPage, true)
  }

  const handleDelete = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    setTotalCount((prev) => Math.max(0, prev - 1))
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">음성 기록</h1>
          <p className="text-muted-foreground mt-1">녹음된 음성 기록을 확인하세요</p>
        </div>
        {!isLoading && totalCount > 0 && (
          <Badge variant="outline">{totalCount.toLocaleString('ko-KR')}개</Badge>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 px-4 py-10 text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
          <p className="text-sm font-medium text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              setError('')
              setIsLoading(true)
              void fetchSessions(0)
            }}
          >
            다시 시도
          </Button>
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-16 text-center">
          <Mic className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">아직 음성 기록이 없습니다</p>
          <p className="text-xs text-muted-foreground mt-1">
            음성 캡처 페이지에서 첫 번째 할 일을 등록해 보세요
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} onDelete={handleDelete} />
            ))}
          </div>

          {hasMore && (
            <>
              <Separator />
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleLoadMore()}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  더 불러오기
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
