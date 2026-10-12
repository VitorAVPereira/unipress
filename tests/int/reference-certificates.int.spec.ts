import { describe, expect, it } from 'vitest'

import { ReferenceCertificates } from '@/collections/ReferenceCertificates'
import { ReferenceStandards } from '@/collections/ReferenceStandards'
import {
  ensurePublishedReferenceCertificateHasCurrent,
  promoteReferenceCertificateAfterDelete,
  syncCurrentReferenceCertificate,
} from '@/hooks/referenceCertificates'
import {
  MAX_REFERENCE_CERTIFICATE_FILE_SIZE,
  REFERENCE_CERTIFICATES_BLOB_PREFIX,
  normalizeReferenceTag,
  selectReplacementReferenceCertificate,
  validateReferenceCertificateUpload,
  validateReferenceCertificateYear,
  validateReferenceTag,
} from '@/lib/referenceCertificates'

type StoredCertificate = {
  id: number
  standard: number
  year: number
  isCurrent: boolean
  _status: 'draft' | 'published'
  createdAt: string
  filename: string
  mimeType: 'application/pdf'
}

function lifecycleHarness(initial: StoredCertificate[], context: Record<string, unknown> = {}) {
  const state = initial.map((doc) => ({ ...doc }))
  const relationValue = (value: unknown) =>
    typeof value === 'object' && value && 'id' in value ? (value as { id: unknown }).id : value
  const matches = (doc: Record<string, unknown>, where: Record<string, unknown> | undefined): boolean => {
    if (!where) return true
    if (Array.isArray(where.and)) return where.and.every((clause) => matches(doc, clause as Record<string, unknown>))
    return Object.entries(where).every(([field, rawCondition]) => {
      if (field === 'and') return true
      const condition = rawCondition as { equals?: unknown; exists?: boolean; not_equals?: unknown }
      const value = relationValue(doc[field])
      if ('equals' in condition) return value === condition.equals
      if ('not_equals' in condition) return value !== condition.not_equals
      if ('exists' in condition) return condition.exists ? value != null : value == null
      return true
    })
  }

  const req = {
    context,
    payload: {
      find: async ({ where }: { where?: Record<string, unknown> }) => ({
        docs: state.filter((doc) => matches(doc, where)),
        hasNextPage: false,
      }),
      update: async ({ data, id }: { data: Partial<StoredCertificate>; id: number }) => {
        const index = state.findIndex((doc) => doc.id === id)
        if (index >= 0) state[index] = { ...state[index], ...data }
        return state[index]
      },
    },
  }

  return { req: req as never, state }
}

const certificate = (overrides: Partial<StoredCertificate>): StoredCertificate => ({
  id: 1,
  standard: 10,
  year: 2025,
  isCurrent: false,
  _status: 'published',
  createdAt: '2025-01-01T00:00:00.000Z',
  filename: 'certificado.pdf',
  mimeType: 'application/pdf',
  ...overrides,
})

describe('certificados dos padrões', () => {
  it('normaliza TAGs para busca e unicidade', () => {
    expect(normalizeReferenceTag('PI-20')).toBe('pi20')
    expect(normalizeReferenceTag('PI 20')).toBe('pi20')
    expect(normalizeReferenceTag('pí.20')).toBe('pi20')
  })

  it('rejeita TAG vazia depois da normalização', () => {
    expect(validateReferenceTag('---')).toBe('Informe uma TAG com letras ou números.')
    expect(validateReferenceTag(' PI-20 ')).toBe(true)
  })

  it('aceita somente ano inteiro de quatro dígitos', () => {
    expect(validateReferenceCertificateYear(2026)).toBe(true)
    expect(validateReferenceCertificateYear(1899)).toBe('Informe um ano com quatro dígitos.')
    expect(validateReferenceCertificateYear(2026.5)).toBe('Informe um ano com quatro dígitos.')
    expect(validateReferenceCertificateYear('2026')).toBe('Informe um ano com quatro dígitos.')
  })

  it('aceita somente PDF de até 20 MB', () => {
    expect(validateReferenceCertificateUpload('application/pdf', MAX_REFERENCE_CERTIFICATE_FILE_SIZE)).toBe(true)
    expect(validateReferenceCertificateUpload('image/png', 100)).toBe('Envie um arquivo PDF.')
    expect(
      validateReferenceCertificateUpload('application/pdf', MAX_REFERENCE_CERTIFICATE_FILE_SIZE + 1),
    ).toBe('O PDF deve ter no máximo 20 MB.')
  })

  it('registra as coleções administrativas', () => {
    const accessArgs = (user: unknown) => ({ req: { user } }) as never

    for (const collection of [ReferenceStandards, ReferenceCertificates]) {
      expect(collection.admin?.group).toBe('Certificados dos padrões')
      expect(collection.access?.create?.(accessArgs({ id: 1, collection: 'users' }))).toBe(true)
      expect(collection.access?.read?.(accessArgs(null))).toBe(false)
      expect(collection.access?.update?.(accessArgs({ id: 2, collection: 'clients' }))).toBe(false)
      expect(collection.access?.delete?.(accessArgs(null))).toBe(false)
    }

    expect(ReferenceCertificates.upload).toMatchObject({
      bulkUpload: false,
      mimeTypes: ['application/pdf'],
      pasteURL: false,
      staticDir: 'storage/reference-certificates',
    })
    expect(REFERENCE_CERTIFICATES_BLOB_PREFIX).toBe('reference-certificates')
  })

  it('seleciona a reposição por ano, criação e ID de forma determinística', () => {
    const selected = selectReplacementReferenceCertificate([
      certificate({ id: 4, year: 2025, createdAt: '2026-01-01T00:00:00.000Z' }),
      certificate({ id: 2, year: 2026, createdAt: '2026-02-01T00:00:00.000Z' }),
      certificate({ id: 3, year: 2026, createdAt: '2026-02-01T00:00:00.000Z' }),
    ])

    expect(selected?.id).toBe(3)
  })

  it('não altera o atual publicado quando o novo atual ainda é rascunho', async () => {
    const current = certificate({ id: 1, isCurrent: true })
    const draft = certificate({ id: 2, isCurrent: true, _status: 'draft', year: 2026 })
    const { req, state } = lifecycleHarness([current, draft])

    await syncCurrentReferenceCertificate({ doc: draft, operation: 'update', req } as never)

    expect(state).toEqual([current, draft])
  })

  it('recusa o primeiro certificado publicado sem marcar como atual', async () => {
    const first = certificate({ id: 1, isCurrent: false })
    const { req } = lifecycleHarness([])

    await expect(
      ensurePublishedReferenceCertificateHasCurrent({
        data: first,
        operation: 'create',
        originalDoc: undefined,
        req,
      } as never),
    ).rejects.toThrow('Marque o primeiro certificado publicado desta TAG como atual.')
  })

  it('desmarca o atual anterior antes de gravar um novo atual publicado', async () => {
    const previous = certificate({ id: 1, standard: 10, isCurrent: true })
    const next = certificate({ id: 2, standard: 10, year: 2026, isCurrent: true })
    const { req, state } = lifecycleHarness([previous])

    await ensurePublishedReferenceCertificateHasCurrent({
      data: next,
      operation: 'create',
      originalDoc: undefined,
      req,
    } as never)

    expect(state[0].isCurrent).toBe(false)
  })

  it('publicar um atual desmarca somente o anterior publicado da mesma TAG', async () => {
    const previous = certificate({ id: 1, standard: 10, isCurrent: true })
    const next = certificate({ id: 2, standard: 10, year: 2026, isCurrent: true })
    const anotherStandard = certificate({ id: 3, standard: 20, isCurrent: true })
    const sameStandardDraft = certificate({ id: 4, standard: 10, _status: 'draft', isCurrent: true })
    const { req, state } = lifecycleHarness([previous, next, anotherStandard, sameStandardDraft])

    await syncCurrentReferenceCertificate({ doc: next, operation: 'update', req } as never)

    expect(state.find((doc) => doc.id === 1)?.isCurrent).toBe(false)
    expect(state.find((doc) => doc.id === 2)?.isCurrent).toBe(true)
    expect(state.find((doc) => doc.id === 3)?.isCurrent).toBe(true)
    expect(state.find((doc) => doc.id === 4)?.isCurrent).toBe(true)
  })

  it('despublicar, desmarcar ou excluir o atual promove o publicado mais recente', async () => {
    for (const transition of ['unpublish', 'uncheck', 'delete'] as const) {
      const current = certificate({ id: 1, year: 2026, isCurrent: true })
      const older = certificate({ id: 2, year: 2024 })
      const replacement = certificate({ id: 3, year: 2025, createdAt: '2026-03-01T00:00:00.000Z' })
      const draft = certificate({ id: 4, year: 2027, _status: 'draft' })
      const startingState = transition === 'delete' ? [older, replacement, draft] : [current, older, replacement, draft]
      const { req, state } = lifecycleHarness(startingState)

      if (transition === 'delete') {
        await promoteReferenceCertificateAfterDelete({ doc: current, req } as never)
      } else {
        const changed = {
          ...current,
          _status: transition === 'unpublish' ? ('draft' as const) : current._status,
          isCurrent: transition === 'uncheck' ? false : current.isCurrent,
        }
        Object.assign(state.find((doc) => doc.id === current.id)!, changed)
        await syncCurrentReferenceCertificate({ doc: changed, previousDoc: current, operation: 'update', req } as never)
      }

      expect(state.find((doc) => doc.id === 3)?.isCurrent, transition).toBe(true)
      expect(state.find((doc) => doc.id === 2)?.isCurrent, transition).toBe(false)
      expect(state.find((doc) => doc.id === 4)?.isCurrent, transition).toBe(false)
    }
  })

  it('não cria reposição inexistente e respeita o contexto antirrecursão', async () => {
    const current = certificate({ id: 1, isCurrent: true })
    const emptyHarness = lifecycleHarness([])
    await expect(
      promoteReferenceCertificateAfterDelete({ doc: current, req: emptyHarness.req } as never),
    ).resolves.toEqual(current)
    expect(emptyHarness.state).toEqual([])

    const previous = certificate({ id: 2, isCurrent: true })
    const next = certificate({ id: 3, year: 2026, isCurrent: true })
    const skipped = lifecycleHarness([previous, next], { skipReferenceCertificateLifecycle: true })
    await syncCurrentReferenceCertificate({ doc: next, operation: 'update', req: skipped.req } as never)
    expect(skipped.state).toEqual([previous, next])
  })
})
