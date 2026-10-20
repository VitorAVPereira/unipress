import { describe, expect, it } from 'vitest'

import { Products } from '@/collections/Products'

describe('catálogo conectado ao CMS', () => {
  it('usa ordenação manual com salvamento explícito', () => {
    expect(Products.orderable).toBeUndefined()
    expect(Products.defaultSort).toBe('_order')
    expect(Products.fields.some((field) => 'name' in field && field.name === '_order')).toBe(true)
    expect(Products.admin?.pagination).toEqual({ defaultLimit: 1000, limits: [1000] })
    expect(Products.admin?.components?.beforeListTable).toContain(
      '@/components/admin/ProductOrderPositioning#ProductOrderPositioning',
    )
    expect(Products.hooks?.beforeValidate?.map((hook) => hook.name)).toContain(
      'enforceProductOrderCapacity',
    )
    expect(Products.hooks?.beforeChange?.map((hook) => hook.name)).toContain(
      'appendNewProductToOrder',
    )
    expect(
      Array.isArray(Products.endpoints) &&
        Products.endpoints.some((endpoint) => endpoint.path === '/save-order'),
    ).toBe(true)
  })

  it('normaliza uma família populada preservando o nome editado', async () => {
    const { normalizeProductFamily } = await import('@/lib/cms')

    expect(
      normalizeProductFamily({
        id: 9,
        name: 'Instrumentos de temperatura',
        slug: 'termometros',
        technicalProfile: 'generico',
      }),
    ).toEqual({
      name: 'Instrumentos de temperatura',
      slug: 'termometros',
      technicalProfile: 'generico',
    })
  })

  it.each([3, null, undefined])('usa família neutra para relacionamento indisponível (%s)', async (value) => {
    const { normalizeProductFamily } = await import('@/lib/cms')

    expect(normalizeProductFamily(value)).toEqual({
      name: 'Produtos',
      slug: 'produtos',
      technicalProfile: 'generico',
    })
  })
})
