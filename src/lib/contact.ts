export type ContactPayload = {
  name: string
  company?: string
  email?: string
  phone?: string
  subject: string
  message: string
  consent: boolean
  turnstileToken: string
  website?: string
}

export type ContactParseResult =
  | { success: true; data: ContactPayload }
  | { success: false; issues: string[] }

export type ContactProcessResult =
  | { ok: true }
  | { ok: false; code: 'validation' | 'spam' | 'delivery_failed' }

export type ContactErrorCode = Exclude<ContactProcessResult, { ok: true }>['code']

export type ContactDependencies = {
  verifyToken: (token: string) => Promise<boolean>
  deliver: (data: ContactPayload) => Promise<void>
}

export function parseContactPayload(_input: unknown): ContactParseResult {
  const input = _input as Partial<ContactPayload> | null
  const issues: string[] = []

  if (!input || typeof input !== 'object') return { success: false, issues: ['invalid_payload'] }

  const clean = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
  const data: ContactPayload = {
    name: clean(input.name),
    company: clean(input.company),
    email: clean(input.email),
    phone: clean(input.phone),
    subject: clean(input.subject),
    message: clean(input.message),
    consent: input.consent === true,
    turnstileToken: clean(input.turnstileToken),
    website: clean(input.website),
  }

  if (data.name.length < 2) issues.push('name')
  if (data.name.length > 120) issues.push('name')
  if (!data.email && !data.phone) issues.push('contact_channel')
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) issues.push('email')
  if (data.subject.length < 3) issues.push('subject')
  if (data.subject.length > 160) issues.push('subject')
  if (data.message.length < 10) issues.push('message')
  if (data.message.length > 5000) issues.push('message')
  if (!data.consent) issues.push('consent')
  if (!data.turnstileToken) issues.push('turnstile')
  if (data.website) issues.push('honeypot')

  return issues.length === 0 ? { success: true, data } : { success: false, issues }
}

export async function processContactSubmission(
  input: unknown,
  dependencies: ContactDependencies,
): Promise<ContactProcessResult> {
  const parsed = parseContactPayload(input)
  if (!parsed.success) {
    return { ok: false, code: parsed.issues.includes('honeypot') ? 'spam' : 'validation' }
  }

  if (!(await dependencies.verifyToken(parsed.data.turnstileToken))) {
    return { ok: false, code: 'spam' }
  }

  try {
    await dependencies.deliver(parsed.data)
    return { ok: true }
  } catch {
    return { ok: false, code: 'delivery_failed' }
  }
}

export function statusForContactCode(code: ContactErrorCode) {
  if (code === 'validation') return 400
  if (code === 'spam') return 403
  return 502
}
