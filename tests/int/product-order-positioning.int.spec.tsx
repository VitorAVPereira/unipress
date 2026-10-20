import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const payloadUI = vi.hoisted(() => ({
  useListQuery: vi.fn(),
}))

vi.mock('@payloadcms/ui', () => payloadUI)

import { ProductOrderPositioning } from '@/components/admin/ProductOrderPositioning'

afterEach(cleanup)

describe('posição dos produtos no painel', () => {
  it('continua a numeração a partir do deslocamento da página atual', () => {
    payloadUI.useListQuery.mockReturnValue({ data: { page: 2, limit: 100 } })

    render(<ProductOrderPositioning />)

    expect(screen.getByTestId('product-order-page-offset').textContent).toContain(
      'counter-reset: product-position 100',
    )
    expect(screen.getByText(/arraste um produto pela posição/i)).not.toBeNull()
  })
})
