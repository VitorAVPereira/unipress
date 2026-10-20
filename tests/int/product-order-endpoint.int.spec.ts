import type { PayloadRequest } from 'payload'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { productOrderEndpoints } from '@/endpoints/productOrder'

const handler = productOrderEndpoints[0].handler

function request(overrides: Partial<PayloadRequest> = {}) {
  return {
    json: vi.fn().mockResolvedValue({ ids: [2, 1] }),
    payload: {
      find: vi.fn().mockResolvedValue({
        docs: [
          { _order: 'a00000001', _status: 'published', id: 1 },
          { _order: 'a00000002', _status: 'published', id: 2 },
        ],
      }),
      update: vi.fn().mockResolvedValue({}),
    },
    user: { collection: 'users', id: 7 },
    ...overrides,
  } as unknown as PayloadRequest
}

describe('salvamento da ordem dos produtos', () => {
  it('persiste a sequência completa com chaves ordenáveis determinísticas', async () => {
    const req = request()

    const response = await handler(req)

    expect(response.status).toBe(200)
    expect(req.payload.update).toHaveBeenNthCalledWith(1, {
      collection: 'products',
      context: { disableRevalidate: true },
      data: { _order: 'a00000001' },
      depth: 0,
      draft: false,
      id: 2,
      overrideAccess: true,
      req,
    })
    expect(req.payload.update).toHaveBeenNthCalledWith(2, {
      collection: 'products',
      context: { disableRevalidate: true },
      data: { _order: 'a00000002' },
      depth: 0,
      draft: false,
      id: 1,
      overrideAccess: true,
      req,
    })
  })
})
