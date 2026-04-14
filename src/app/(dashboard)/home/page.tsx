'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckSquare, Mic } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { BriefingCard } from '@/components/briefing/BriefingCard'
import { BriefingPlayer } from '@/components/briefing/BriefingPlayer'
import { useBriefing } from '@/hooks/useBriefing'
import { createClient } from '@/lib/supabase/client'
import type { Task } from '@/types/task'

interface TaskStats {
  pending: number
  inProgress: number
  completed: number
  overdue: Task[]
}

function formatKoreanDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

function useTaskStats() {
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [displayName, setDisplayName] = useState('사용자')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setDisplayName('데모 사용자')
          setStats({ pending: 3, inProgress: 1, completed: 2, overdue: [] })
          return
        }

        const name =
          user.user_metadata?.full_name ??
          user.user_metadata?.display_name ??
          user.email?.split('@')[0] ??
          '사용자'
        setDisplayName(name as string)

        const now = new Date()
        const todayStart = new Date(now)
        todayStart.setHours(0, 0, 0, 0)
        const todayEnd = new Date(now)
        todayEnd.setHours(23, 59, 59, 999)

        const [pendingRes, inProgressRes, completedRes, overdueRes] = await Promise.all([
          supabase
            .from('tasks')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'pending'),

          supabase
            .from('tasks')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'in_progress'),

          supabase
            .from('tasks')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .gte('completed_at', todayStart.toISOString()),

          supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .in('status', ['pending', 'in_progress'])
            .lt('due_at', now.toISOString())
            .not('due_at', 'is', null)
            .order('due_at', { ascending: true })
            .limit(5),
        ])

        setStats({
          pending: pendingRes.count ?? 0,
          inProgress: inProgressRes.count ?? 0,
          completed: completedRes.count ?? 0,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          overdue: (overdueRes.data ?? []).map((row: any) => ({
            id: row.id as string,
            userId: row.user_id as string,
            title: row.title as string,
            description: (row.description ?? undefined) as string | undefined,
            status: row.status as Task['status'],
            priority: row.priority as Task['priority'],
            dueAt: (row.due_at ?? undefined) as string | undefined,
            completedAt: (row.completed_at ?? undefined) as string | undefined,
            postponedUntil: (row.postponed_until ?? undefined) as string | undefined,
            person: (row.person ?? undefined) as string | undefined,
            place: (row.place ?? undefined) as string | undefined,
            tags: (row.tags ?? []) as string[],
            createdAt: row.created_at as string,
            updatedAt: row.updated_at as string,
          })) satisfies Task[],
        })
      } catch (err) {
        console.error('[home] Failed to load task stats:', err)
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [])

  return { stats, displayName, isLoading }
}

export default function HomePage() {
  const { briefing, type, isLoading, isGenerating, error, generateBriefing } = useBriefing()
  const { stats, displayName, isLoading: statsLoading } = useTaskStats()
  const today = formatKoreanDate(new Date())

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          안녕하세요, {displayName}님
        </h1>
        <p className="text-muted-foreground mt-1">{today}</p>
      </div>

      {/* Task Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="text-center">
              <CardContent className="pt-4 pb-4">
                <Skeleton className="h-8 w-10 mx-auto mb-1" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold text-primary">{stats?.pending ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">대기 중</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold text-amber-500">{stats?.inProgress ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">진행 중</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-4 pb-4">
              <p className="text-2xl font-bold text-green-500">{stats?.completed ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">오늘 완료</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overdue Alert */}
      {stats && stats.overdue.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              기한 초과 할일
              <Badge variant="destructive" className="ml-auto">
                {stats.overdue.length}개
              </Badge>
            </CardTitle>
            <CardDescription>마감 기한이 지난 할 일이 있습니다</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {stats.overdue.map((task) => (
                <li key={task.id}>
                  <Link
                    href={`/tasks/${task.id}`}
                    className="flex items-center gap-2 text-sm hover:underline text-foreground"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                    <span className="truncate">{task.title}</span>
                    {task.dueAt && (
                      <span className="text-xs text-muted-foreground shrink-0 ml-auto">
                        {new Date(task.dueAt).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              render={<Link href="/tasks?filter=overdue" />}
            >
              전체 보기
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Briefing Error */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          브리핑 오류: {error}
        </div>
      )}

      {/* Daily Briefing */}
      <BriefingCard
        briefing={briefing}
        isLoading={isLoading}
        isGenerating={isGenerating}
        onGenerate={() => void generateBriefing()}
        type={type}
      />

      {/* Briefing Audio Player */}
      {(briefing?.ttsUrl || briefing?.content) && (
        <BriefingPlayer
          ttsUrl={briefing.ttsUrl ?? null}
          briefingContent={briefing.content}
          autoPlay={false}
        />
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">빠른 작업</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button className="flex-1 gap-2" render={<Link href="/capture" />}>
            <Mic className="h-4 w-4" />
            음성 캡처
          </Button>
          <Button variant="outline" className="flex-1 gap-2" render={<Link href="/tasks" />}>
            <CheckSquare className="h-4 w-4" />
            할일 보기
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
