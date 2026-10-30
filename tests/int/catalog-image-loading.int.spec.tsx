import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ProductsPage from '@/app/(frontend)/produtos/page'
import { getProducts } from '@/lib/cms'
import { demoProducts } from '@/data/demo'

vi.mock('@/lib/cms', () => ({ getProducts: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/produtos',
  useSearchParams: () => new URLSearchParams(),
}))
afterEach(cleanup)

describe('carregamento inicial das fotos do catálogo', () => {
  it('renderiza o filtro recebido do servidor antes de ler a URL no navegador', async () => {
    vi.mocked(getProducts).mockResolvedValue(demoProducts)
    render(await ProductsPage({ searchParams: Promise.resolve({ q: 'sem-resultado-inexistente' }) }))
    expect(screen.queryAllByTestId('product-card')).toHaveLength(0)
    expect(screen.getByRole('searchbox').getAttribute('value')).toBe('sem-resultado-inexistente')
  })
  it('inicia as fotos da primeira linha sem esperar o lazy loading', async () => {
    const products = Array.from({ length: 4 }, (_, i) => ({
      ...demoProducts[0], id: String(i), name: `Produto ${i}`, slug: `produto-${i}`,
      image: { url: '/api/media/file/produto.png', alt: `Foto ${i}`, updatedAt: '2026-10-29' },
    }))
    vi.mocked(getProducts).mockResolvedValue(products)
    render(await ProductsPage({ searchParams: Promise.resolve({}) }))
    expect(screen.getByAltText('Foto 0').getAttribute('loading')).toBe('eager')
    expect(screen.getByAltText('Foto 3').getAttribute('loading')).toBe('lazy')
  })
})
