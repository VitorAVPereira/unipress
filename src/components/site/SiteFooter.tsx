import { Mail, MapPin, Phone } from 'lucide-react'
import Link from 'next/link'

import type { getSiteSettings } from '@/lib/cms'

import { Logo } from './Logo'

type Settings = Awaited<ReturnType<typeof getSiteSettings>>

export function SiteFooter({ settings, logo, links }: { settings: Settings; logo?: { url: string; alt: string }; links: ReadonlyArray<readonly [string, string]> }) {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Logo image={logo} />
          <p>{settings.tagline}</p>
          <span className="footer-note">Instrumentação e metrologia para empresas em todo o Brasil.</span>
        </div>
        <div>
          <h2>Navegação</h2>
          {links.map(([label, href]) => <Link href={href} key={`${label}-${href}`}>{label}</Link>)}
        </div>
        <div>
          <h2>Atendimento</h2>
          {settings.phone && <a href={`tel:${settings.phone}`}><Phone size={16} />{settings.phone}</a>}
          {settings.email && <a href={`mailto:${settings.email}`}><Mail size={16} />{settings.email}</a>}
          {settings.address && <p><MapPin size={16} />{settings.address}</p>}
          {!settings.phone && !settings.email && <p>Dados comerciais configuráveis pelo painel.</p>}
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} UniPress. Todos os direitos reservados.</span>
        <Link href="/privacidade">Política de Privacidade</Link>
      </div>
    </footer>
  )
}
