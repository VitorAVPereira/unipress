import { describe, expect, it } from 'vitest'

import { missingProductionEnvironment } from '@/lib/environment'

describe('gate de configuração de produção', () => {
  it('lista integrações obrigatórias ausentes', () => {
    expect(missingProductionEnvironment({})).toEqual([
      'DATABASE_URL',
      'PAYLOAD_SECRET',
      'CRON_SECRET',
      'PREVIEW_SECRET',
      'NEXT_PUBLIC_SERVER_URL',
      'BLOB_READ_WRITE_TOKEN',
      'CERTIFICATES_BLOB_READ_WRITE_TOKEN',
      'RESEND_API_KEY',
      'RESEND_FROM_EMAIL',
      'CONTACT_TO_EMAIL',
      'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
      'TURNSTILE_SECRET_KEY',
    ])
  })

  it('aceita ambiente completamente configurado', () => {
    const env = Object.fromEntries(
      [
        'DATABASE_URL',
        'PAYLOAD_SECRET',
        'CRON_SECRET',
        'PREVIEW_SECRET',
        'NEXT_PUBLIC_SERVER_URL',
        'BLOB_READ_WRITE_TOKEN',
        'CERTIFICATES_BLOB_READ_WRITE_TOKEN',
        'RESEND_API_KEY',
        'RESEND_FROM_EMAIL',
        'CONTACT_TO_EMAIL',
        'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
        'TURNSTILE_SECRET_KEY',
      ].map((key) => [key, `${key}-valor`]),
    )

    expect(missingProductionEnvironment(env)).toEqual([])
  })
})
