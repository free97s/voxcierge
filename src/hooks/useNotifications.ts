'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

interface UseNotificationsReturn {
  permission: PermissionState
  isSubscribed: boolean
  isLoading: boolean
  requestPermission: () => Promise<boolean>
  subscribe: () => Promise<boolean>
  unsubscribe: () => Promise<boolean>
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; i++) {
    view[i] = rawData.charCodeAt(i)
  }
  return buffer
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    const registration = await navigator.serviceWorker.ready
    return registration
  } catch {
    return null
  }
}

export function useNotifications(): UseNotificationsReturn {
  const [permission, setPermission] = useState<PermissionState>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Sync permission state on mount
  useEffect(() => {
    if (!('Notification' in window)) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission as PermissionState)
  }, [])

  // Check if we already have an active push subscription
  useEffect(() => {
    void (async () => {
      const reg = await getServiceWorkerRegistration()
      if (!reg) return
      const existing = await reg.pushManager.getSubscription()
      setIsSubscribed(!!existing)
    })()
  }, [])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) return false

    setIsLoading(true)
    try {
      const result = await Notification.requestPermission()
      setPermission(result as PermissionState)
      return result === 'granted'
    } finally {
      setIsLoading(false)
    }
  }, [])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!VAPID_PUBLIC_KEY) {
      console.warn('[useNotifications] VAPID public key not configured')
      return false
    }

    setIsLoading(true)
    try {
      // Ensure permission is granted
      if (Notification.permission !== 'granted') {
        const granted = await requestPermission()
        if (!granted) return false
      }

      const reg = await getServiceWorkerRegistration()
      if (!reg) {
        console.warn('[useNotifications] Service worker not available')
        return false
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToArrayBuffer(VAPID_PUBLIC_KEY),
      })

      const json = subscription.toJSON()

      // Persist subscription to Supabase
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { error } = await supabase
        .from('profiles')
        .update({
          push_subscription: json,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) {
        console.error('[useNotifications] Failed to save subscription:', error.message)
        await subscription.unsubscribe()
        return false
      }

      setIsSubscribed(true)
      return true
    } catch (err) {
      console.error('[useNotifications] subscribe error:', err)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [requestPermission])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true)
    try {
      const reg = await getServiceWorkerRegistration()
      if (!reg) return false

      const subscription = await reg.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
      }

      // Remove from Supabase
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .update({ push_subscription: null, updated_at: new Date().toISOString() })
          .eq('id', user.id)
      }

      setIsSubscribed(false)
      return true
    } catch (err) {
      console.error('[useNotifications] unsubscribe error:', err)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { permission, isSubscribed, isLoading, requestPermission, subscribe, unsubscribe }
}
