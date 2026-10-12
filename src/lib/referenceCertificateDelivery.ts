import config from '@payload-config'
import { get } from '@vercel/blob'
import { readFile } from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'

import type { ReferenceStandard } from '@/payload-types'

export type ReferenceCertificateDisposition = 'attachment' | 'inline'

export type DeliverableReferenceCertificate = {
  filename: string
  url?: string
}

function safeFilename(filename: string): string {
  return path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_') || 'certificado.pdf'
}

export function referenceCertificateResponseHeaders(
  filename: string,
  disposition: ReferenceCertificateDisposition,
): Headers {
  return new Headers({
    'Cache-Control': 'private, no-store',
    'Content-Disposition': `${disposition}; filename="${safeFilename(filename)}"`,
    'Content-Type': 'application/pdf',
    'X-Content-Type-Options': 'nosniff',
  })
}

function notFoundResponse() {
  return new Response('Não encontrado.', {
    status: 404,
    headers: { 'Cache-Control': 'private, no-store' },
  })
}

function unavailableResponse() {
  return new Response('Certificado temporariamente indisponível. Tente novamente em instantes.', {
    status: 503,
    headers: {
      'Cache-Control': 'private, no-store',
      'Retry-After': '30',
    },
  })
}

export async function getDeliverableReferenceCertificate(
  id: string,
): Promise<DeliverableReferenceCertificate | null> {
  try {
    const payload = await getPayload({ config })
    const certificate = await payload.findByID({
      collection: 'reference-certificates',
      id,
      depth: 1,
      overrideAccess: true,
    })

    if (
      certificate._status !== 'published' ||
      certificate.mimeType !== 'application/pdf' ||
      !certificate.filename
    ) {
      return null
    }

    const standard: ReferenceStandard = typeof certificate.standard === 'object'
      ? certificate.standard
      : await payload.findByID({
          collection: 'reference-standards',
          id: certificate.standard,
          depth: 0,
          overrideAccess: true,
        })
    if (!standard.visible) return null

    return {
      filename: certificate.filename,
      url: certificate.url || undefined,
    }
  } catch {
    return null
  }
}

async function localCertificateResponse(
  certificate: DeliverableReferenceCertificate,
  disposition: ReferenceCertificateDisposition,
) {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
    return unavailableResponse()
  }

  const localRoot = path.resolve(process.cwd(), 'storage/reference-certificates')
  const localPath = path.resolve(localRoot, path.basename(certificate.filename))
  if (!localPath.startsWith(`${localRoot}${path.sep}`)) return notFoundResponse()

  try {
    const file = await readFile(localPath)
    return new Response(file, { headers: referenceCertificateResponseHeaders(certificate.filename, disposition) })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return notFoundResponse()
    console.error('Falha ao recuperar certificado local do padrão', { err: error })
    return unavailableResponse()
  }
}

export async function deliverReferenceCertificate(
  id: string,
  disposition: ReferenceCertificateDisposition,
): Promise<Response> {
  const certificate = await getDeliverableReferenceCertificate(id)
  if (!certificate) return notFoundResponse()

  const token = process.env.STANDARDS_BLOB_READ_WRITE_TOKEN
  if (!token) return localCertificateResponse(certificate, disposition)
  if (!certificate.url) return notFoundResponse()

  try {
    const result = await get(certificate.url, { access: 'private', token, useCache: false })
    if (!result) return notFoundResponse()
    if (result.statusCode !== 200) return unavailableResponse()
    return new Response(result.stream, {
      headers: referenceCertificateResponseHeaders(certificate.filename, disposition),
    })
  } catch (error) {
    console.error('Falha temporária ao recuperar certificado do padrão', {
      certificateID: id,
      err: error,
    })
    return unavailableResponse()
  }
}
