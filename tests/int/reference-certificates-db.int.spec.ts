// @vitest-environment node

import config from '@/payload.config'
import { buildPublicReferenceStandards } from '@/lib/publicReferenceCertificates'
import { normalizeReferenceTag } from '@/lib/referenceCertificates'
import type { ReferenceCertificate, ReferenceStandard } from '@/payload-types'
import { sql } from '@payloadcms/db-postgres'
import { randomUUID } from 'node:crypto'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

const pdf = (name: string) => {
  const data = Buffer.from(`%PDF-1.4\n% UniPress integration fixture: ${name}\nxref\n0 1\n0000000000 65535 f \n%%EOF\n`)
  return { data, mimetype: 'application/pdf', name, size: data.length }
}

describe.sequential('certificados dos padrões no PostgreSQL', () => {
  let payload: Payload
  let adminID: number | undefined
  const standardIDs: number[] = []
  const certificateIDs: number[] = []
  const run = randomUUID().slice(0, 8)

  beforeAll(async () => {
    payload = await getPayload({ config })
    const admin = await payload.create({
      collection: 'users',
      data: {
        email: `certificados-padroes-${run}@unipress.test`,
        name: 'Teste certificados padrões',
        password: `Teste-${run}-seguro`,
      },
      overrideAccess: true,
    })
    adminID = admin.id
  })

  afterAll(async () => {
    if (!payload) return

    for (const id of certificateIDs.reverse()) {
      await payload.delete({
        collection: 'reference-certificates',
        id,
        context: { skipReferenceCertificateLifecycle: true },
        overrideAccess: true,
      }).catch(() => undefined)
    }
    for (const id of standardIDs.reverse()) {
      await payload.delete({ collection: 'reference-standards', id, overrideAccess: true }).catch(() => undefined)
    }
    if (adminID != null) {
      await payload.delete({ collection: 'users', id: adminID, overrideAccess: true }).catch(() => undefined)
    }
  })

  it('aplica unicidade de TAG normalizada no banco', async () => {
    const standard = await payload.create({
      collection: 'reference-standards',
      data: { tag: `PI-${run}-20`, searchKey: normalizeReferenceTag(`PI-${run}-20`), visible: true },
      overrideAccess: true,
    })
    standardIDs.push(standard.id)

    await expect(
      payload.create({
        collection: 'reference-standards',
        data: { tag: `PI ${run} 20`, searchKey: normalizeReferenceTag(`PI ${run} 20`), visible: true },
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })

  it('mantém rascunhos fora do público e substitui/promove o certificado atual', async () => {
    const standard = await payload.create({
      collection: 'reference-standards',
      data: { tag: `TAG-${run}-A`, searchKey: normalizeReferenceTag(`TAG-${run}-A`), visible: true },
      overrideAccess: true,
    })
    standardIDs.push(standard.id)

    const first = await payload.create({
      collection: 'reference-certificates',
      data: { standard: standard.id, year: 2024, isCurrent: true, _status: 'published' },
      file: pdf(`${run}-2024.pdf`),
      overrideAccess: true,
    })
    certificateIDs.push(first.id)

    await expect(
      payload.db.drizzle.execute(sql`
        INSERT INTO "reference_certificates" ("standard_id", "year", "is_current", "_status")
        VALUES (${standard.id}, 2023, true, 'published')
      `),
    ).rejects.toThrow()

    const draft = await payload.create({
      collection: 'reference-certificates',
      data: { standard: standard.id, year: 2026, isCurrent: true, _status: 'draft' },
      draft: true,
      file: pdf(`${run}-2026-rascunho.pdf`),
      overrideAccess: true,
    })
    certificateIDs.push(draft.id)

    const afterDraft = buildPublicReferenceStandards(
      [standard] as ReferenceStandard[],
      [first, draft] as ReferenceCertificate[],
    )
    expect(afterDraft[0]?.current.id).toBe(String(first.id))
    expect(afterDraft[0]?.history).toHaveLength(0)

    const second = await payload.create({
      collection: 'reference-certificates',
      data: { standard: standard.id, year: 2025, isCurrent: true, _status: 'published' },
      file: pdf(`${run}-2025.pdf`),
      overrideAccess: true,
    })
    certificateIDs.push(second.id)

    const replaced = await payload.find({
      collection: 'reference-certificates',
      depth: 0,
      limit: 10,
      overrideAccess: true,
      where: { standard: { equals: standard.id } },
    })
    expect(replaced.docs.find((doc) => doc.id === first.id)?.isCurrent).toBe(false)
    expect(replaced.docs.find((doc) => doc.id === second.id)?.isCurrent).toBe(true)

    await payload.delete({ collection: 'reference-certificates', id: second.id, overrideAccess: true })
    certificateIDs.splice(certificateIDs.indexOf(second.id), 1)

    const promoted = await payload.findByID({
      collection: 'reference-certificates',
      id: first.id,
      depth: 0,
      overrideAccess: true,
    })
    expect(promoted.isCurrent).toBe(true)
  })

  it('não torna uma TAG oculta pública e bloqueia leitura anônima das coleções', async () => {
    const hidden = await payload.create({
      collection: 'reference-standards',
      data: {
        tag: `TAG-${run}-OCULTA`,
        searchKey: normalizeReferenceTag(`TAG-${run}-OCULTA`),
        visible: false,
      },
      overrideAccess: true,
    })
    standardIDs.push(hidden.id)

    const certificate = await payload.create({
      collection: 'reference-certificates',
      data: { standard: hidden.id, year: 2025, isCurrent: true, _status: 'published' },
      file: pdf(`${run}-oculto.pdf`),
      overrideAccess: true,
    })
    certificateIDs.push(certificate.id)

    expect(
      buildPublicReferenceStandards(
        [hidden] as ReferenceStandard[],
        [certificate] as ReferenceCertificate[],
      ),
    ).toEqual([])

    await expect(
      payload.find({
        collection: 'reference-standards',
        overrideAccess: false,
        user: null,
      }),
    ).rejects.toThrow('not allowed')
    await expect(
      payload.find({
        collection: 'reference-certificates',
        overrideAccess: false,
        user: null,
      }),
    ).rejects.toThrow('not allowed')
  })
})
