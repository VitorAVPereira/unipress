import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MobileFilterPanel } from '@/components/products/MobileFilterPanel'
import { countActiveCatalogFacets, readCatalogFilters } from '@/lib/catalog'

afterEach(cleanup)

function renderPanel({ activeCount = 0, onApply = vi.fn(), onClear = vi.fn() } = {}) {
  render(
    <MobileFilterPanel activeCount={activeCount} onApply={onApply} onClear={onClear}>
      <fieldset><legend>Família</legend><label><input type="checkbox" /> Manômetro</label></fieldset>
    </MobileFilterPanel>,
  )

  return { onApply, onClear }
}

describe('painel móvel de filtros', () => {
  it('começa fechado e informa a quantidade de facetas vindas da URL, sem contar a busca', () => {
    const filters = readCatalogFilters(
      new URLSearchParams('q=industrial&familia=manometro&diametro=63+mm&diametro=100+mm'),
    )
    renderPanel({ activeCount: countActiveCatalogFacets(filters) })

    expect(screen.getByRole('button', { name: 'Abrir filtros, 3 ativos' })).toBeTruthy()
    expect(screen.queryByRole('dialog', { name: 'Filtros do catálogo' })).toBeNull()
  })

  it('abre e fecha explicitamente', () => {
    renderPanel()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir filtros' }))

    expect(screen.getByRole('dialog', { name: 'Filtros do catálogo' })).toBeTruthy()
    expect(screen.getByText('Família')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Fechar filtros' }))
    expect(screen.queryByRole('dialog', { name: 'Filtros do catálogo' })).toBeNull()
  })

  it('fecha ao aplicar sem alterar os filtros', () => {
    const { onApply } = renderPanel()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir filtros' }))

    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))

    expect(onApply).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog', { name: 'Filtros do catálogo' })).toBeNull()
  })

  it('limpa os filtros e fecha o painel', () => {
    const { onClear } = renderPanel({ activeCount: 2 })
    fireEvent.click(screen.getByRole('button', { name: 'Abrir filtros, 2 ativos' }))

    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))

    expect(onClear).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog', { name: 'Filtros do catálogo' })).toBeNull()
  })
})
