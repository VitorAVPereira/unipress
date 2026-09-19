import { describe, expect, it } from 'vitest'

import { parseContactPayload, processContactSubmission, statusForContactCode } from '@/lib/contact'

const validPayload = {
  name: 'Ana Silva',
  company: 'Indústria Exemplo',
  email: 'ana@example.com',
  phone: '',
  subject: 'Calibração de pressão',
  message: 'Preciso calibrar dois manômetros industriais.',
  consent: true,
  turnstileToken: 'token-valido',
  website: '',
}

describe('contato', () => {
  it('aceita ao menos um canal de retorno', () => {
    const result = parseContactPayload(validPayload)

    expect(result.success).toBe(true)
  })

  it('rejeita quando email e telefone estão vazios', () => {
    const result = parseContactPayload({ ...validPayload, email: '', phone: '' })

    expect(result.success).toBe(false)
  })

  it('rejeita submissões capturadas pelo honeypot', () => {
    const result = parseContactPayload({ ...validPayload, website: 'https://spam.example' })

    expect(result.success).toBe(false)
  })

  it('rejeita ausência de consentimento', () => {
    const result = parseContactPayload({ ...validPayload, consent: false })

    expect(result.success).toBe(false)
  })
})

describe('processamento do contato', () => {
  const deliver = async () => undefined

  it('entrega uma solicitação válida após verificar o token', async () => {
    const result = await processContactSubmission(validPayload, {
      verifyToken: async () => true,
      deliver,
    })

    expect(result).toEqual({ ok: true })
  })

  it('retorna um código público de validação', async () => {
    const result = await processContactSubmission({ ...validPayload, email: '', phone: '' }, {
      verifyToken: async () => true,
      deliver,
    })

    expect(result).toEqual({ ok: false, code: 'validation' })
  })

  it('rejeita token inválido como spam', async () => {
    const result = await processContactSubmission(validPayload, {
      verifyToken: async () => false,
      deliver,
    })

    expect(result).toEqual({ ok: false, code: 'spam' })
  })

  it('oculta detalhes internos de falha do provedor', async () => {
    const result = await processContactSubmission(validPayload, {
      verifyToken: async () => true,
      deliver: async () => { throw new Error('provider secret') },
    })

    expect(result).toEqual({ ok: false, code: 'delivery_failed' })
  })
})

describe('status HTTP do contato', () => {
  it.each([
    ['validation', 400],
    ['spam', 403],
    ['delivery_failed', 502],
  ] as const)('mapeia %s para %s', (code, status) => {
    expect(statusForContactCode(code)).toBe(status)
  })
})
