export function assertDemoSeedAllowed(environment = process.env.NODE_ENV) {
  if (environment === 'production' || process.env.VERCEL_ENV === 'production') {
    throw new Error('O seed demonstrativo está bloqueado em produção.')
  }
}
