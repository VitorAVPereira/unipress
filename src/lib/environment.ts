const requiredProductionVariables = [
  'DATABASE_URL',
  'PAYLOAD_SECRET',
  'CRON_SECRET',
  'PREVIEW_SECRET',
  'NEXT_PUBLIC_SERVER_URL',
  'NEXT_PUBLIC_WHATSAPP_NUMBER',
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
