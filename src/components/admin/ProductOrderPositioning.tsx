'use client'

import { useListQuery } from '@payloadcms/ui'

export function ProductOrderPositioning() {
  const { data } = useListQuery()
  const page = Math.max(1, data?.page ?? 1)
  const limit = Math.max(1, data?.limit ?? 1000)
  const offset = (page - 1) * limit

  return (
    <>
      <style data-testid="product-order-page-offset">
        {`.collection-list--products .table table tbody { counter-reset: product-position ${offset}; }`}
      </style>
      <p className="product-order-help">
        Arraste um produto pela posição numerada para alterar a ordem exibida no site.
      </p>
    </>
  )
}
