import { del, list, type ListBlobResultBlob } from '@vercel/blob'
import { getPayload } from 'payload'

import config from '@payload-config'
import { findOrphanedCertificateBlobs, isCronAuthorized } from '@/lib/certificateCleanup'

export const runtime = 'nodejs'
export const maxDuration = 60

const ONE_HOUR_MS = 60 * 60 * 1000

export async function GET(request: Request) {
  if (!isCronAuthorized(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return Response.json({ error: 'Acesso negado.' }, { status: 401 })
  }

  const token = process.env.CERTIFICATES_BLOB_READ_WRITE_TOKEN
  if (!token) {
    return Response.json({ error: 'Armazenamento de certificados não configurado.' }, { status: 503 })
  }

  const payload = await getPayload({ config })
  const cutoff = new Date(Date.now() - ONE_HOUR_MS)
  let cursor: string | undefined
  let inspected = 0
  let removed = 0

  do {
    const page = await list({ cursor, limit: 1000, prefix: 'certificates/', token })
    inspected += page.blobs.length

    const oldBlobs = findOrphanedCertificateBlobs(
      page.blobs,
      new Set<string>(),
      cutoff,
    )
    const orphaned: ListBlobResultBlob[] = []

    for (const blob of oldBlobs) {
      const reference = await payload.find({
        collection: 'calibrations',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        where: { url: { equals: blob.url } },
      })
      if (reference.totalDocs === 0) orphaned.push(blob)
    }

    if (orphaned.length > 0) {
      await del(
        orphaned.map((blob) => blob.url),
        { token },
      )
      removed += orphaned.length
    }

    cursor = page.hasMore ? page.cursor : undefined
  } while (cursor)

  payload.logger.info({ inspected, removed }, 'Limpeza de uploads de certificados concluída')
  return Response.json({ inspected, removed })
}
