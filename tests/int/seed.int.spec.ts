import { describe, expect, it } from 'vitest'

import { assertDemoSeedAllowed } from '@/lib/demoSeedGuard'

describe('seed demonstrativo', () => {
  it('é permitido em desenvolvimento', () => {
    expect(() => assertDemoSeedAllowed('development')).not.toThrow()
  })

  it('é bloqueado em produção', () => {
    expect(() => assertDemoSeedAllowed('production')).toThrow('bloqueado em produção')
  })
})
