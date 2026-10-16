import { MessageCircle } from 'lucide-react'
import Link from 'next/link'

import { buildWhatsAppOrContactURL } from '@/lib/whatsapp'

import { Logo } from './Logo'
import { MobileMenu } from './MobileMenu'

const defaultLinks = [
  ['Produtos', '/produtos'],
  ['Serviços', '/servicos'],
  ['Sobre', '/sobre'],
  ['Contato', '/contato'],
] as const

export function SiteHeader({ whatsapp, logo, links = defaultLinks }: { whatsapp: string; logo?: { url: string; alt: string }; links?: ReadonlyArray<readonly [string, string]> }) {
  const whatsappURL = buildWhatsAppOrContactURL(whatsapp)

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Logo image={logo} />
        <nav className="desktop-nav" aria-label="Principal">
          {links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
        </nav>
        <a className="button button-primary header-cta" href={whatsappURL} target="_blank" rel="noreferrer">
          <MessageCircle size={18} aria-hidden="true" /> Fale conosco
        </a>
        <MobileMenu links={links} whatsappURL={whatsappURL} />
      </div>
    </header>
  )
}
