import config from '@payload-config'
import { headers } from 'next/headers'
import { createLocalReq, getPayload, type Payload, type PayloadRequest } from 'payload'

import type { Client } from '@/payload-types'
import { withClientAreaDiagnostics } from '@/lib/clientAreaDiagnostics'

export type ClientSessionContext = {
  client: Client
  payload: Payload
  req: PayloadRequest
}

export async function getClientSession(): Promise<ClientSessionContext | null> {
  const payload = await withClientAreaDiagnostics('session.initialize', () => getPayload({ config }))
  const requestHeaders = await headers()
  const auth = await withClientAreaDiagnostics('session.authenticate', () => payload.auth({ headers: requestHeaders }))
  const user = auth.user
  if (!user || user.collection !== 'clients' || user.status !== 'active') return null

  const req = await withClientAreaDiagnostics('session.request', () => createLocalReq({ user }, payload))
  return { client: user, payload, req }
}
