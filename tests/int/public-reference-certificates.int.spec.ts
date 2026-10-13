import { beforeEach, describe, expect, it, vi } from 'vitest'

const { find, loggerError } = vi.hoisted(() => ({
  find: vi.fn(),
  loggerError: vi.fn(),
}))

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', async (importOriginal) => {
  const actual = await importOriginal<typeof import('payload')>()
  return {
    ...actual,
    getPayload: async () => ({ find, logger: { error: loggerError } }),
  }
})

import {
  buildPublicReferenceStandards,
  getPublicReferenceStandards,
} from '@/lib/publicReferenceCertificates'

const standards = [
  { id: 10, tag: 'PAD-10', searchKey: 'pad10', visible: true },
  { id: 2, tag: 'PAD-2', searchKey: 'pad2', visible: true },
  { id: 30, tag: 'OCULTO-1', searchKey: 'oculto1', visible: false },
  { id: 40, tag: 'SEM-PDF', searchKey: 'sempdf', visible: true },
]

const certificates = [
  {
    id: 100,
    standard: 10,
    year: 2026,
    isCurrent: false,
    _status: 'published',
    createdAt: '2026-01-10T00:00:00.000Z',
    filename: 'pad10-antigo.pdf',
    mimeType: 'application/pdf',
    url: 'https://blob.example/segredo-antigo.pdf',
    filesize: 123,
    client: { legalName: 'não deve aparecer' },
  },
  {
    id: 101,
    standard: 10,
    year: 2026,
    isCurrent: true,
    _status: 'published',
    createdAt: '2026-02-10T00:00:00.000Z',
    filename: 'pad10-atual.pdf',
    mimeType: 'application/pdf',
    url: 'https://blob.example/segredo-atual.pdf',
    filesize: 456,
  },
  {
    id: 102,
    standard: 10,
    year: 2027,
    isCurrent: true,
    _status: 'draft',
    createdAt: '2027-01-01T00:00:00.000Z',
    filename: 'rascunho.pdf',
    mimeType: 'application/pdf',
  },
  {
    id: 200,
    standard: 2,
    year: 2025,
    isCurrent: true,
    _status: 'published',
    createdAt: '2025-01-01T00:00:00.000Z',
    filename: 'pad2.pdf',
    mimeType: 'application/pdf',
  },
  {
    id: 300,
    standard: 30,
    year: 2026,
    isCurrent: true,
    _status: 'published',
    createdAt: '2026-01-01T00:00:00.000Z',
    filename: 'oculto.pdf',
    mimeType: 'application/pdf',
  },
]

describe('modelo público dos certificados dos padrões', () => {
  beforeEach(() => {
    find.mockReset()
    loggerError.mockReset()
  })

  it('filtra conteúdo privado e produz histórico estável em ordem natural', () => {
    const result = buildPublicReferenceStandards(standards as never, certificates as never)

    expect(result.map((standard) => standard.tag)).toEqual(['PAD-2', 'PAD-10'])
    expect(result[0]).toEqual({
      id: '2',
      tag: 'PAD-2',
      searchKey: 'pad2',
      current: {
        id: '200',
        year: 2025,
        label: 'Certificado 2025',
        isCurrent: true,
        viewHref: '/certificados-padroes/200/visualizar',
        downloadHref: '/certificados-padroes/200/baixar',
      },
      history: [],
    })
    expect(result[1].current.label).toBe('Certificado 2026 — 2/2')
    expect(result[1].history.map((item) => item.label)).toEqual(['Certificado 2026 — 1/2'])
    expect(JSON.stringify(result)).not.toMatch(/blob\.example|filename|filesize|legalName|client/)
  })

  it('consulta somente padrões visíveis e certificados publicados', async () => {
    find
      .mockResolvedValueOnce({ docs: standards.filter((standard) => standard.visible) })
      .mockResolvedValueOnce({ docs: certificates.filter((certificate) => certificate._status === 'published') })

    const result = await getPublicReferenceStandards()

    expect(result.map((standard) => standard.tag)).toEqual(['PAD-2', 'PAD-10'])
    expect(find).toHaveBeenNthCalledWith(1, expect.objectContaining({
      collection: 'reference-standards',
      depth: 0,
      limit: 100,
      overrideAccess: true,
      where: { visible: { equals: true } },
    }))
    expect(find).toHaveBeenNthCalledWith(2, expect.objectContaining({
      collection: 'reference-certificates',
      depth: 0,
      limit: 500,
      overrideAccess: true,
      where: { _status: { equals: 'published' } },
    }))
  })

  it('retorna lista vazia quando a infraestrutura está indisponível', async () => {
    find.mockRejectedValueOnce(new Error('database unavailable'))

    await expect(getPublicReferenceStandards()).resolves.toEqual([])
    expect(loggerError).toHaveBeenCalledOnce()
  })

  it('ignora certificados órfãos sem ocultar as outras TAGs', () => {
    const orphan = { ...certificates[0], id: 999, standard: null }

    const result = buildPublicReferenceStandards(
      standards as never,
      [...certificates, orphan] as never,
    )

    expect(result.map((standard) => standard.tag)).toEqual(['PAD-2', 'PAD-10'])
  })
})
