import type { Endpoint, PayloadRequest } from 'payload'

import { revalidateProductOrder } from '@/hooks/revalidateContent'

type ProductID = number | string

function isProductID(value: unknown): value is ProductID {
  return typeof value === 'number' || (typeof value === 'string' && value.length > 0)
}

function orderKey(index: number) {
  return `a${String(index + 1).padStart(8, '0')}`
}

function error(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

async function saveProductOrder(req: PayloadRequest) {
  if (req.user?.collection !== 'users') return error('Acesso negado.', 403)

  const body = (req.json ? await req.json().catch(() => null) : null) as { ids?: unknown } | null
  const ids = body?.ids
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 1000 || !ids.every(isProductID)) {
    return error('Envie a lista completa de produtos em uma ordem válida.', 400)
  }

  const normalizedIDs = ids.map(String)
  if (new Set(normalizedIDs).size !== normalizedIDs.length) {
    return error('A ordem contém produtos duplicados.', 400)
  }

  const current = await req.payload.find({
    collection: 'products',
    depth: 0,
    draft: true,
    limit: 0,
    overrideAccess: true,
    pagination: false,
    req,
    sort: '_order',
  })
  const currentByID = new Map(current.docs.map((product) => [String(product.id), product]))
  const sameCatalog = current.docs.length === ids.length && normalizedIDs.every((id) => currentByID.has(id))
  if (!sameCatalog) return error('A lista de produtos mudou. Atualize a página e tente novamente.', 409)

  try {
    for (const [index, id] of ids.entries()) {
      const product = currentByID.get(String(id))
      await req.payload.update({
        collection: 'products',
        context: { disableRevalidate: true },
        data: { _order: orderKey(index) },
        depth: 0,
        draft: product?._status === 'draft',
        id,
        overrideAccess: true,
        req,
      })
    }
    revalidateProductOrder()
    return Response.json({ success: true })
  } catch (cause) {
    req.payload.logger?.error?.({ err: cause }, 'Falha ao salvar a ordem dos produtos')
    return error('Não foi possível salvar a ordem. Tente novamente.', 500)
  }
}

export const productOrderEndpoints: Endpoint[] = [
  {
    path: '/save-order',
    method: 'post',
    handler: saveProductOrder,
  },
]
