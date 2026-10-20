import type { CollectionBeforeValidateHook } from 'payload'

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
