import type { Register, EngineInterface, TurnUsage } from 'claude-code'

const FIVE_MIN = 5 * 60_000
const ONE_HOUR = 60 * 60_000

type Tracker = {
  lastAt?: number
  last?: TurnUsage
  ttlMs: number
  ttlLearned: boolean
  ctxText: string
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return `${n}`
}

function fmtClock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

async function refreshContext($: EngineInterface, t: Tracker): Promise<void> {
  try {
    const u = await $.session.usage()
    // Subscription sessions (rate-limit windows reported) get the 1h cache.
    if (!t.ttlLearned && u.rateLimits.length > 0) t.ttlMs = ONE_HOUR
    const c = u.context
    t.ctxText = c.tokens === undefined
      ? `ctx –/${fmtTokens(c.window)}`
      : `ctx ${fmtTokens(c.tokens)}/${fmtTokens(c.window)} (${c.percent ?? Math.round((c.tokens / c.window) * 100)}%)`
  } catch {
    // keep the previous figure
  }
}

async function draw($: EngineInterface, t: Tracker): Promise<void> {
  const parts: string[] = []
  const ttlLabel = t.ttlMs === ONE_HOUR ? '1h' : '5m'
  if (t.lastAt === undefined) {
    parts.push(`cache — (${ttlLabel})`)
  } else {
    const left = t.lastAt + t.ttlMs - (await $.clock.now())
    parts.push(left > 0 ? `cache ${fmtClock(left)} (${ttlLabel})` : `cache expired (${ttlLabel})`)
  }
  if (t.last) {
    const u = t.last
    const total = u.input_tokens + u.cache_read_input_tokens + u.cache_creation_input_tokens
    parts.push(`hit ${total > 0 ? Math.round((u.cache_read_input_tokens / total) * 100) : 0}%`)
  }
  if (t.ctxText) parts.push(t.ctxText)
  $.ui.status(parts.join(' · '))
}

export const register: Register = (on, options) => {
  const setting = String(options?.ttl ?? 'auto')
  const t: Tracker = {
    ttlMs: setting === '1h' ? ONE_HOUR : FIVE_MIN,
    ttlLearned: setting !== 'auto',
    ctxText: '',
  }

  on('session.start', async ($, e, next) => {
    const r = await next(e)
    await refreshContext($, t)
    await draw($, t)
    $.clock.every(1000, () => draw($, t))
    return r
  })

  on('turn.step', async function* ($, e, next) {
    const r = yield* next(e)
    if (e.agentId === undefined && r.usage) {
      const now = await $.clock.now()
      // A cache read more than 5 minutes after the previous response proves a 1h TTL.
      if (!t.ttlLearned && t.lastAt !== undefined && now - t.lastAt > FIVE_MIN && r.usage.cache_read_input_tokens > 0) {
        t.ttlMs = ONE_HOUR
        t.ttlLearned = true
      }
      t.lastAt = now
      t.last = r.usage
      await refreshContext($, t)
      await draw($, t)
    }
    return r
  })

  on('session.compact', async ($, e, next) => {
    const r = await next(e)
    await refreshContext($, t)
    await draw($, t)
    return r
  })
}
