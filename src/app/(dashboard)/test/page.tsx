'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Mic, CheckSquare, BarChart3, Bell, CreditCard, Shield, Headphones,
  ChevronRight, Play, RotateCcw, AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

// Components under test
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskCheckinDialog } from '@/components/tasks/TaskCheckinDialog'
import { TaskTimeline } from '@/components/tasks/TaskTimeline'
import { IntentCard } from '@/components/voice/IntentCard'
import { TranscriptPreview } from '@/components/voice/TranscriptPreview'
import { AudioWaveform } from '@/components/voice/AudioWaveform'
import { BriefingCard } from '@/components/briefing/BriefingCard'
import { PatternChart } from '@/components/insights/PatternChart'
import { WeeklyHeatmap } from '@/components/insights/WeeklyHeatmap'
import { OptimalTimeCard } from '@/components/insights/OptimalTimeCard'

import type { Task, TaskHistory } from '@/types/task'
import type { ExtractedIntent } from '@/types/ai'
import type { Briefing } from '@/types/briefing'
import type { Recommendation } from '@/types/insights'

// ─── Mock Data ───────────────────────────────────────────────────────────────

const now = new Date()
const yesterday = new Date(now.getTime() - 86400000)
const tomorrow = new Date(now.getTime() + 86400000)
const twoDaysAgo = new Date(now.getTime() - 172800000)

const mockTasks: Task[] = [
  {
    id: '1', userId: 'test', title: '프로젝트 제안서 작성',
    description: 'Q3 사이버보안 프로젝트 제안서 초안을 작성합니다.',
    status: 'in_progress', priority: 4,
    dueAt: tomorrow.toISOString(), person: '김팀장', place: '본사 3층',
    tags: ['제안서', '보안'], createdAt: twoDaysAgo.toISOString(), updatedAt: now.toISOString(),
  },
  {
    id: '2', userId: 'test', title: 'Coupang 미팅 준비',
    description: '미팅 자료 준비 및 발표자료 검토',
    status: 'pending', priority: 5,
    dueAt: now.toISOString(), person: '이대리',
    tags: ['미팅', '쿠팡'], createdAt: yesterday.toISOString(), updatedAt: now.toISOString(),
  },
  {
    id: '3', userId: 'test', title: '보안 감사 보고서 리뷰',
    status: 'completed', priority: 3,
    completedAt: yesterday.toISOString(),
    tags: ['보안', '감사'], createdAt: twoDaysAgo.toISOString(), updatedAt: yesterday.toISOString(),
  },
  {
    id: '4', userId: 'test', title: '팀 회식 장소 예약',
    description: '금요일 저녁 팀 회식 레스토랑 예약',
    status: 'postponed', priority: 2,
    dueAt: yesterday.toISOString(), postponedUntil: tomorrow.toISOString(),
    tags: ['팀', '회식'], createdAt: twoDaysAgo.toISOString(), updatedAt: now.toISOString(),
  },
  {
    id: '5', userId: 'test', title: 'VPN 설정 문서 업데이트',
    status: 'cancelled', priority: 1,
    tags: ['문서', 'VPN'], createdAt: twoDaysAgo.toISOString(), updatedAt: now.toISOString(),
  },
]

const mockOverdueTask: Task = {
  id: '6', userId: 'test', title: '클라이언트 보안 점검 완료',
  description: '분기별 보안 취약점 점검을 완료해야 합니다.',
  status: 'pending', priority: 5,
  dueAt: twoDaysAgo.toISOString(), person: '박과장', place: '고객사',
  tags: ['보안', '점검', '긴급'], createdAt: twoDaysAgo.toISOString(), updatedAt: now.toISOString(),
}

const mockHistory: TaskHistory[] = [
  { id: 'h1', taskId: '1', userId: 'test', action: 'created', newStatus: 'pending', metadata: {}, createdAt: twoDaysAgo.toISOString() },
  { id: 'h2', taskId: '1', userId: 'test', action: 'updated', previousStatus: 'pending', newStatus: 'in_progress', metadata: {}, createdAt: yesterday.toISOString() },
  { id: 'h3', taskId: '1', userId: 'test', action: 'checkin_sent', metadata: { channel: 'push' }, createdAt: now.toISOString() },
]

const mockIntent: ExtractedIntent = {
  intentType: 'task',
  action: '내일 오후 2시 원 IFC에서 김전무님과 미팅 일정 잡기',
  person: '김전무',
  place: 'One IFC',
  timeRaw: '내일 오후 2시',
  timeAbsolute: tomorrow.toISOString(),
  confidence: 0.92,
  tags: ['미팅', '일정'],
}

const mockBriefing: Briefing = {
  id: 'b1', userId: 'test', type: 'morning',
  content: `## 좋은 아침이에요, Dustin님! ☀️

### 📋 오늘의 할 일 (3건)

- **프로젝트 제안서 작성** — 김팀장님과 관련, 내일까지 마감
- **Coupang 미팅 준비** — 오늘 마감! 이대리님과 확인 필요
- **클라이언트 보안 점검** — ⚠️ 기한 초과 (2일 전)

### ✅ 어제 완료한 일 (1건)

- 보안 감사 보고서 리뷰 완료

### 💡 추천

오늘은 **화요일**이에요. 통계에 따르면 화요일 오전 10시-12시가 가장 집중력이 높은 시간대입니다. 제안서 작성을 이 시간에 하시는 건 어떨까요?`,
  tasksSummary: { pending: 3, completed: 1, overdue: 1 },
  modelUsed: 'claude-sonnet',
  generatedAt: now.toISOString(),
}

const mockPatternData = [
  { day: '월' as const, completed: 5, total: 7, rate: 71 },
  { day: '화' as const, completed: 8, total: 10, rate: 80 },
  { day: '수' as const, completed: 6, total: 9, rate: 67 },
  { day: '목' as const, completed: 7, total: 8, rate: 88 },
  { day: '금' as const, completed: 4, total: 8, rate: 50 },
  { day: '토' as const, completed: 2, total: 3, rate: 67 },
  { day: '일' as const, completed: 1, total: 2, rate: 50 },
]

function generateHeatmapData() {
  const data: Record<string, number> = {}
  for (let i = 83; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 86400000)
    const key = date.toISOString().split('T')[0]
    data[key] = Math.floor(Math.random() * 6)
  }
  return data
}

const mockRecommendations: Recommendation[] = [
  { type: 'time', message: '오전 10시-12시에 고난이도 업무를 배치하면 완료율이 23% 높아집니다.', priority: 1 },
  { type: 'pattern', message: '금요일 오후에 할 일을 자주 연기하고 있어요. 금요일은 가벼운 업무 위주로 계획해보세요.', priority: 2 },
  { type: 'workload', message: '이번 주 업무량이 평소보다 30% 많아요. 우선순위를 재조정해보세요.', priority: 3 },
]

// ─── Test Page ───────────────────────────────────────────────────────────────

export default function TestPage() {
  const [checkinTask, setCheckinTask] = useState<Task | null>(null)
  const [interimText, setInterimText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const heatmapData = generateHeatmapData()

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge className="bg-amber-100 text-amber-800">테스트 모드</Badge>
          <Badge variant="outline">외부 서비스 불필요</Badge>
        </div>
        <h1 className="text-2xl font-bold">컴포넌트 테스트 페이지</h1>
        <p className="text-muted-foreground mt-1">
          모든 UI 컴포넌트를 모크 데이터로 검증합니다. Supabase/OpenAI/Stripe 설정 없이 동작합니다.
        </p>
      </div>

      <Tabs defaultValue="voice">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="voice">🎤 음성</TabsTrigger>
          <TabsTrigger value="tasks">✅ 할일</TabsTrigger>
          <TabsTrigger value="briefing">📋 브리핑</TabsTrigger>
          <TabsTrigger value="insights">📊 인사이트</TabsTrigger>
          <TabsTrigger value="checkin">🔔 체크인</TabsTrigger>
          <TabsTrigger value="flow">🔄 전체 흐름</TabsTrigger>
        </TabsList>

        {/* ─── 음성 캡처 테스트 ─── */}
        <TabsContent value="voice" className="space-y-6 mt-6">
          <SectionTitle icon={<Mic className="w-5 h-5" />} title="음성 캡처 컴포넌트" />

          {/* Audio Waveform (no stream = idle state) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">AudioWaveform — 대기 상태</CardTitle>
              <CardDescription>mediaStream이 없을 때의 기본 표시</CardDescription>
            </CardHeader>
            <CardContent>
              <AudioWaveform mediaStream={null} isRecording={false} />
            </CardContent>
          </Card>

          {/* Transcript Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">TranscriptPreview — 실시간 인식</CardTitle>
              <CardDescription>라이브 트랜스크립트 미리보기</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TranscriptPreview
                interimText={interimText}
                finalText="내일 오후 2시에 김전무님과 미팅 일정을 잡아줘."
                isListening={isListening}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={isListening ? 'destructive' : 'default'}
                  onClick={() => {
                    setIsListening(!isListening)
                    if (!isListening) {
                      setInterimText('')
                      const words = '원 IFC 회의실에서 진행하고 자료는 이대리에게 요청해줘'.split('')
                      let i = 0
                      const interval = setInterval(() => {
                        if (i < words.length) {
                          setInterimText(prev => prev + words[i])
                          i++
                        } else {
                          clearInterval(interval)
                          setIsListening(false)
                        }
                      }, 80)
                    }
                  }}
                >
                  {isListening ? '중지' : '인식 시뮬레이션 시작'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setInterimText('')}>
                  <RotateCcw className="w-3 h-3 mr-1" /> 초기화
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Intent Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">IntentCard — AI 의도 추출 결과</CardTitle>
              <CardDescription>음성에서 추출된 의도 확인 및 편집</CardDescription>
            </CardHeader>
            <CardContent>
              <IntentCard
                intent={mockIntent}
                onConfirm={(edited) => alert(`✅ 할일 생성 확인!\n\n${JSON.stringify(edited, null, 2)}`)}
                onDiscard={() => alert('❌ 폐기됨')}
              />
            </CardContent>
          </Card>

          {/* Low confidence intent */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">IntentCard — 낮은 신뢰도</CardTitle>
              <CardDescription>confidence 0.45 — 사용자 확인 강조</CardDescription>
            </CardHeader>
            <CardContent>
              <IntentCard
                intent={{
                  ...mockIntent,
                  confidence: 0.45,
                  action: '뭔가 내일... 해야 할 것 같은데',
                  person: undefined,
                  place: undefined,
                  timeAbsolute: undefined,
                  intentType: 'unknown',
                }}
                onConfirm={(edited) => alert(`확인: ${JSON.stringify(edited, null, 2)}`)}
                onDiscard={() => alert('폐기')}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── 할일 관리 테스트 ─── */}
        <TabsContent value="tasks" className="space-y-6 mt-6">
          <SectionTitle icon={<CheckSquare className="w-5 h-5" />} title="할일 컴포넌트" />

          {/* Individual Task Cards by Status */}
          <div className="grid gap-4 md:grid-cols-2">
            {mockTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={(t) => alert(`상태 변경: ${t.title} → ${t.status}`)}
                onEdit={(task) => alert(`편집: ${task.title}`)}
                onCheckin={(task) => setCheckinTask(task)}
              />
            ))}
          </div>

          <Separator />

          {/* Task List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">TaskList — 목록 보기</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskList
                tasks={mockTasks.filter(t => t.status === 'pending' || t.status === 'in_progress')}
                isLoading={false}
                emptyMessage="진행 중인 할일이 없습니다."
                onStatusChange={(t) => alert(`${t.title} → ${t.status}`)}
                onEdit={(task) => alert(`편집: ${task.title}`)}
                onCheckin={(task) => setCheckinTask(task)}
              />
            </CardContent>
          </Card>

          {/* Loading State */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">TaskList — 로딩 상태</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskList
                tasks={[]}
                isLoading={true}
                emptyMessage=""
                onStatusChange={() => {}}
                onEdit={() => {}}
                onCheckin={() => {}}
              />
            </CardContent>
          </Card>

          {/* Empty State */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">TaskList — 빈 상태</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskList
                tasks={[]}
                isLoading={false}
                emptyMessage="등록된 할일이 없습니다. 음성으로 추가해보세요!"
                onStatusChange={() => {}}
                onEdit={() => {}}
                onCheckin={() => {}}
              />
            </CardContent>
          </Card>

          <Separator />

          {/* Task Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">TaskTimeline — 히스토리</CardTitle>
              <CardDescription>태스크 상태 변경 이력</CardDescription>
            </CardHeader>
            <CardContent>
              <TaskTimeline history={mockHistory} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── 브리핑 테스트 ─── */}
        <TabsContent value="briefing" className="space-y-6 mt-6">
          <SectionTitle icon={<Headphones className="w-5 h-5" />} title="데일리 브리핑" />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">BriefingCard — 아침 브리핑</CardTitle>
              <CardDescription>AI가 생성한 오늘의 브리핑</CardDescription>
            </CardHeader>
            <CardContent>
              <BriefingCard
                briefing={mockBriefing}
                isLoading={false}
                isGenerating={false}
                onGenerate={() => alert('브리핑 재생성 요청')}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">BriefingCard — 로딩 상태</CardTitle>
            </CardHeader>
            <CardContent>
              <BriefingCard
                briefing={null}
                isLoading={true}
                isGenerating={false}
                onGenerate={() => {}}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">BriefingCard — 생성 필요</CardTitle>
              <CardDescription>브리핑이 아직 없을 때</CardDescription>
            </CardHeader>
            <CardContent>
              <BriefingCard
                briefing={null}
                isLoading={false}
                isGenerating={false}
                onGenerate={() => alert('브리핑 생성 시작')}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── 인사이트 테스트 ─── */}
        <TabsContent value="insights" className="space-y-6 mt-6">
          <SectionTitle icon={<BarChart3 className="w-5 h-5" />} title="업무 인사이트" />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">PatternChart — 요일별 완료율</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <PatternChart data={mockPatternData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">WeeklyHeatmap — 12주 완료 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <WeeklyHeatmap data={heatmapData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">OptimalTimeCard — AI 추천</CardTitle>
            </CardHeader>
            <CardContent>
              <OptimalTimeCard recommendations={mockRecommendations} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── 체크인 테스트 ─── */}
        <TabsContent value="checkin" className="space-y-6 mt-6">
          <SectionTitle icon={<Bell className="w-5 h-5" />} title="피드백 루프 / 체크인" />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">기한 초과 태스크</CardTitle>
              <CardDescription>체크인 다이얼로그를 열어 완료/연기/취소를 테스트합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-red-800 dark:text-red-300">
                    &quot;{mockOverdueTask.title}&quot;의 기한이 지났습니다.
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    기한: {new Date(mockOverdueTask.dueAt!).toLocaleDateString('ko-KR')} · {mockOverdueTask.person}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setCheckinTask(mockOverdueTask)}
                >
                  응답하기
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                💡 실제 서비스에서는 Vercel Cron이 30분마다 기한 초과 태스크를 확인하고,
                Web Push 알림으로 &quot;어제 말씀하신 &apos;{mockOverdueTask.title}&apos;은(는) 마무리되었나요?&quot;
                라고 질문합니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Push 알림 시뮬레이션</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => {
                  if ('Notification' in window) {
                    Notification.requestPermission().then(permission => {
                      if (permission === 'granted') {
                        new Notification('VoxCierge 체크인', {
                          body: `어제 말씀하신 '${mockOverdueTask.title}'은(는) 마무리되었나요?`,
                          icon: '/icons/icon-192.png',
                        })
                      } else {
                        alert('알림 권한이 필요합니다. 브라우저 설정에서 허용해주세요.')
                      }
                    })
                  } else {
                    alert('이 브라우저는 알림을 지원하지 않습니다.')
                  }
                }}
              >
                <Bell className="w-4 h-4 mr-2" /> 테스트 알림 보내기
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── 전체 흐름 테스트 ─── */}
        <TabsContent value="flow" className="space-y-6 mt-6">
          <SectionTitle icon={<Play className="w-5 h-5" />} title="E2E 흐름 가이드" />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">음성 → 태스크 생성 전체 흐름</CardTitle>
              <CardDescription>실제 서비스 사용 시나리오</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {[
                  { step: '음성 캡처', desc: '마이크 버튼을 눌러 음성을 녹음합니다.', link: '/capture', icon: <Mic className="w-4 h-4" /> },
                  { step: 'AI 변환', desc: 'Whisper가 음성을 텍스트로 변환하고, LLM이 의도를 추출합니다.', icon: <BarChart3 className="w-4 h-4" /> },
                  { step: '할일 생성', desc: '추출된 의도를 확인/편집 후 할일로 저장합니다.', link: '/tasks', icon: <CheckSquare className="w-4 h-4" /> },
                  { step: '데일리 브리핑', desc: '매일 아침/저녁 AI가 할일을 요약하여 보고합니다.', link: '/home', icon: <Headphones className="w-4 h-4" /> },
                  { step: '체크인', desc: '기한 초과 시 자동으로 완료 여부를 확인합니다.', icon: <Bell className="w-4 h-4" /> },
                  { step: '인사이트', desc: '업무 패턴을 분석하여 최적의 작업 시간을 추천합니다.', link: '/insights', icon: <BarChart3 className="w-4 h-4" /> },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <span className="font-medium">{item.step}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                    {item.link && (
                      <Link href={item.link}>
                        <Button size="sm" variant="outline">
                          이동 <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Separator />

          {/* Environment Check */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4" /> 환경 설정 상태
              </CardTitle>
              <CardDescription>외부 서비스 연결 상태를 확인합니다</CardDescription>
            </CardHeader>
            <CardContent>
              <EnvCheckList />
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">빠른 이동</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: '음성 캡처', href: '/capture', icon: <Mic className="w-5 h-5" /> },
                  { label: '할일 목록', href: '/tasks', icon: <CheckSquare className="w-5 h-5" /> },
                  { label: '인사이트', href: '/insights', icon: <BarChart3 className="w-5 h-5" /> },
                  { label: '설정', href: '/settings', icon: <CreditCard className="w-5 h-5" /> },
                ].map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button variant="outline" className="w-full h-20 flex-col gap-2">
                      {item.icon}
                      <span className="text-sm">{item.label}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Check-in Dialog */}
      <TaskCheckinDialog
        task={checkinTask}
        isOpen={!!checkinTask}
        onClose={() => setCheckinTask(null)}
      />
    </div>
  )
}

// ─── Helper Components ───────────────────────────────────────────────────────

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  )
}

function EnvCheckList() {
  const checks = [
    { name: 'NEXT_PUBLIC_SUPABASE_URL', desc: 'Supabase 프로젝트 URL' },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', desc: 'Supabase Anon 키' },
    { name: 'OPENAI_API_KEY', desc: 'OpenAI API 키 (Whisper/TTS)' },
    { name: 'NEXT_PUBLIC_VAPID_PUBLIC_KEY', desc: 'Web Push VAPID 공개키' },
    { name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', desc: 'Stripe 공개키' },
  ]

  return (
    <div className="space-y-2">
      {checks.map(({ name, desc }) => {
        const value = typeof window !== 'undefined'
          ? (name.startsWith('NEXT_PUBLIC_') ? process.env[name] : undefined)
          : undefined
        const isSet = !!value && value !== '' && !value.includes('placeholder')
        return (
          <div key={name} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
            <div>
              <code className="text-xs font-mono">{name}</code>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <Badge variant={isSet ? 'default' : 'outline'} className={isSet ? 'bg-green-600' : ''}>
              {isSet ? '설정됨' : '미설정'}
            </Badge>
          </div>
        )
      })}
      <p className="text-xs text-muted-foreground mt-3">
        서버 전용 키(SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY 등)는 클라이언트에서 확인할 수 없습니다.
        <code className="ml-1">.env.local</code> 파일을 직접 확인하세요.
      </p>
    </div>
  )
}
