import { APIError, type CollectionBeforeDeleteHook } from 'payload'

export const preventDeletingProductFamily: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const [products, categories] = await Promise.all([
    req.payload.count({ collection: 'products', req, where: { family: { equals: id } } }),
    req.payload.count({ collection: 'product-categories', req, where: { family: { equals: id } } }),
  ])

  if (products.totalDocs > 0 || categories.totalDocs > 0) {
    throw new APIError(
      'Esta família ainda está em uso. Transfira os produtos e categorias para outra família antes de excluir.',
      400,
    )
  }
}
