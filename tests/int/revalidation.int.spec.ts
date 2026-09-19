import { beforeEach, describe, expect, it, vi } from 'vitest'

const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }))

vi.mock('next/cache', () => ({ revalidatePath }))

import { revalidateProduct, revalidateService } from '@/hooks/revalidateContent'

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
})
