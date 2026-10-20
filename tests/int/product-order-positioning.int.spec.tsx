import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const payloadUI = vi.hoisted(() => ({
  useListQuery: vi.fn(),
}))

vi.mock('@payloadcms/ui', () => payloadUI)

import { ProductOrderPositioning } from '@/components/admin/ProductOrderPositioning'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('posição dos produtos no painel', () => {
  it('só habilita o salvamento depois que a ordem visual muda', () => {
    payloadUI.useListQuery.mockReturnValue({
      data: {
        docs: [
          { id: 1, name: 'Manômetro' },
          { id: 2, name: 'Termômetro' },
        ],
        limit: 1000,
        page: 1,
      },
    })

    render(<ProductOrderPositioning />)

    const saveButton = screen.getByRole('button', { name: /ordem salva/i })
    expect((saveButton as HTMLButtonElement).disabled).toBe(true)

    fireEvent.dragStart(screen.getByText('Termômetro'))
    fireEvent.dragOver(screen.getByText('Manômetro'))
    fireEvent.drop(screen.getByText('Manômetro'))

    expect(screen.getByText(/alterações não salvas/i)).not.toBeNull()
    expect((screen.getByRole('button', { name: /salvar ordem/i }) as HTMLButtonElement).disabled).toBe(false)
    expect(screen.getAllByTestId('product-order-position').map((item) => item.textContent)).toEqual([
      '1',
      '2',
    ])
  })

  it('grava a sequência completa apenas ao clicar em salvar', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    payloadUI.useListQuery.mockReturnValue({
      data: {
        docs: [
          { id: 1, name: 'Manômetro' },
          { id: 2, name: 'Termômetro' },
        ],
        limit: 1000,
        page: 1,
      },
    })

    render(<ProductOrderPositioning />)
    fireEvent.dragStart(screen.getByText('Termômetro'))
    fireEvent.dragOver(screen.getByText('Manômetro'))
    fireEvent.drop(screen.getByText('Manômetro'))

    expect(fetchMock).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /salvar ordem/i }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(fetchMock).toHaveBeenCalledWith('/api/products/save-order', {
      body: JSON.stringify({ ids: [2, 1] }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    await waitFor(() => {
      expect((screen.getByRole('button', { name: /ordem salva/i }) as HTMLButtonElement).disabled).toBe(true)
    })
  })
})
