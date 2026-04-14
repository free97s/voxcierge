// @vercel/config is not available as an npm package.
// This file declares the Vercel project configuration shape for reference.
// The authoritative config lives in vercel.json at the project root.

interface CronJob {
  path: string
  schedule: string
}

interface VercelConfig {
  crons: CronJob[]
}

const config: VercelConfig = {
  crons: [
    {
      path: '/api/cron/morning-briefing',
      schedule: '0 22 * * *', // 07:00 KST (UTC+9)
    },
    {
      path: '/api/cron/evening-briefing',
      schedule: '0 11 * * *', // 20:00 KST (UTC+9)
    },
    {
      path: '/api/cron/task-checkin',
      schedule: '*/30 * * * *',
    },
  ],
}

export default config
