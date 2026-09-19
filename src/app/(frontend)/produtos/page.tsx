import type { Metadata } from 'next'
import { Suspense } from 'react'

import { CatalogClient } from '@/components/products/CatalogClient'
import { getProducts } from '@/lib/cms'

export const metadata: Metadata = {
  title: 'Produtos',
  description: 'Catálogo de manômetros e acessórios UniPress para aplicações industriais.',
  alternates: { canonical: '/produtos' },
}

export default async function ProductsPage() {
  const products = await getProducts()
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
        <Suspense fallback={<div className="catalog-loading">Carregando catálogo...</div>}>
          <CatalogClient products={products} />
        </Suspense>
      </section>
    </>
  )
}
