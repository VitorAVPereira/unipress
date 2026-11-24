import type { Instrumentation } from 'next'

import { reportClientAreaError } from './lib/clientAreaDiagnostics'

export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  const pathname = request.path.split('?')[0]
  if (pathname !== '/area-do-cliente' && !pathname.startsWith('/area-do-cliente/')) return

  // Only the route type is recorded; URLs can contain password-reset tokens.
  reportClientAreaError(`next.${context.routeType}`, error)
}
