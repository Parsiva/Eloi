import { describe, expect, it } from 'vitest'

describe('importing the engine without a DOM', () => {
  it('does not throw in plain node', async () => {
    expect(typeof document).toBe('undefined')
    const mod = await import('./index')
    expect(mod.defaultScheduler).toBeDefined()
    expect(typeof mod.mount).toBe('function')
  })
})
