import { describe, expect, it } from 'vitest'

import {
  calibrationCallToActionHref,
  isContactFormEnabled,
  isDemoContentEnabled,
  isPasswordRecoveryEnabled,
} from '@/lib/launch'

describe('lançamento institucional', () => {
  it('mantém o formulário desativado sem a configuração completa de e-mail e antispam', () => {
    expect(isContactFormEnabled({}, 'comercial@example.com')).toBe(false)
    expect(isContactFormEnabled({
      RESEND_API_KEY: 'resend-key',
      RESEND_FROM_EMAIL: 'site@example.com',
    }, 'comercial@example.com')).toBe(false)
  })

  it('habilita o formulário com Resend, Turnstile e destinatário definido no admin', () => {
    expect(isContactFormEnabled({
      RESEND_API_KEY: 'resend-key',
      RESEND_FROM_EMAIL: 'site@example.com',
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'site-key',
      TURNSTILE_SECRET_KEY: 'secret-key',
    }, 'comercial@example.com')).toBe(true)
    expect(isContactFormEnabled({
      RESEND_API_KEY: 'resend-key',
      RESEND_FROM_EMAIL: 'site@example.com',
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'site-key',
      TURNSTILE_SECRET_KEY: 'secret-key',
    }, '')).toBe(false)
  })

  it('habilita a recuperação de senha somente quando o adaptador de e-mail pode ser criado', () => {
    expect(isPasswordRecoveryEnabled({})).toBe(false)
    expect(isPasswordRecoveryEnabled({ RESEND_API_KEY: 'resend-key' })).toBe(false)
    expect(isPasswordRecoveryEnabled({
      RESEND_API_KEY: 'resend-key',
      RESEND_FROM_EMAIL: 'site@example.com',
    })).toBe(true)
  })

  it('leva a calibração ao contato quando nenhum serviço está publicado', () => {
    expect(calibrationCallToActionHref([])).toBe('/contato')
    expect(calibrationCallToActionHref([{ slug: 'calibracao-de-pressao' }])).toBe(
      '/servicos/calibracao-de-pressao',
    )
  })

  it('só permite conteúdo demonstrativo quando solicitado fora de produção', () => {
    expect(isDemoContentEnabled({ NODE_ENV: 'development' })).toBe(false)
    expect(isDemoContentEnabled({ NODE_ENV: 'development', ALLOW_DEMO_CONTENT: 'true' })).toBe(true)
    expect(isDemoContentEnabled({ NODE_ENV: 'production', ALLOW_DEMO_CONTENT: 'true' })).toBe(false)
    expect(isDemoContentEnabled({ VERCEL_ENV: 'production', ALLOW_DEMO_CONTENT: 'true' })).toBe(false)
  })
})
