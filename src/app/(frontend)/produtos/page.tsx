import type { Metadata } from 'next'

import { CatalogClient } from '@/components/products/CatalogClient'
import { getProducts } from '@/lib/cms'
import { readCatalogFilters } from '@/lib/catalog'

export const metadata: Metadata = {
  title: 'Produtos',
  description: 'Catálogo de manômetros e acessórios UniPress para aplicações industriais.',
  alternates: { canonical: '/produtos' },
}

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const [products, query] = await Promise.all([getProducts(), searchParams])
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) {
      params.append(key, item)
    }
  }
  const filters = readCatalogFilters(params)
  return (
    <>
      <section className="page-hero page-hero-products">
        <div className="container">
          <span className="eyebrow">Catálogo técnico</span>
          <h1>Encontre a configuração certa para a sua aplicação.</h1>
          <p>Busque por modelo, código ou aplicação e refine pelos parâmetros técnicos disponíveis.</p>
        </div>
      </section>
      <section className="catalog-section container">
        <CatalogClient products={products} filters={filters} />
      </section>
    </>
  )
}
