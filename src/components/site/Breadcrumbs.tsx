import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

export function Breadcrumbs({ items }: { items: Array<[string, string?]> }) {
  const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, href], index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name,
      item: href ? new URL(href, base).toString() : undefined,
    })),
  }

  return (
    <>
      <nav className="breadcrumbs container" aria-label="Breadcrumb">
        {items.map(([label, href], index) => (
          <span key={`${label}-${index}`}>
            {index > 0 && <ChevronRight size={14} aria-hidden="true" />}
            {href ? <Link href={href}>{label}</Link> : <span aria-current="page">{label}</span>}
          </span>
        ))}
      </nav>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  )
}
