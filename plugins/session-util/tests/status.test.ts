import { expect, mock, test } from 'claude-code/testing'

const USAGE = { cache_read_input_tokens: 90_000, cache_creation_input_tokens: 5_000, input_tokens: 5_000, output_tokens: 300, model: 'claude-opus-5-5' }

test('shows TTL countdown, hit %, and context; expires after 5m', async ($, on) => {
  const clock = mock.clock(on, { now: 1_000_000 })
  const lines: (string | undefined)[] = []
  on('ui.status', (_, e) => { lines.push(e.text); return { value: undefined } })
  on('session.usage', () => ({ value: { startedAt: 0, context: { tokens: 100_000, window: 200_000, percent: 50 }, rateLimits: [] } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('turn.step', async function* (_, e) {
    return { turnId: e.turnId, index: e.index, answer: 'ok', toolUses: [], stopReason: 'end_turn' as const, usage: USAGE }
  })

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  expect(lines.at(-1)).toBe('cache — (5m) · ctx 100.0k/200.0k (50%)')

  const step = $.turn.step({ turnId: 't', index: 0, model: 'opus', messageCount: 1 })
  for await (const _ of step) { /* drain */ }
  await step.result
  expect(lines.at(-1)).toBe('cache 5:00 (5m) · hit 90% · ctx 100.0k/200.0k (50%)')

  await clock.advance(61_000)
  expect(lines.at(-1)).toBe('cache 3:59 (5m) · hit 90% · ctx 100.0k/200.0k (50%)')

  await clock.advance(5 * 60_000)
  expect(lines.at(-1)).toBe('cache expired (5m) · hit 90% · ctx 100.0k/200.0k (50%)')
})
