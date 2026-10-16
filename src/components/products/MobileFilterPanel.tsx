'use client'

import { SlidersHorizontal, X } from 'lucide-react'
import { type ReactNode, useEffect, useId, useRef, useState } from 'react'

type MobileFilterPanelProps = {
  activeCount: number
  children: ReactNode
  onApply: () => void
  onClear: () => void
}

export function MobileFilterPanel({ activeCount, children, onApply, onClear }: MobileFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const titleId = useId()
  const panelId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsOpen(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [isOpen])

  const close = () => setIsOpen(false)
  const apply = () => {
    onApply()
    close()
  }
  const clear = () => {
    onClear()
    close()
  }
  const activeLabel = activeCount === 1 ? '1 ativo' : `${activeCount} ativos`

  return (
    <div className="mobile-filter-controls">
      <button
        ref={triggerRef}
        type="button"
        className="mobile-filter-trigger"
        aria-controls={panelId}
        aria-expanded={isOpen}
        aria-label={activeCount > 0 ? `Abrir filtros, ${activeLabel}` : 'Abrir filtros'}
        onClick={() => setIsOpen(true)}
      >
        <SlidersHorizontal size={18} aria-hidden="true" />
        Filtros
        {activeCount > 0 ? <span aria-hidden="true">{activeCount}</span> : null}
      </button>

      {isOpen ? (
        <div className="mobile-filter-backdrop" role="presentation" onMouseDown={close}>
          <section
            id={panelId}
            className="mobile-filter-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="mobile-filter-heading">
              <h2 id={titleId}>Filtros do catálogo</h2>
              <button type="button" aria-label="Fechar filtros" onClick={close}><X aria-hidden="true" /></button>
            </header>
            <div className="mobile-filter-body">{children}</div>
            <footer className="mobile-filter-actions">
              <button type="button" className="button button-outline" onClick={clear}>Limpar filtros</button>
              <button type="button" className="button button-primary" onClick={apply}>Aplicar filtros</button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  )
}
