import config from '@payload-config'
import { get } from '@vercel/blob'
import { readFile } from 'fs/promises'
import path from 'path'
import { createLocalReq, getPayload, type PayloadRequest } from 'payload'

import { certificateResponseHeaders } from '@/lib/clientPortal'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, context: RouteContext<'/area-do-cliente/certificados/[id]/pdf'>) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ headers: request.headers, req: request as PayloadRequest })
  const user = auth.user
  if (!user || user.collection !== 'clients' || user.status !== 'active') return new Response('Não encontrado.', { status: 404 })

  const { id } = await context.params
  const req = await createLocalReq({ user }, payload)
  let calibrationAccess
  try {
    calibrationAccess = await payload.findByID({ collection: 'calibrations', id, depth: 0, overrideAccess: false, req })
  } catch {
    return new Response('Não encontrado.', { status: 404 })
  }
  if (!calibrationAccess) return new Response('Não encontrado.', { status: 404 })
  const calibration = await payload.findByID({ collection: 'calibrations', id, depth: 0, overrideAccess: true })
  if (!calibration.filename || calibration.mimeType !== 'application/pdf') return new Response('Não encontrado.', { status: 404 })

  const headers = certificateResponseHeaders(calibration.filename)
  const token = process.env.CERTIFICATES_BLOB_READ_WRITE_TOKEN
  if (token && calibration.url) {
    const result = await get(calibration.url, { access: 'private', token, useCache: false })
    if (!result || result.statusCode !== 200) return new Response('Não encontrado.', { status: 404 })
    return new Response(result.stream, { headers })
  }

  const localRoot = path.resolve(process.cwd(), 'public/calibrations')
  const localPath = path.resolve(localRoot, path.basename(calibration.filename))
  if (!localPath.startsWith(`${localRoot}${path.sep}`)) return new Response('Não encontrado.', { status: 404 })
  try {
    const file = await readFile(localPath)
    return new Response(file, { headers })
  } catch {
    return new Response('Não encontrado.', { status: 404 })
  }
}
