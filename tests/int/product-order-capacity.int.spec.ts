import { describe, expect, it, vi } from 'vitest'

import { enforceProductOrderCapacity } from '@/hooks/enforceProductOrderCapacity'

const productData = { name: 'Termômetro industrial' }

function hookArgs(totalDocs: number, operation: 'create' | 'update' = 'create') {
  const count = vi.fn().mockResolvedValue({ totalDocs })

  return {
    args: {
      data: productData,
      operation,
      req: { payload: { count } },
    } as never,
    count,
  }
}

describe('capacidade da ordenação manual de produtos', () => {
  it('aceita a criação enquanto todos os produtos ainda cabem na lista única', async () => {
    const { args, count } = hookArgs(999)

    await expect(enforceProductOrderCapacity(args)).resolves.toBe(productData)
    expect(count).toHaveBeenCalledWith({ collection: 'products', overrideAccess: true })
  })

  it('impede ultrapassar a capacidade da lista ordenável', async () => {
    const { args } = hookArgs(1000)

    await expect(enforceProductOrderCapacity(args)).rejects.toThrow(
      'O catálogo atingiu o limite de 1.000 produtos ordenáveis.',
    )
  })

  it('não bloqueia a edição de produtos existentes', async () => {
    const { args, count } = hookArgs(1000, 'update')

    await expect(enforceProductOrderCapacity(args)).resolves.toBe(productData)
    expect(count).not.toHaveBeenCalled()
  })
})
