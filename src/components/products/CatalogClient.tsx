'use client'

import { Search, SlidersHorizontal, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useTransition } from 'react'

import { countActiveCatalogFacets, filterProducts, writeCatalogFilters, type CatalogFilters } from '@/lib/catalog'
import type { PublicProduct } from '@/lib/cms'

import { MobileFilterPanel } from './MobileFilterPanel'
import { ProductCard } from './ProductCard'

const fieldLabels: Array<[keyof CatalogFilters, string]> = [
  ['categories', 'Categoria'],
  ['pressureRanges', 'Faixa de pressão'],
  ['pressureUnits', 'Unidade'],
  ['diameters', 'Diâmetro'],
  ['accuracyClasses', 'Precisão'],
  ['connections', 'Conexão'],
  ['materials', 'Material'],
  ['fillings', 'Enchimento'],
  ['applications', 'Aplicação'],
  ['connectionPositions', 'Posição da conexão'],
  ['protectionRatings', 'Grau de proteção'],
  ['accessoryTypes', 'Tipo de acessório'],
  ['compatibility', 'Compatibilidade'],
]

const productField: Partial<Record<keyof CatalogFilters, keyof PublicProduct>> = {
  categories: 'category',
  pressureRanges: 'pressureRanges',
  pressureUnits: 'pressureUnits',
  diameters: 'diameters',
  accuracyClasses: 'accuracyClasses',
  connections: 'connections',
  materials: 'materials',
  fillings: 'fillings',
  applications: 'applications',
  connectionPositions: 'connectionPositions',
  protectionRatings: 'protectionRatings',
  accessoryTypes: 'accessoryTypes',
  compatibility: 'compatibility',
}

function optionsFor(products: PublicProduct[], key: keyof CatalogFilters) {
  const field = productField[key]
  if (!field) return []
  const values = products.flatMap((product) => {
    const value = product[field]
    return Array.isArray(value) ? value.map(String) : value ? [String(value)] : []
  })
  return [...new Set(values)]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    .map((value) => ({ label: value, value }))
}

function CatalogFilterFields({
  products,
  filters,
  onToggle,
}: {
  products: PublicProduct[]
  filters: CatalogFilters
  onToggle: (key: keyof CatalogFilters, value: string) => void
}) {
  return fieldLabels.map(([key, label]) => {
    const options = optionsFor(products, key)
    if (options.length < 2) return null
    return (
      <fieldset className="filter-group" key={key}>
        <legend>{label}</legend>
        {options.map((option) => {
          const checked = ((filters[key] as string[] | undefined) || []).includes(option.value)
          return (
            <label key={option.value}>
              <input type="checkbox" checked={checked} onChange={() => onToggle(key, option.value)} />
              <span>{option.label}</span>
            </label>
          )
        })}
      </fieldset>
    )
  })
}

export function CatalogClient({ products, filters = {} }: { products: PublicProduct[]; filters?: CatalogFilters }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const filteredProducts = useMemo(() => filterProducts(products, filters), [products, filters])

  const update = (next: CatalogFilters) => {
    const params = writeCatalogFilters(next)
    startTransition(() => router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false }))
  }

  const toggle = (key: keyof CatalogFilters, value: string) => {
    const current = Array.isArray(filters[key]) ? (filters[key] as string[]) : []
    const nextValues = current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    update({ ...filters, [key]: nextValues })
  }

  const hasFilters = writeCatalogFilters(filters).size > 0
  const activeFacetCount = countActiveCatalogFacets(filters)

  if (products.length === 0) {
    return (
      <div className="empty-state">
        <span>Em preparação</span>
        <h2>Catálogo em atualização.</h2>
        <p>Estamos organizando as fichas técnicas. Fale com a equipe para consultar modelos, faixas e disponibilidade.</p>
      </div>
    )
  }

  return (
    <div className={`catalog-layout ${isPending ? 'is-pending' : ''}`}>
      <aside className="filters desktop-filters" aria-label="Filtros do catálogo">
        <div className="filter-heading"><SlidersHorizontal size={18} /><strong>Filtrar produtos</strong></div>
        <CatalogFilterFields products={products} filters={filters} onToggle={toggle} />
      </aside>

      <div className="catalog-results">
        <div className="catalog-toolbar">
          <label className="search-field">
            <Search size={19} aria-hidden="true" />
            <span className="sr-only">Buscar produtos</span>
            <input
              type="search"
              aria-label="Buscar produtos"
              placeholder="Busque por produto, aplicação ou código"
              value={filters.query || ''}
              onChange={(event) => update({ ...filters, query: event.target.value || undefined })}
            />
          </label>
          <MobileFilterPanel activeCount={activeFacetCount} onApply={() => undefined} onClear={() => update({})}>
            <CatalogFilterFields products={products} filters={filters} onToggle={toggle} />
          </MobileFilterPanel>
          <div className="result-count" aria-live="polite">
            <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'produto' : 'produtos'}
          </div>
          {hasFilters && (
            <button className="clear-filters" onClick={() => update({})} type="button">
              <X size={16} /> Limpar filtros
            </button>
          )}
        </div>

        {filteredProducts.length > 0 ? (
          <div className="product-grid">
            {filteredProducts.map((product, index) => <ProductCard key={product.id} product={product} eager={index < 3} />)}
          </div>
        ) : (
          <div className="empty-state">
            <span>0 resultados</span>
            <h2>Nenhum produto corresponde aos filtros.</h2>
            <p>Remova alguns critérios ou fale com a equipe para localizar uma configuração específica.</p>
            <button className="button button-outline" onClick={() => update({})} type="button">Limpar filtros</button>
          </div>
        )}
      </div>
    </div>
  )
}
