import config from '@payload-config'
import { headers } from 'next/headers'
import { createLocalReq, getPayload, type Payload, type PayloadRequest } from 'payload'

import type { Client } from '@/payload-types'

export type ClientSessionContext = {
  client: Client
  payload: Payload
  req: PayloadRequest
}

export async function getClientSession(): Promise<ClientSessionContext | null> {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ headers: await headers() })
  const user = auth.user
  if (!user || user.collection !== 'clients' || user.status !== 'active') return null

  const req = await createLocalReq({ user }, payload)
  return { client: user, payload, req }
}
