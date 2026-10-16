'use client'

import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

type MobileMenuProps = {
  links: ReadonlyArray<readonly [string, string]>
  whatsappURL: string
}

export function MobileMenu({ links, whatsappURL }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelId = 'mobile-menu-panel'

  useEffect(() => {
    if (!isOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return

      setIsOpen(false)
      buttonRef.current?.focus()
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [isOpen])

  const closeMenu = () => setIsOpen(false)

  return (
    <div className="mobile-menu">
      <button
        ref={buttonRef}
        type="button"
        className="mobile-menu-toggle"
        aria-controls={panelId}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
      {isOpen ? (
        <nav id={panelId} className="mobile-menu-panel" aria-label="Menu móvel">
          {links.map(([label, href]) => (
            <Link href={href} key={href} onClick={closeMenu}>{label}</Link>
          ))}
          <a href={whatsappURL} target="_blank" rel="noreferrer" onClick={closeMenu}>Fale no WhatsApp</a>
        </nav>
      ) : null}
    </div>
  )
}
