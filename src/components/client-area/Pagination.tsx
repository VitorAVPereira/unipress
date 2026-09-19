import Link from 'next/link'

import type { ClientPortalFilters } from '@/lib/clientPortal'

function pageURL(filters: ClientPortalFilters, page: number): string {
  const params = new URLSearchParams()
  if (filters.dateMode) params.set('dateMode', filters.dateMode)
  if (filters.date) params.set('date', filters.date)
  if (filters.certificate) params.set('certificate', filters.certificate)
  if (filters.tag) params.set('tag', filters.tag)
  params.set('page', String(page))
  return `/area-do-cliente?${params}`
}

export function Pagination({ filters, hasNextPage, page, totalPages }: { filters: ClientPortalFilters; hasNextPage: boolean; page: number; totalPages: number }) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label="Paginação dos certificados" className="client-pagination">
      {page > 1 ? <Link className="button button-ghost" href={pageURL(filters, page - 1)}>Anterior</Link> : <span />}
      <span>Página {page} de {totalPages}</span>
      {hasNextPage ? <Link className="button button-ghost" href={pageURL(filters, page + 1)}>Próxima</Link> : <span />}
    </nav>
  )
}
