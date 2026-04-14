import { gateway as vercelGateway, createGatewayProvider } from '@ai-sdk/gateway'
import { MODELS } from './models'

// On Vercel, AI Gateway is enabled automatically via the platform.
// For local dev, set OPENAI_API_KEY (and ANTHROPIC_API_KEY if needed) for direct access.
export const hasLocalKey = typeof process !== 'undefined' && !!process.env.OPENAI_API_KEY

export const gateway = process.env.VERCEL
  ? vercelGateway
  : createGatewayProvider()

export function getModel(modelId: keyof typeof MODELS) {
  return gateway(MODELS[modelId])
}
