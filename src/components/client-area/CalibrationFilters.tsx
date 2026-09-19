'use client'

import Link from 'next/link'
import { useState } from 'react'

import type { ClientPortalFilters } from '@/lib/clientPortal'

export function CalibrationFilters({ filters }: { filters: ClientPortalFilters }) {
  const [dateMode, setDateMode] = useState(filters.dateMode)

  return (
    <form className="client-filters" method="get">
      <fieldset className="client-date-mode">
        <legend>Filtrar data por</legend>
        <label><input checked={dateMode === 'month'} name="dateMode" onChange={() => setDateMode('month')} type="radio" value="month" /> Mês</label>
        <label><input checked={dateMode === 'day'} name="dateMode" onChange={() => setDateMode('day')} type="radio" value="day" /> Dia</label>
      </fieldset>
      <label>
        <span>{dateMode === 'month' ? 'Mês' : 'Data'}</span>
        <input defaultValue={filters.date} key={dateMode} name="date" type={dateMode === 'month' ? 'month' : 'date'} />
      </label>
      <label>
        <span>Nº do certificado</span>
        <input defaultValue={filters.certificate} name="certificate" placeholder="Ex.: 02929/2025" />
      </label>
      <label>
        <span>Tag do instrumento</span>
        <input defaultValue={filters.tag} name="tag" placeholder="Ex.: PI-204" />
      </label>
      <div className="client-filter-actions">
        <button className="button button-primary" type="submit">Filtrar</button>
        <Link className="button button-ghost" href="/area-do-cliente">Limpar filtros</Link>
      </div>
    </form>
  )
}
