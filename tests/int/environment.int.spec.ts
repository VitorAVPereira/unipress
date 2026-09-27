import { describe, expect, it } from 'vitest'

import { missingProductionEnvironment } from '@/lib/environment'

describe('gate de configuração de produção', () => {
  it('lista somente a infraestrutura essencial ausente', () => {
    expect(missingProductionEnvironment({})).toEqual([
      'DATABASE_URL',
      'PAYLOAD_SECRET',
      'CRON_SECRET',
      'PREVIEW_SECRET',
      'NEXT_PUBLIC_SERVER_URL',
      'NEXT_PUBLIC_WHATSAPP_NUMBER',
    ])
  })

  it('aceita o lançamento institucional sem integrações opcionais', () => {
    const env = Object.fromEntries(
      [
        'DATABASE_URL',
        'PAYLOAD_SECRET',
        'CRON_SECRET',
        'PREVIEW_SECRET',
        'NEXT_PUBLIC_SERVER_URL',
        'NEXT_PUBLIC_WHATSAPP_NUMBER',
      ].map((key) => [key, `${key}-valor`]),
    )

    expect(missingProductionEnvironment(env)).toEqual([])
  })
})
