// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { blobGet, findByID, readFile } = vi.hoisted(() => ({
  blobGet: vi.fn(),
  findByID: vi.fn(),
  readFile: vi.fn(),
}))

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', async (importOriginal) => {
  const actual = await importOriginal<typeof import('payload')>()
  return { ...actual, getPayload: async () => ({ findByID }) }
})
vi.mock('@vercel/blob', () => ({ get: blobGet }))
vi.mock('fs/promises', async (importOriginal) => ({
  ...(await importOriginal<typeof import('fs/promises')>()),
  readFile,
}))

import {
  deliverReferenceCertificate,
  getDeliverableReferenceCertificate,
  referenceCertificateResponseHeaders,
} from '@/lib/referenceCertificateDelivery'

const publishedCertificate = (overrides: Record<string, unknown> = {}) => ({
  id: 12,
  standard: { id: 5, tag: 'PI-20', searchKey: 'pi20', visible: true },
  year: 2026,
  isCurrent: true,
  _status: 'published',
  filename: 'certificado-pi-20.pdf',
  mimeType: 'application/pdf',
  url: 'https://private.blob.example/reference-certificates/secret.pdf',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

describe('entrega pública controlada dos certificados dos padrões', () => {
  const originalToken = process.env.STANDARDS_BLOB_READ_WRITE_TOKEN

  beforeEach(() => {
    blobGet.mockReset()
    findByID.mockReset()
    readFile.mockReset()
    process.env.STANDARDS_BLOB_READ_WRITE_TOKEN = 'blob-secret-token'
  })

  afterEach(() => {
    if (originalToken == null) delete process.env.STANDARDS_BLOB_READ_WRITE_TOKEN
    else process.env.STANDARDS_BLOB_READ_WRITE_TOKEN = originalToken
    vi.restoreAllMocks()
  })

  it('sanitiza o nome e diferencia visualização de download sem cache', () => {
    const inline = referenceCertificateResponseHeaders('certificado"\r\n.pdf', 'inline')
    const attachment = referenceCertificateResponseHeaders('certificado"\r\n.pdf', 'attachment')

    expect(inline.get('cache-control')).toBe('private, no-store')
    expect(inline.get('content-type')).toBe('application/pdf')
    expect(inline.get('content-disposition')).toBe('inline; filename="certificado___.pdf"')
    expect(inline.get('x-content-type-options')).toBe('nosniff')
    expect(attachment.get('content-disposition')).toBe('attachment; filename="certificado___.pdf"')
  })

  it('transmite um PDF privado sem revelar a URL do Blob', async () => {
    findByID.mockResolvedValueOnce(publishedCertificate())
    blobGet.mockResolvedValueOnce({
      statusCode: 200,
      stream: new ReadableStream({ start: (controller) => { controller.enqueue(new TextEncoder().encode('%PDF-test')); controller.close() } }),
    })

    const response = await deliverReferenceCertificate('12', 'inline')

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('%PDF-test')
    expect(response.headers.get('content-disposition')).toBe('inline; filename="certificado-pi-20.pdf"')
    expect([...response.headers.entries()].join(' ')).not.toContain('private.blob.example')
    expect(blobGet).toHaveBeenCalledWith(
      'https://private.blob.example/reference-certificates/secret.pdf',
      { access: 'private', token: 'blob-secret-token', useCache: false },
    )
  })

  it('transmite o arquivo local somente fora de produção', async () => {
    delete process.env.STANDARDS_BLOB_READ_WRITE_TOKEN
    findByID.mockResolvedValueOnce(publishedCertificate({ url: null, filename: '../../certificado-local.pdf' }))
    readFile.mockResolvedValueOnce(Buffer.from('%PDF-local'))

    const response = await deliverReferenceCertificate('12', 'attachment')

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('%PDF-local')
    expect(response.headers.get('content-disposition')).toBe('attachment; filename="certificado-local.pdf"')
    expect(String(readFile.mock.calls[0][0])).toMatch(/storage[\\/]reference-certificates[\\/]certificado-local\.pdf$/)
  })

  it.each([
    ['rascunho', publishedCertificate({ _status: 'draft' })],
    ['TAG oculta', publishedCertificate({ standard: { id: 5, visible: false } })],
    ['arquivo ausente', publishedCertificate({ filename: null })],
    ['MIME incorreto', publishedCertificate({ mimeType: 'image/png' })],
    ['registro inexistente', null],
  ])('retorna 404 para %s sem revelar a existência anterior', async (_label, document) => {
    findByID.mockResolvedValueOnce(document)

    const response = await deliverReferenceCertificate('12', 'inline')

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Não encontrado.')
    expect([...response.headers.entries()].join(' ')).not.toContain('private.blob.example')
  })

  it('resolve relacionamento numérico antes de autorizar a entrega', async () => {
    findByID
      .mockResolvedValueOnce(publishedCertificate({ standard: 5 }))
      .mockResolvedValueOnce({ id: 5, tag: 'PI-20', searchKey: 'pi20', visible: true })

    await expect(getDeliverableReferenceCertificate('12')).resolves.toMatchObject({ filename: 'certificado-pi-20.pdf' })
  })

  it('retorna 503 genérico e registra falha temporária do Blob somente no servidor', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    findByID.mockResolvedValueOnce(publishedCertificate())
    blobGet.mockRejectedValueOnce(new Error('upstream private detail'))

    const response = await deliverReferenceCertificate('12', 'inline')
    const body = await response.text()

    expect(response.status).toBe(503)
    expect(response.headers.get('retry-after')).toBe('30')
    expect(body).toBe('Certificado temporariamente indisponível. Tente novamente em instantes.')
    expect(body).not.toContain('upstream private detail')
    expect(consoleError).toHaveBeenCalledOnce()
  })
})
