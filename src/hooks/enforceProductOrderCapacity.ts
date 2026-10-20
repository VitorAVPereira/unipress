import type { CollectionBeforeChangeHook, CollectionBeforeValidateHook } from 'payload'

import type { Product } from '@/payload-types'

const maximumOrderableProducts = 1000

export const enforceProductOrderCapacity: CollectionBeforeValidateHook<Product> = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create') return data

  const { totalDocs } = await req.payload.count({
    collection: 'products',
    overrideAccess: true,
  })

  if (totalDocs >= maximumOrderableProducts) {
    throw new Error('O catálogo atingiu o limite de 1.000 produtos ordenáveis.')
  }

  return data
}

export const appendNewProductToOrder: CollectionBeforeChangeHook<Product> = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create' || data._order) return data

  const lastProduct = await req.payload.find({
    collection: 'products',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    select: { _order: true },
    sort: '-_order',
  })
  const lastOrder = lastProduct.docs[0]?._order
  data._order = lastOrder ? `${lastOrder}z` : 'a00000001'
  return data
}
