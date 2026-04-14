import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/notifications/push'
import type { WebPushSubscription } from '@/lib/notifications/push'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('push_subscription')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.push_subscription) {
      return NextResponse.json({ error: 'No push subscription found' }, { status: 400 })
    }

    const sent = await sendPushNotification(
      profile.push_subscription as WebPushSubscription,
      {
        title: 'VoxCierge 테스트 알림',
        body: '알림이 정상적으로 동작하고 있습니다! 🎉',
        url: '/home',
        tag: 'voxcierge-test',
      },
    )

    if (!sent) {
      return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[api/notifications/test]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
