import { timingSafeEqual } from 'node:crypto'
import { BrightDataCollector } from '@/src/integrations/brightdata.js'
import { WebReceiptService } from '@/src/services/orchestrator.js'
import { getStore } from '@/lib/server/service'

type BrightDataStatus = {
  configured: boolean
  collectorId: string | null
  targetConfigured: boolean
  protected: boolean
  allowUnprotectedLive: boolean
}

type BrightDataBundle = {
  collector: InstanceType<typeof BrightDataCollector>
  service: InstanceType<typeof WebReceiptService>
}

type BrightDataGlobal = {
  __webreceiptBrightData?: BrightDataBundle
  __webreceiptBrightDataBusy?: boolean
}

const globalRef = globalThis as unknown as BrightDataGlobal

function env(name: string): string {
  return String(process.env[name] || '').trim()
}

function validCollectorId(value: string): boolean {
  return /^c_[A-Za-z0-9_-]+$/.test(value) && !/^c_x+$/i.test(value)
}

function safeEqual(leftValue: string | null, rightValue: string): boolean {
  const left = Buffer.from(String(leftValue || ''))
  const right = Buffer.from(rightValue)
  return left.length === right.length && timingSafeEqual(left, right)
}

export function brightDataStatus(): BrightDataStatus {
  const token = env('BRIGHT_DATA_API_TOKEN')
  const collectorId = env('BRIGHT_DATA_COLLECTOR_ID')
  const operatorToken = env('WEBRECEIPT_OPERATOR_TOKEN')
  const allowUnprotectedLive = /^(1|true|yes)$/i.test(env('WEBRECEIPT_ALLOW_UNPROTECTED_LIVE'))
  const configured = Boolean(token && validCollectorId(collectorId))

  return {
    configured,
    collectorId: configured ? collectorId : null,
    targetConfigured: Boolean(env('BRIGHT_DATA_TARGET_URL')),
    protected: Boolean(operatorToken),
    allowUnprotectedLive,
  }
}

export function requireBrightDataOperator(req: Request): void {
  const status = brightDataStatus()
  if (!status.configured) {
    throw new Error('Bright Data live mode is not configured on this deployment.')
  }

  const operatorToken = env('WEBRECEIPT_OPERATOR_TOKEN')
  if (operatorToken) {
    const supplied = req.headers.get('x-webreceipt-operator')
    if (!safeEqual(supplied, operatorToken)) {
      throw new Error('Operator authorization required for this Bright Data action.')
    }
    return
  }

  if (!status.allowUnprotectedLive) {
    throw new Error(
      'Bright Data is configured but live operations are locked. Set WEBRECEIPT_OPERATOR_TOKEN (recommended) or explicitly set WEBRECEIPT_ALLOW_UNPROTECTED_LIVE=true.',
    )
  }
}

export function resolveBrightDataTarget(body: Record<string, unknown>): string {
  const bodyTarget = typeof body.targetUrl === 'string' ? body.targetUrl.trim() : ''
  const targetUrl = bodyTarget || env('BRIGHT_DATA_TARGET_URL')
  if (!targetUrl) {
    throw new Error('Bright Data live mode requires targetUrl in the request body or BRIGHT_DATA_TARGET_URL in the deployment environment.')
  }
  return targetUrl
}

export async function getBrightDataService() {
  const status = brightDataStatus()
  if (!status.configured) throw new Error('Bright Data live mode is not configured on this deployment.')

  if (!globalRef.__webreceiptBrightData) {
    const store = await getStore()
    const collector = new BrightDataCollector({
      token: env('BRIGHT_DATA_API_TOKEN'),
      collectorId: status.collectorId,
    })
    const service = new WebReceiptService({ collector, store })
    globalRef.__webreceiptBrightData = { collector, service }
  }

  return globalRef.__webreceiptBrightData.service
}

export async function withBrightDataLock<T>(task: () => Promise<T>): Promise<T> {
  if (globalRef.__webreceiptBrightDataBusy) {
    throw new Error('Another Bright Data operation is already running. Wait for it to finish before starting another.')
  }

  globalRef.__webreceiptBrightDataBusy = true
  try {
    return await task()
  } finally {
    globalRef.__webreceiptBrightDataBusy = false
  }
}

export function brightDataBusy(): boolean {
  return Boolean(globalRef.__webreceiptBrightDataBusy)
}
