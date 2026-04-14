import webpush from 'web-push'

// Initialize VAPID keys from environment
function initVapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT ?? 'mailto:admin@voxcierge.com'

  if (!publicKey || !privateKey) {
    console.warn('[push] VAPID keys not configured — push notifications disabled')
    return false
  }

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey)
    return true
  } catch (err) {
    console.warn('[push] Invalid VAPID keys — push notifications disabled:', err)
    return false
  }
}

const vapidReady = initVapid()

export interface PushPayload {
  title: string
  body: string
  url?: string
  icon?: string
  badge?: string
  tag?: string
}

export interface WebPushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

/**
 * Send a Web Push notification to a single subscription.
 * Returns true on success, false on failure (subscription gone = 410 removed upstream).
 */
export async function sendPushNotification(
  subscription: WebPushSubscription,
  payload: PushPayload,
): Promise<boolean> {
  if (!vapidReady) {
    console.warn('[push] Skipping push — VAPID not initialised')
    return false
  }

  const notification = {
    title: payload.title,
    body: payload.body,
    url: payload.url ?? '/',
    icon: payload.icon ?? '/icons/icon-192x192.png',
    badge: payload.badge ?? '/icons/badge-72x72.png',
    tag: payload.tag,
    data: { url: payload.url ?? '/' },
  }

  try {
    await webpush.sendNotification(subscription, JSON.stringify(notification), {
      TTL: 60 * 60, // 1 hour
      urgency: 'normal',
    })
    return true
  } catch (err) {
    const statusCode =
      err instanceof webpush.WebPushError ? err.statusCode : null

    if (statusCode === 410 || statusCode === 404) {
      // Subscription expired or unregistered — caller should remove it from DB
      console.info('[push] Subscription expired:', subscription.endpoint)
    } else {
      console.error('[push] Failed to send notification:', err)
    }
    return false
  }
}

/**
 * Send push notifications to multiple subscriptions concurrently.
 * Returns the count of successful deliveries.
 */
export async function sendPushNotifications(
  subscriptions: WebPushSubscription[],
  payload: PushPayload,
): Promise<number> {
  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendPushNotification(sub, payload)),
  )

  return results.filter(
    (r) => r.status === 'fulfilled' && r.value === true,
  ).length
}

/**
 * Utility: generate a new VAPID key pair.
 * Run once during setup: import and call this from a script.
 */
export function generateVapidKeys(): { publicKey: string; privateKey: string } {
  return webpush.generateVAPIDKeys()
}
