import { describe, expect, it, vi } from 'vitest'

import { ProductCategories } from '@/collections/ProductCategories'
import { Products } from '@/collections/Products'

function namedField(fields: typeof Products.fields, name: string) {
  return fields.find((field) => 'name' in field && field.name === name)
}

describe('famílias de produtos', () => {
  it('oferece perfis técnicos para manômetro, acessório e família genérica', async () => {
    const { ProductFamilies } = await import('@/collections/ProductFamilies')
    const profile = namedField(ProductFamilies.fields, 'technicalProfile')

    expect(ProductFamilies.slug).toBe('product-families')
    expect(profile).toMatchObject({ defaultValue: 'generico', required: true, type: 'select' })
    expect('options' in profile! ? profile.options : []).toEqual([
      { label: 'Manômetro', value: 'manometro' },
      { label: 'Acessório', value: 'acessorio' },
      { label: 'Genérico', value: 'generico' },
    ])
  })

  it.each([
    ['produto', { products: 1, 'product-categories': 0 }],
    ['categoria', { products: 0, 'product-categories': 1 }],
  ])('bloqueia exclusão quando existe vínculo somente com %s', async (_label, totals) => {
    const { preventDeletingProductFamily } = await import('@/hooks/preventDeletingProductFamily')
    const count = vi.fn(async ({ collection }: { collection: keyof typeof totals }) => ({
      totalDocs: totals[collection],
    }))

    await expect(
      preventDeletingProductFamily({ id: 7, req: { payload: { count } } } as never),
    ).rejects.toThrow('Transfira os produtos e categorias')
  })

  it('permite excluir família sem vínculos', async () => {
    const { preventDeletingProductFamily } = await import('@/hooks/preventDeletingProductFamily')
    const count = vi.fn(async () => ({ totalDocs: 0 }))

    await expect(
      preventDeletingProductFamily({ id: 8, req: { payload: { count } } } as never),
    ).resolves.toBeUndefined()
  })

  it('relaciona produtos e categorias a famílias cadastradas', () => {
    const productFamily = namedField(Products.fields, 'family')
    const categoryFamily = namedField(ProductCategories.fields, 'family')

    expect(productFamily).toMatchObject({ relationTo: 'product-families', required: true, type: 'relationship' })
    expect(categoryFamily).toMatchObject({ relationTo: 'product-families', required: true, type: 'relationship' })
  })

  it('sincroniza o perfil técnico do produto a partir da família escolhida', async () => {
    const { syncProductFamilyProfile } = await import('@/hooks/syncProductFamilyProfile')
    const findByID = vi.fn(async () => ({ id: 3, technicalProfile: 'acessorio' }))

    const result = await syncProductFamilyProfile({
      data: { family: 3, name: 'Sifão' },
      req: { payload: { findByID } },
    } as never)

    expect(result).toMatchObject({ family: 3, familyProfile: 'acessorio', name: 'Sifão' })
  })

  it('invalida o catálogo e os produtos afetados quando a família muda de nome', async () => {
    const { productFamilyPaths } = await import('@/hooks/revalidateContent')

    expect(productFamilyPaths(['termometro-bimetalico', 'termometro-capela'])).toEqual([
      '/produtos',
      '/produtos/termometro-bimetalico',
      '/produtos/termometro-capela',
    ])
  })
})
