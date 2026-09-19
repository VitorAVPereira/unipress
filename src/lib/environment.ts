const requiredProductionVariables = [
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
] as const

export function missingProductionEnvironment(env: Record<string, string | undefined>) {
  return requiredProductionVariables.filter((key) => !env[key]?.trim())
}

export function assertProductionEnvironment(env: Record<string, string | undefined> = process.env) {
  if (env.VERCEL_ENV !== 'production') return

  const missing = missingProductionEnvironment(env)
  if (missing.length > 0) {
    throw new Error(`Produção UniPress bloqueada: configure ${missing.join(', ')}.`)
  }
}
