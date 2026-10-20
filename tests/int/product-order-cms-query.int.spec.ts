import { beforeEach, describe, expect, it, vi } from 'vitest'

const payload = vi.hoisted(() => ({
  find: vi.fn(),
}))

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: vi.fn().mockResolvedValue(payload) }))

import { getProducts } from '@/lib/cms'

describe('consulta pública da ordem dos produtos', () => {
  beforeEach(() => {
    payload.find.mockResolvedValue({ docs: [] })
  })

  it('busca todos os produtos na mesma ordem manual usada pelo painel', async () => {
    await getProducts()

    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'products',
        limit: 0,
        sort: ['_order', 'name'],
      }),
    )
  })
})
