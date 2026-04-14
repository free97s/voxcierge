'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Clock, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useNotifications } from '@/hooks/useNotifications'
import { createClient } from '@/lib/supabase/client'

interface BriefingSettings {
  morningEnabled: boolean
  morningTime: string
  eveningEnabled: boolean
  eveningTime: string
  deadlineAlert: boolean
}

const DEFAULT_SETTINGS: BriefingSettings = {
  morningEnabled: false,
  morningTime: '08:00',
  eveningEnabled: false,
  eveningTime: '20:00',
  deadlineAlert: true,
}

const PERMISSION_LABEL: Record<string, string> = {
  default: '아직 허용하지 않음',
  granted: '허용됨',
  denied: '차단됨',
  unsupported: '지원되지 않음',
}

const PERMISSION_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  granted: 'default',
  denied: 'destructive',
  default: 'secondary',
  unsupported: 'outline',
}

export default function NotificationsPage() {
  const { permission, isSubscribed, isLoading, requestPermission, subscribe, unsubscribe } =
    useNotifications()

  const [settings, setSettings] = useState<BriefingSettings>(DEFAULT_SETTINGS)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  // Load saved settings from profile
  useEffect(() => {
    void (async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('briefing_settings')
          .eq('id', user.id)
          .maybeSingle()

        if (profile?.briefing_settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...(profile.briefing_settings as Partial<BriefingSettings>) })
        }
      } catch {
        // Supabase not configured — use DEFAULT_SETTINGS
      }
    })()
  }, [])

  const handleTogglePush = async () => {
    if (isSubscribed) {
      await unsubscribe()
    } else {
      await subscribe()
    }
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    setSaveStatus('idle')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({
          briefing_settings: settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      console.error('[NotificationsPage] save error:', err)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestNotification = async () => {
    if (!isSubscribed) return
    setIsTesting(true)
    try {
      const res = await fetch('/api/notifications/test', { method: 'POST' })
      if (!res.ok) throw new Error('Test notification failed')
    } catch (err) {
      console.error('[NotificationsPage] test notification error:', err)
      alert('테스트 알림 전송에 실패했습니다.')
    } finally {
      setIsTesting(false)
    }
  }

  const updateSetting = <K extends keyof BriefingSettings>(key: K, value: BriefingSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">알림 설정</h1>
        <p className="text-muted-foreground mt-1">푸시 알림 및 브리핑 시간을 관리하세요</p>
      </div>

      {/* Push notification toggle */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            푸시 알림
          </CardTitle>
          <CardDescription>브라우저 푸시 알림을 받으세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">알림 권한</p>
              <Badge variant={PERMISSION_VARIANT[permission] ?? 'secondary'}>
                {PERMISSION_LABEL[permission] ?? permission}
              </Badge>
            </div>
            {permission === 'denied' && (
              <p className="text-xs text-muted-foreground max-w-[200px] text-right">
                브라우저 설정에서 알림을 허용해 주세요
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">푸시 알림 활성화</p>
              <p className="text-xs text-muted-foreground">
                {isSubscribed ? '알림이 활성화되어 있습니다' : '알림이 비활성화되어 있습니다'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isSubscribed ? (
                <Bell className="h-4 w-4 text-green-500" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
              <Switch
                checked={isSubscribed}
                onCheckedChange={() => void handleTogglePush()}
                disabled={isLoading || permission === 'denied' || permission === 'unsupported'}
              />
            </div>
          </div>

          {isSubscribed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleTestNotification()}
              disabled={isTesting}
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              테스트 알림 보내기
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Briefing schedule */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            브리핑 일정
          </CardTitle>
          <CardDescription>아침/저녁 브리핑 시간을 설정하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Morning briefing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">아침 브리핑</p>
                <p className="text-xs text-muted-foreground">
                  매일 아침 오늘의 할일을 브리핑 받으세요
                </p>
              </div>
              <Switch
                checked={settings.morningEnabled}
                onCheckedChange={(v) => updateSetting('morningEnabled', v)}
              />
            </div>
            {settings.morningEnabled && (
              <div className="flex items-center gap-3 pl-1">
                <Label htmlFor="morningTime" className="text-sm shrink-0">
                  시간
                </Label>
                <Input
                  id="morningTime"
                  type="time"
                  value={settings.morningTime}
                  onChange={(e) => updateSetting('morningTime', e.target.value)}
                  className="w-32"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Evening briefing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">저녁 브리핑</p>
                <p className="text-xs text-muted-foreground">
                  매일 저녁 오늘의 완료 현황을 리뷰하세요
                </p>
              </div>
              <Switch
                checked={settings.eveningEnabled}
                onCheckedChange={(v) => updateSetting('eveningEnabled', v)}
              />
            </div>
            {settings.eveningEnabled && (
              <div className="flex items-center gap-3 pl-1">
                <Label htmlFor="eveningTime" className="text-sm shrink-0">
                  시간
                </Label>
                <Input
                  id="eveningTime"
                  type="time"
                  value={settings.eveningTime}
                  onChange={(e) => updateSetting('eveningTime', e.target.value)}
                  className="w-32"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Deadline alerts */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">마감 임박 알림</p>
              <p className="text-xs text-muted-foreground">마감 1시간 전 알림을 받으세요</p>
            </div>
            <Switch
              checked={settings.deadlineAlert}
              onCheckedChange={(v) => updateSetting('deadlineAlert', v)}
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button size="sm" onClick={() => void handleSaveSettings()} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              설정 저장
            </Button>
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                저장되었습니다
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                저장 실패
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
