import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Where } from 'payload'

import { logoutClientAction } from './actions'
import { CalibrationFilters } from '@/components/client-area/CalibrationFilters'
import { Pagination } from '@/components/client-area/Pagination'
import { buildCalibrationWhere, buildSummaryDateRanges, parseClientPortalFilters } from '@/lib/clientPortal'
import { getClientSession } from '@/lib/clientSession'

export const metadata: Metadata = { title: 'Área do cliente', robots: { index: false, follow: false } }

function asURLSearchParams(values: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item))
    else if (value != null) params.set(key, value)
  }
  return params
}

function formatCalibrationDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value))
}

export default async function ClientAreaPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getClientSession()
  if (!session) redirect('/area-do-cliente/entrar')
  const filters = parseClientPortalFilters(asURLSearchParams(await searchParams))
  const clientID = session.client.id
  const summaryRanges = buildSummaryDateRanges()
  const baseWhere: Where = { client: { equals: clientID } }

  const [calibrations, total, yearTotal, monthTotal] = await Promise.all([
    session.payload.find({
      collection: 'calibrations',
      where: buildCalibrationWhere(clientID, filters) as Where,
      depth: 0,
      limit: 25,
      page: filters.page,
      sort: '-calibrationDate',
      overrideAccess: false,
      req: session.req,
    }),
    session.payload.count({ collection: 'calibrations', where: baseWhere, overrideAccess: false, req: session.req }),
    session.payload.count({ collection: 'calibrations', where: { and: [baseWhere, { calibrationDate: summaryRanges.year }] }, overrideAccess: false, req: session.req }),
    session.payload.count({ collection: 'calibrations', where: { and: [baseWhere, { calibrationDate: summaryRanges.month }] }, overrideAccess: false, req: session.req }),
  ])

  return (
    <section className="client-area section">
      <div className="container">
        <div className="client-area-heading">
          <div>
            <span className="eyebrow"><span />Área do cliente</span>
            <h1>Olá, {session.client.legalName}</h1>
            <p>Consulte e baixe o histórico de calibrações da sua empresa.</p>
          </div>
          <form action={logoutClientAction}><button className="button button-ghost" type="submit">Sair</button></form>
        </div>
        <div className="client-metrics" aria-label="Resumo de certificados">
          <article><strong>{total.totalDocs}</strong><span>Certificados</span></article>
          <article><strong>{yearTotal.totalDocs}</strong><span>Feitos neste ano</span></article>
          <article><strong>{monthTotal.totalDocs}</strong><span>Feitos este mês</span></article>
        </div>
        <div className="client-history-heading"><h2>Histórico de calibrações</h2><span>{calibrations.totalDocs} registro(s) encontrado(s)</span></div>
        <CalibrationFilters filters={filters} />
        {calibrations.docs.length ? (
          <div className="client-calibration-list">
            <div className="client-calibration-row client-calibration-head" aria-hidden="true"><span>Data</span><span>Certificado</span><span>Tag</span><span /></div>
            {calibrations.docs.map((calibration) => (
              <article className="client-calibration-row" key={calibration.id}>
                <span data-label="Data">{formatCalibrationDate(calibration.calibrationDate)}</span>
                <strong data-label="Certificado">{calibration.certificateNumber}</strong>
                <span data-label="Tag">{calibration.tag}</span>
                <Link className="client-pdf-link" href={`/area-do-cliente/certificados/${calibration.id}/pdf`} target="_blank">Abrir PDF</Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="client-empty"><h3>{total.totalDocs ? 'Nenhum resultado encontrado' : 'Nenhum certificado disponível'}</h3><p>{total.totalDocs ? 'Revise ou limpe os filtros para tentar novamente.' : 'Os certificados aparecerão aqui após o cadastro pela UniPress.'}</p></div>
        )}
        <Pagination filters={filters} hasNextPage={calibrations.hasNextPage} page={calibrations.page || 1} totalPages={calibrations.totalPages} />
      </div>
    </section>
  )
}
