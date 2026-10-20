import { describe, expect, it } from 'vitest'

import { Products } from '@/collections/Products'

describe('catálogo conectado ao CMS', () => {
  it('habilita a ordenação nativa por arrastar e soltar', () => {
    expect(Products.orderable).toBe(true)
    expect(Products.defaultSort).toBe('_order')
    expect(Products.admin?.pagination).toEqual({ defaultLimit: 1000, limits: [1000] })
    expect(Products.admin?.components?.beforeListTable).toContain(
      '@/components/admin/ProductOrderPositioning#ProductOrderPositioning',
    )
    expect(Products.hooks?.beforeValidate?.map((hook) => hook.name)).toContain(
      'enforceProductOrderCapacity',
    )
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
