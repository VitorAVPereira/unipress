import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  send: vi.fn().mockResolvedValue({ data: { id: 'email-id' }, error: null }),
  getSiteSettings: vi.fn().mockResolvedValue({ email: 'comercial@example.com' }),
}))

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: mocks.send }
  },
}))

vi.mock('@/lib/cms', () => ({
  getSiteSettings: mocks.getSiteSettings,
}))

import { POST } from '@/app/(frontend)/api/contact/route'

describe('rota de contato', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('envia para o e-mail definido no admin', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('RESEND_API_KEY', 'resend-key')
    vi.stubEnv('RESEND_FROM_EMAIL', 'site@example.com')

    const response = await POST(new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ana Silva',
        company: 'Indústria Exemplo',
        email: 'ana@example.com',
        phone: '',
        cellphone: '(11) 99999-1234',
        cnpj: '12.345.678/0001-90',
        subject: 'Consulta de produto',
        message: 'Preciso de informações sobre um produto.',
        consent: true,
        turnstileToken: 'local-development',
        website: '',
      }),
    }))

    expect(response.status).toBe(200)
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({
      to: 'comercial@example.com',
      replyTo: 'ana@example.com',
      text: expect.stringContaining('CNPJ: 12.345.678/0001-90'),
    }))
    expect(mocks.send.mock.calls[0][0].text).toContain('Celular: (11) 99999-1234')
  })
})
