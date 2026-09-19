import { describe, expect, it } from 'vitest'

import {
  filterProducts,
  normalizeSearch,
  readCatalogFilters,
  writeCatalogFilters,
  type CatalogProduct,
} from '@/lib/catalog'
import { buildWhatsAppOrContactURL, buildWhatsAppURL } from '@/lib/whatsapp'

const products: CatalogProduct[] = [
  {
    id: 'industrial-100',
    name: 'Manômetro Industrial Inox',
    code: 'UP-MI100',
    summary: 'Construção robusta para processos industriais',
    family: 'manometro',
    category: 'industriais',
    applications: ['Água', 'Óleo'],
    diameters: ['100 mm'],
    accuracyClasses: ['1,0'],
    connections: ['1/2 NPT'],
    materials: ['Aço inox'],
    fillings: ['Seco'],
  },
  {
    id: 'glicerina-63',
    name: 'Manômetro com Glicerina',
    code: 'UP-MG63',
    summary: 'Amortecimento para vibração e pulsação',
    family: 'manometro',
    category: 'com-glicerina',
    applications: ['Hidráulica'],
    diameters: ['63 mm'],
    accuracyClasses: ['1,6'],
    connections: ['1/4 NPT'],
    materials: ['Aço carbono'],
    fillings: ['Glicerina'],
  },
  {
    id: 'sifao',
    name: 'Sifão Tipo Trombeta',
    code: 'UP-ST',
    summary: 'Proteção térmica para instrumentos de pressão',
    family: 'acessorio',
    category: 'sifoes',
    applications: ['Vapor'],
    diameters: [],
    accuracyClasses: [],
    connections: ['1/2 NPT'],
    materials: ['Aço carbono'],
    fillings: [],
  },
]

describe('catálogo', () => {
  it('normaliza caixa e acentos na busca', () => {
    expect(normalizeSearch('  Manômetro ÁGUA  ')).toBe('manometro agua')
  })

  it('combina facetas diferentes com AND', () => {
    const result = filterProducts(products, {
      query: 'inox',
      families: ['manometro'],
      diameters: ['100 mm'],
      materials: ['Aço inox'],
    })

    expect(result.map((product) => product.id)).toEqual(['industrial-100'])
  })

  it('combina valores da mesma faceta com OR', () => {
    const result = filterProducts(products, {
      families: ['manometro'],
      diameters: ['63 mm', '100 mm'],
    })

    expect(result.map((product) => product.id)).toEqual(['industrial-100', 'glicerina-63'])
  })

  it('filtra pelas opções cadastradas de faixa e unidade de pressão', () => {
    const pressureProducts = products.map((product, index) => ({
      ...product,
      pressureRanges: index === 0 ? ['0 a 10 bar', '0 a 160 psi'] : ['0 a 4 bar'],
      pressureUnits: index === 0 ? ['bar', 'psi'] : ['bar'],
    }))

    const result = filterProducts(pressureProducts, {
      pressureRanges: ['0 a 160 psi'],
      pressureUnits: ['psi'],
    })

    expect(result.map((product) => product.id)).toEqual(['industrial-100'])
  })

  it('preserva filtros repetidos na URL', () => {
    const filters = readCatalogFilters(
      new URLSearchParams('q=oleo&familia=manometro&diametro=63+mm&diametro=100+mm'),
    )

    expect(filters).toEqual({
      query: 'oleo',
      families: ['manometro'],
      diameters: ['63 mm', '100 mm'],
    })
    expect(writeCatalogFilters(filters).toString()).toBe(
      'q=oleo&familia=manometro&diametro=63+mm&diametro=100+mm',
    )
  })
})

describe('WhatsApp', () => {
  it('remove caracteres do número e contextualiza o modelo', () => {
    expect(buildWhatsAppURL('+55 (11) 99999-9999', 'UP-MI100')).toBe(
      'https://wa.me/5511999999999?text=Ol%C3%A1%2C+gostaria+de+consultar+o+produto+UP-MI100.',
    )
  })

  it('usa contato como alternativa quando o número ainda não foi configurado', () => {
    expect(buildWhatsAppOrContactURL('', 'UP-MI100')).toBe('/contato')
  })
})
