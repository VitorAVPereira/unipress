export type CatalogFamily = 'manometro' | 'acessorio'

export type CatalogProduct = {
  id: string
  name: string
  code: string
  summary: string
  family: CatalogFamily
  category: string
  applications: string[]
  diameters: string[]
  accuracyClasses: string[]
  connections: string[]
  materials: string[]
  fillings: string[]
  pressureRanges?: string[]
  pressureUnits?: string[]
  connectionPositions?: string[]
  protectionRatings?: string[]
  accessoryTypes?: string[]
  compatibility?: string[]
}

export type CatalogFilters = {
  query?: string
  families?: string[]
  categories?: string[]
  applications?: string[]
  diameters?: string[]
  accuracyClasses?: string[]
  connections?: string[]
  materials?: string[]
  fillings?: string[]
  pressureRanges?: string[]
  pressureUnits?: string[]
  connectionPositions?: string[]
  protectionRatings?: string[]
  accessoryTypes?: string[]
  compatibility?: string[]
}

export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
    .replace(/\s+/g, ' ')
}

const facetKeys = [
  'families',
  'categories',
  'applications',
  'diameters',
  'accuracyClasses',
  'connections',
  'materials',
  'fillings',
  'pressureRanges',
  'pressureUnits',
  'connectionPositions',
  'protectionRatings',
  'accessoryTypes',
  'compatibility',
] as const

const productFacet: Record<(typeof facetKeys)[number], keyof CatalogProduct> = {
  families: 'family',
  categories: 'category',
  applications: 'applications',
  diameters: 'diameters',
  accuracyClasses: 'accuracyClasses',
  connections: 'connections',
  materials: 'materials',
  fillings: 'fillings',
  pressureRanges: 'pressureRanges',
  pressureUnits: 'pressureUnits',
  connectionPositions: 'connectionPositions',
  protectionRatings: 'protectionRatings',
  accessoryTypes: 'accessoryTypes',
  compatibility: 'compatibility',
}

function hasSelectedValue(product: CatalogProduct, key: (typeof facetKeys)[number], selected: string[]) {
  if (selected.length === 0) return true

  const rawValue = product[productFacet[key]]
  const values = Array.isArray(rawValue) ? rawValue : rawValue ? [rawValue] : []
  const normalizedValues = values.map((value) => normalizeSearch(String(value)))

  return selected.some((value) => normalizedValues.includes(normalizeSearch(value)))
}

export function filterProducts<T extends CatalogProduct>(products: T[], filters: CatalogFilters): T[] {
  const query = normalizeSearch(filters.query || '')

  return products.filter((product) => {
    if (query) {
      const haystack = normalizeSearch(
        [product.name, product.code, product.summary, ...product.applications].join(' '),
      )
      if (!haystack.includes(query)) return false
    }

    return facetKeys.every((key) => hasSelectedValue(product, key, filters[key] || []))
  })
}

const queryParamMap: Record<(typeof facetKeys)[number], string> = {
  families: 'familia',
  categories: 'categoria',
  applications: 'aplicacao',
  diameters: 'diametro',
  accuracyClasses: 'precisao',
  connections: 'conexao',
  materials: 'material',
  fillings: 'enchimento',
  pressureRanges: 'faixa',
  pressureUnits: 'unidade',
  connectionPositions: 'posicao',
  protectionRatings: 'protecao',
  accessoryTypes: 'tipo',
  compatibility: 'compatibilidade',
}

export function readCatalogFilters(params: URLSearchParams): CatalogFilters {
  const filters: CatalogFilters = {}
  const query = params.get('q')?.trim()
  if (query) filters.query = query

  facetKeys.forEach((key) => {
    const values = params.getAll(queryParamMap[key]).filter(Boolean)
    if (values.length > 0) filters[key] = values
  })

  return filters
}

export function writeCatalogFilters(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.query?.trim()) params.set('q', filters.query.trim())

  facetKeys.forEach((key) => {
    filters[key]?.forEach((value) => params.append(queryParamMap[key], value))
  })

  return params
}
