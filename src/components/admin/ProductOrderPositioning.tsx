'use client'

import { useListQuery } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

type OrderableProduct = {
  id: number | string
  name?: string | null
}

function productID(product: OrderableProduct) {
  return String(product.id)
}

export function ProductOrderPositioning() {
  const { data } = useListQuery()
  const serverProducts = (data?.docs ?? []) as OrderableProduct[]
  const [products, setProducts] = useState(serverProducts)
  const [savedProducts, setSavedProducts] = useState(serverProducts)
  const [draggedID, setDraggedID] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const hasChanges = products.map(productID).join(',') !== savedProducts.map(productID).join(',')

  useEffect(() => {
    if (!hasChanges) return
    const warnAboutUnsavedChanges = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warnAboutUnsavedChanges)
    return () => window.removeEventListener('beforeunload', warnAboutUnsavedChanges)
  }, [hasChanges])

  function moveBefore(targetID: string) {
    if (!draggedID || draggedID === targetID) return
    setProducts((current) => {
      const dragged = current.find((product) => productID(product) === draggedID)
      if (!dragged) return current
      const withoutDragged = current.filter((product) => productID(product) !== draggedID)
      const targetIndex = withoutDragged.findIndex((product) => productID(product) === targetID)
      if (targetIndex < 0) return current
      const next = [...withoutDragged]
      next.splice(targetIndex, 0, dragged)
      return next
    })
    setDraggedID(null)
  }

  async function saveOrder() {
    setIsSaving(true)
    setSaveError(null)
    try {
      const response = await fetch('/api/products/save-order', {
        body: JSON.stringify({ ids: products.map((product) => product.id) }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      if (!response.ok) throw new Error('Não foi possível salvar a ordem. Tente novamente.')
      setSavedProducts(products)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Não foi possível salvar a ordem.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="product-order-panel" aria-label="Ordenar produtos">
      <p className="product-order-help">
        Arraste os produtos para definir a sequência. A alteração só será aplicada após salvar.
      </p>
      <ol className="product-order-list">
        {products.map((product, index) => (
          <li
            className="product-order-item"
            draggable
            key={productID(product)}
            onDragOver={(event) => event.preventDefault()}
            onDragStart={() => setDraggedID(productID(product))}
            onDrop={() => moveBefore(productID(product))}
          >
            <span className="product-order-position" data-testid="product-order-position">
              {index + 1}
            </span>
            <span>{product.name || `Produto ${product.id}`}</span>
            <span className="product-order-drag-hint" aria-hidden="true">⋮⋮</span>
          </li>
        ))}
      </ol>
      <div className="product-order-actions">
        <button
          className="product-order-save"
          disabled={!hasChanges || isSaving}
          onClick={saveOrder}
          type="button"
        >
          {isSaving ? 'Salvando…' : hasChanges ? 'Salvar ordem' : 'Ordem salva'}
        </button>
        <button
          className="product-order-cancel"
          disabled={!hasChanges}
          onClick={() => setProducts(savedProducts)}
          type="button"
        >
          Cancelar alterações
        </button>
        <span
          aria-live="polite"
          className={saveError ? 'product-order-status is-error' : hasChanges ? 'product-order-status is-pending' : 'product-order-status'}
        >
          {saveError || (hasChanges ? 'Alterações não salvas' : 'Todas as alterações estão salvas')}
        </span>
      </div>
    </section>
  )
}
