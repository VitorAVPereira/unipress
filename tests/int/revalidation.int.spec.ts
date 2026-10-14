import { beforeEach, describe, expect, it, vi } from 'vitest'

const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }))

vi.mock('next/cache', () => ({ revalidatePath }))

import {
  revalidateDeletedReferenceCertificate,
  revalidateReferenceCertificate,
  revalidateReferenceStandard,
  revalidateProduct,
  revalidateService,
} from '@/hooks/revalidateContent'

describe('revalidação do conteúdo público', () => {
  beforeEach(() => revalidatePath.mockClear())

  it('não revalida durante a criação automática de um rascunho de produto', async () => {
    await revalidateProduct({
      doc: { _status: 'draft', slug: undefined },
      previousDoc: undefined,
      req: { context: {} },
    } as never)

    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('não revalida durante a criação automática de um rascunho de serviço', async () => {
    await revalidateService({
      doc: { _status: 'draft', slug: undefined },
      previousDoc: undefined,
      req: { context: {} },
    } as never)

    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('continua revalidando alterações em conteúdo publicado', async () => {
    await revalidateProduct({
      doc: { _status: 'published', slug: 'produto-publicado' },
      previousDoc: { _status: 'draft' },
      req: { context: {} },
    } as never)

    expect(revalidatePath).toHaveBeenCalledWith('/')
    expect(revalidatePath).toHaveBeenCalledWith('/produtos/produto-publicado')
  })

  it('não revalida rascunho isolado de certificado de padrão', async () => {
    await revalidateReferenceCertificate({
      doc: { _status: 'draft', isCurrent: true },
      previousDoc: undefined,
      req: { context: {} },
    } as never)

    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('revalida a página após mudanças públicas de certificado ou padrão', async () => {
    await revalidateReferenceCertificate({
      doc: { _status: 'published', isCurrent: true },
      previousDoc: { _status: 'draft' },
      req: { context: {} },
    } as never)
    await revalidateDeletedReferenceCertificate({
      doc: { _status: 'published' },
      req: { context: {} },
    } as never)
    await revalidateReferenceStandard({
      doc: { visible: false, tag: 'PI-20' },
      previousDoc: { visible: true, tag: 'PI-20' },
      req: { context: {} },
    } as never)

    expect(revalidatePath).toHaveBeenCalledTimes(3)
    expect(revalidatePath).toHaveBeenNthCalledWith(1, '/certificados-padroes')
    expect(revalidatePath).toHaveBeenNthCalledWith(2, '/certificados-padroes')
    expect(revalidatePath).toHaveBeenNthCalledWith(3, '/certificados-padroes')
  })

  it('não revalida durante atualizações internas do ciclo de vida', async () => {
    await revalidateReferenceCertificate({
      doc: { _status: 'published' },
      previousDoc: { _status: 'published' },
      req: { context: { skipReferenceCertificateLifecycle: true } },
    } as never)

    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
