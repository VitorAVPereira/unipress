import { Resend } from 'resend'

import { processContactSubmission, statusForContactCode, type ContactPayload } from '@/lib/contact'

export const runtime = 'nodejs'

async function verifyTurnstile(token: string) {
  if (process.env.NODE_ENV !== 'production' && token === 'local-development') return true
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return false

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret, response: token }),
    signal: AbortSignal.timeout(5000),
  })
  if (!response.ok) return false
  const result = (await response.json()) as { success?: boolean }
  return result.success === true
}

async function deliverEmail(data: ContactPayload) {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_TO_EMAIL
  const from = process.env.RESEND_FROM_EMAIL

  if (!apiKey || !to || !from) {
    if (process.env.NODE_ENV !== 'production') return
    throw new Error('Contact email is not configured')
  }

  const resend = new Resend(apiKey)
  const result = await resend.emails.send({
    from,
    to,
    replyTo: data.email || undefined,
    subject: `[Site UniPress] ${data.subject.replace(/[\r\n]+/g, ' ')}`,
    text: [
      `Nome: ${data.name}`,
      `Empresa: ${data.company || 'Não informada'}`,
      `E-mail: ${data.email || 'Não informado'}`,
      `Telefone: ${data.phone || 'Não informado'}`,
      '',
      data.message,
    ].join('\n'),
  })

  if (result.error) throw new Error(result.error.message)
}

export async function POST(request: Request) {
  let input: unknown
  try {
    input = await request.json()
  } catch {
    return Response.json({ ok: false, code: 'validation' }, { status: 400 })
  }

  const result = await processContactSubmission(input, {
    verifyToken: verifyTurnstile,
    deliver: deliverEmail,
  })

  if (result.ok) return Response.json(result)
  const status = statusForContactCode(result.code)
  return Response.json(result, { status })
}
