import type { Metadata } from 'next'
import { Inter, Manrope } from 'next/font/google'

import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteHeader } from '@/components/site/SiteHeader'
import { getSiteSettings } from '@/lib/cms'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' })
const manrope = Manrope({ subsets: ['latin'], variable: '--font-display', display: 'swap' })

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const baseURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  return {
    metadataBase: new URL(baseURL),
    title: { default: settings.defaultSeoTitle || 'UniPress', template: '%s | UniPress' },
    description: settings.defaultSeoDescription,
    openGraph: { locale: 'pt_BR', siteName: 'UniPress', type: 'website' },
  }
}

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()
  const headerLogo = typeof settings.headerLogo === 'object' && settings.headerLogo?.url
    ? { url: settings.headerLogo.url, alt: settings.headerLogo.alt }
    : undefined
  const footerLogo = typeof settings.footerLogo === 'object' && settings.footerLogo?.url
    ? { url: settings.footerLogo.url, alt: settings.footerLogo.alt }
    : undefined
  const configuredNavigation = settings.navigation?.length
    ? settings.navigation.map((item) => [item.label, item.url] as const)
    : [['Produtos', '/produtos'], ['Serviços', '/servicos'], ['Sobre', '/sobre'], ['Contato', '/contato']] as const
  const navigation = configuredNavigation.some(([, url]) => url === '/area-do-cliente')
    ? configuredNavigation
    : [...configuredNavigation, ['Área do cliente', '/area-do-cliente'] as const]
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'UniPress',
    url: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
    email: settings.email || undefined,
    telephone: settings.phone || undefined,
  }

  return (
    <html className={`${inter.variable} ${manrope.variable}`} lang="pt-BR" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
        <SiteHeader whatsapp={settings.whatsapp || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''} logo={headerLogo} links={navigation} />
        <main id="conteudo">{children}</main>
        <SiteFooter settings={settings} logo={footerLogo} links={navigation} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      </body>
    </html>
  )
}
