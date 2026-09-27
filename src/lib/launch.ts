type Environment = Record<string, string | undefined>

function hasValues(environment: Environment, keys: string[]) {
  return keys.every((key) => Boolean(environment[key]?.trim()))
}

export function isContactFormEnabled(environment: Environment = process.env) {
  return hasValues(environment, [
    'RESEND_API_KEY',
    'RESEND_FROM_EMAIL',
    'CONTACT_TO_EMAIL',
    'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
    'TURNSTILE_SECRET_KEY',
  ])
}

export function isPasswordRecoveryEnabled(environment: Environment = process.env) {
  return hasValues(environment, ['RESEND_API_KEY', 'RESEND_FROM_EMAIL'])
}

export function isDemoContentEnabled(environment: Environment = process.env) {
  const production = environment.NODE_ENV === 'production' || environment.VERCEL_ENV === 'production'
  return !production && environment.ALLOW_DEMO_CONTENT === 'true'
}

export function calibrationCallToActionHref(services: { slug: string }[]) {
  const calibration = services.find((service) => service.slug === 'calibracao-de-pressao')
  return calibration ? `/servicos/${calibration.slug}` : '/contato'
}
