'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  CalendarIcon,
  RefreshCwIcon,
  CheckCircle2Icon,
  CircleIcon,
  UnplugIcon,
  PlugIcon,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { EventCard } from '@/components/calendar/EventCard'
import type { CalendarConnection, CalendarEvent } from '@/types/calendar'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatSyncTime(iso: string | null): string {
  if (!iso) return '동기화된 적 없음'
  const d = new Date(iso)
  return d.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function ProviderLogo({ provider }: { provider: 'google' | 'outlook' }) {
  if (provider === 'google') {
    return (
      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
        style={{
          background:
            'linear-gradient(135deg, #4285F4 0%, #34A853 50%, #FBBC04 75%, #EA4335 100%)',
        }}
        aria-label="Google"
      >
        G
      </div>
    )
  }
  return (
    <div
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0078D4] text-sm font-bold text-white"
      aria-label="Microsoft Outlook"
    >
      O
    </div>
  )
}

// ---------------------------------------------------------------------------
// Provider card
// ---------------------------------------------------------------------------
interface ProviderCardProps {
  provider: 'google' | 'outlook'
  connection: CalendarConnection | null
  isConnecting: boolean
  isDisconnecting: boolean
  onConnect: (provider: 'google' | 'outlook') => void
  onDisconnect: (id: string) => void
}

function ProviderCard({
  provider,
  connection,
  isConnecting,
  isDisconnecting,
  onConnect,
  onDisconnect,
}: ProviderCardProps) {
  const label = provider === 'google' ? 'Google 캘린더' : 'Outlook 캘린더'
  const connected = connection !== null && connection.isActive

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <ProviderLogo provider={provider} />

      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        {connected ? (
          <>
            <p className="truncate text-xs text-muted-foreground">{connection!.email}</p>
            <p className="text-[11px] text-muted-foreground">
              마지막 동기화: {formatSyncTime(connection!.lastSyncedAt)}
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">연결되지 않음</p>
        )}
      </div>

      <div className="shrink-0">
        {connected ? (
          <div className="flex items-center gap-2">
            <CheckCircle2Icon className="h-4 w-4 text-green-500" aria-label="연결됨" />
            <Button
              variant="destructive"
              size="sm"
              disabled={isDisconnecting}
              onClick={() => onDisconnect(connection!.id)}
              className="gap-1.5"
            >
              <UnplugIcon className="h-3.5 w-3.5" />
              {isDisconnecting ? '해제 중...' : '연결 해제'}
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            disabled={isConnecting}
            onClick={() => onConnect(provider)}
            className="gap-1.5"
          >
            <PlugIcon className="h-3.5 w-3.5" />
            {isConnecting
              ? '연결 중...'
              : provider === 'google'
                ? 'Google 연결'
                : 'Outlook 연결'}
          </Button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
interface SyncSettings {
  autoSync: boolean
  interval: '1h' | '6h' | '1d'
}

export default function CalendarSettingsPage() {
  const [connections, setConnections] = useState<CalendarConnection[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoadingConnections, setIsLoadingConnections] = useState(true)
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [connectingProvider, setConnectingProvider] = useState<'google' | 'outlook' | null>(null)
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null)
  const [syncSettings, setSyncSettings] = useState<SyncSettings>({
    autoSync: true,
    interval: '1h',
  })

  // Load connections
  const loadConnections = useCallback(async () => {
    try {
      const res = await fetch('/api/calendar/connections')
      if (!res.ok) throw new Error('Failed to fetch')
      const data: CalendarConnection[] = await res.json()
      setConnections(data)
    } catch {
      // API not yet available — show empty state gracefully
      setConnections([])
    } finally {
      setIsLoadingConnections(false)
    }
  }, [])

  // Load upcoming events (next 7 days)
  const loadEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/calendar/events?days=7&limit=10')
      if (!res.ok) throw new Error('Failed to fetch')
      const data: CalendarEvent[] = await res.json()
      setEvents(data)
    } catch {
      setEvents([])
    } finally {
      setIsLoadingEvents(false)
    }
  }, [])

  useEffect(() => {
    void loadConnections()
    void loadEvents()
  }, [loadConnections, loadEvents])

  async function handleConnect(provider: 'google' | 'outlook') {
    setConnectingProvider(provider)
    try {
      const res = await fetch(`/api/calendar/connect/${provider}`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to initiate OAuth')
      const { authUrl }: { authUrl: string } = await res.json()
      window.location.href = authUrl
    } catch {
      toast.error(`${provider === 'google' ? 'Google' : 'Outlook'} 연결에 실패했습니다.`)
    } finally {
      setConnectingProvider(null)
    }
  }

  async function handleDisconnect(id: string) {
    setDisconnectingId(id)
    try {
      const res = await fetch(`/api/calendar/connections/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to disconnect')
      setConnections((prev) => prev.filter((c) => c.id !== id))
      setEvents([])
      toast.success('캘린더 연결이 해제되었습니다.')
    } catch {
      toast.error('연결 해제에 실패했습니다.')
    } finally {
      setDisconnectingId(null)
    }
  }

  async function handleSyncNow() {
    setIsSyncing(true)
    try {
      const res = await fetch('/api/calendar/sync', { method: 'POST' })
      if (!res.ok) throw new Error('Sync failed')
      await loadEvents()
      await loadConnections()
      toast.success('동기화가 완료되었습니다.')
    } catch {
      toast.error('동기화에 실패했습니다.')
    } finally {
      setIsSyncing(false)
    }
  }

  async function handleSaveSyncSettings(next: SyncSettings) {
    setSyncSettings(next)
    try {
      await fetch('/api/calendar/sync-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      })
      toast.success('동기화 설정이 저장되었습니다.')
    } catch {
      // Silently fail — local state is already updated
    }
  }

  const googleConn = connections.find((c) => c.provider === 'google') ?? null
  const outlookConn = connections.find((c) => c.provider === 'outlook') ?? null
  const hasAnyConnection = connections.some((c) => c.isActive)

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CalendarIcon className="h-6 w-6 text-primary" />
          캘린더 연동
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Google 또는 Outlook 캘린더를 연결하여 일정을 자동으로 동기화하세요
        </p>
      </div>

      {/* Connected accounts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">연결된 계정</CardTitle>
          <CardDescription>캘린더를 연결하면 음성으로 일정을 등록할 수 있습니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoadingConnections ? (
            <>
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </>
          ) : (
            <>
              <ProviderCard
                provider="google"
                connection={googleConn}
                isConnecting={connectingProvider === 'google'}
                isDisconnecting={disconnectingId === googleConn?.id}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
              />
              <ProviderCard
                provider="outlook"
                connection={outlookConn}
                isConnecting={connectingProvider === 'outlook'}
                isDisconnecting={disconnectingId === outlookConn?.id}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Sync settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">동기화 설정</CardTitle>
          <CardDescription>일정을 얼마나 자주 가져올지 설정하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auto sync toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoSync" className="text-sm font-medium cursor-pointer">
                자동 동기화
              </Label>
              <p className="text-xs text-muted-foreground">백그라운드에서 주기적으로 동기화합니다</p>
            </div>
            <Switch
              id="autoSync"
              checked={syncSettings.autoSync}
              onCheckedChange={(checked) =>
                handleSaveSyncSettings({ ...syncSettings, autoSync: checked })
              }
              disabled={!hasAnyConnection}
            />
          </div>

          {/* Sync interval */}
          {syncSettings.autoSync && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-medium">동기화 주기</Label>
                <Select
                  value={syncSettings.interval}
                  onValueChange={(v) => {
                    if (v === '1h' || v === '6h' || v === '1d') {
                      void handleSaveSyncSettings({ ...syncSettings, interval: v })
                    }
                  }}
                  disabled={!hasAnyConnection}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">매 시간</SelectItem>
                    <SelectItem value="6h">매 6시간</SelectItem>
                    <SelectItem value="1d">매일</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <Separator />

          {/* Manual sync */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">수동 동기화</p>
              <p className="text-xs text-muted-foreground">지금 즉시 동기화합니다</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={!hasAnyConnection || isSyncing}
              onClick={() => void handleSyncNow()}
              className="gap-1.5"
            >
              <RefreshCwIcon className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? '동기화 중...' : '지금 동기화'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming events preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">향후 7일 일정 미리보기</CardTitle>
          <CardDescription>연결된 캘린더의 예정된 일정입니다</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingEvents ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          ) : !hasAnyConnection ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <CircleIcon className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">캘린더를 연결하면 일정이 표시됩니다</p>
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <CheckCircle2Icon className="h-8 w-8 text-green-400" />
              <p className="text-sm text-muted-foreground">향후 7일간 예정된 일정이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
