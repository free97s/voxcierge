export type TierName = 'personal' | 'professional' | 'enterprise'

export interface TierConfig {
  name: TierName
  label: string
  description: string
  price: { monthly: number; yearly: number } | null
  limits: {
    voiceMinutesPerMonth: number
    transcriptionsPerMonth: number
    aiCallsPerMonth: number
    briefingsPerDay: number
    storageMb: number
  }
  features: {
    voiceCapture: boolean
    intentExtraction: boolean
    taskManagement: boolean
    dailyBriefing: boolean
    proactiveCheckin: boolean
    insights: boolean
    calendarIntegration: boolean
    agentCustomization: boolean
    dataIsolation: boolean
    prioritySupport: boolean
  }
}

export const tiers: Record<TierName, TierConfig> = {
  personal: {
    name: 'personal',
    label: 'Personal',
    description: '개인용 기본 음성 일정 관리',
    price: null,
    limits: {
      voiceMinutesPerMonth: 60,
      transcriptionsPerMonth: 30,
      aiCallsPerMonth: 50,
      briefingsPerDay: 1,
      storageMb: 100,
    },
    features: {
      voiceCapture: true,
      intentExtraction: true,
      taskManagement: true,
      dailyBriefing: false,
      proactiveCheckin: false,
      insights: false,
      calendarIntegration: false,
      agentCustomization: false,
      dataIsolation: false,
      prioritySupport: false,
    },
  },
  professional: {
    name: 'professional',
    label: 'Professional',
    description: '무제한 음성 요약, 인사이트, 캘린더 연동',
    price: { monthly: 19900, yearly: 199000 },
    limits: {
      voiceMinutesPerMonth: Infinity,
      transcriptionsPerMonth: Infinity,
      aiCallsPerMonth: Infinity,
      briefingsPerDay: Infinity,
      storageMb: 10240,
    },
    features: {
      voiceCapture: true,
      intentExtraction: true,
      taskManagement: true,
      dailyBriefing: true,
      proactiveCheckin: true,
      insights: true,
      calendarIntegration: true,
      agentCustomization: true,
      dataIsolation: false,
      prioritySupport: false,
    },
  },
  enterprise: {
    name: 'enterprise',
    label: 'Enterprise',
    description: '데이터 격리, 온프레미스 연동, 전담 지원',
    price: null, // 별도 문의
    limits: {
      voiceMinutesPerMonth: Infinity,
      transcriptionsPerMonth: Infinity,
      aiCallsPerMonth: Infinity,
      briefingsPerDay: Infinity,
      storageMb: Infinity,
    },
    features: {
      voiceCapture: true,
      intentExtraction: true,
      taskManagement: true,
      dailyBriefing: true,
      proactiveCheckin: true,
      insights: true,
      calendarIntegration: true,
      agentCustomization: true,
      dataIsolation: true,
      prioritySupport: true,
    },
  },
}

export function hasFeature(tier: TierName, feature: keyof TierConfig['features']): boolean {
  return tiers[tier].features[feature]
}
