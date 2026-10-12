import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { ReferenceCertificateSearch } from '@/components/reference-certificates/ReferenceCertificateSearch'
import type { PublicReferenceStandard } from '@/lib/publicReferenceCertificates'

const standards: PublicReferenceStandard[] = [
  {
    id: '1',
    tag: 'PI-20',
    searchKey: 'pi20',
    current: {
      id: '11',
      year: 2026,
      label: 'Certificado 2026 — 2/2',
      isCurrent: true,
      viewHref: '/certificados-padroes/11/visualizar',
      downloadHref: '/certificados-padroes/11/baixar',
    },
    history: [
      {
        id: '10',
        year: 2026,
        label: 'Certificado 2026 — 1/2',
        isCurrent: false,
        viewHref: '/certificados-padroes/10/visualizar',
        downloadHref: '/certificados-padroes/10/baixar',
      },
    ],
  },
  {
    id: '2',
    tag: 'PAD-2',
    searchKey: 'pad2',
    current: {
      id: '20',
      year: 2025,
      label: 'Certificado 2025',
      isCurrent: true,
      viewHref: '/certificados-padroes/20/visualizar',
      downloadHref: '/certificados-padroes/20/baixar',
    },
    history: [],
  },
]

afterEach(cleanup)

describe('consulta pública de certificados dos padrões', () => {
  it('destaca o atual e oferece visualização, download e histórico semântico', () => {
    const { container } = render(<ReferenceCertificateSearch standards={standards} />)

    expect(screen.getByRole('heading', { name: 'PI-20' })).not.toBeNull()
    expect(screen.getAllByText('Certificado atual')).toHaveLength(2)
    expect(screen.getByText('Certificado 2026 — 2/2')).not.toBeNull()
    expect(screen.getByRole('link', { name: 'Visualizar Certificado 2026 — 2/2' }).getAttribute('href'))
      .toBe('/certificados-padroes/11/visualizar')
    expect(screen.getByRole('link', { name: 'Baixar Certificado 2026 — 2/2' }).getAttribute('href'))
      .toBe('/certificados-padroes/11/baixar')
    const summary = screen.getByText('Histórico de certificados').closest('summary')
    expect(summary?.tagName).toBe('SUMMARY')
    expect(summary?.tabIndex).toBe(0)
    expect(container.querySelectorAll('details')).toHaveLength(1)
  })

  it('filtra por trecho normalizado da TAG e atualiza o contador ao vivo', () => {
    render(<ReferenceCertificateSearch standards={standards} />)

    const search = screen.getByRole('searchbox', { name: 'Pesquisar por TAG' })
    fireEvent.change(search, { target: { value: ' pí 20 ' } })

    expect(screen.getByRole('heading', { name: 'PI-20' })).not.toBeNull()
    expect(screen.queryByRole('heading', { name: 'PAD-2' })).toBeNull()
    expect(document.querySelector('.reference-result-count')?.textContent?.replace(/\s+/g, ' ').trim())
      .toBe('1 TAG encontrada')
  })

  it('mostra a mensagem exata quando a pesquisa não encontra TAG', () => {
    render(<ReferenceCertificateSearch standards={standards} />)

    fireEvent.change(screen.getByRole('searchbox', { name: 'Pesquisar por TAG' }), {
      target: { value: 'inexistente' },
    })

    expect(screen.getByText('Nenhuma TAG encontrada. Confira a identificação informada.')).not.toBeNull()
  })

  it('mostra estado institucional quando não há certificados publicados', () => {
    render(<ReferenceCertificateSearch standards={[]} />)

    expect(screen.getByRole('heading', { name: 'Nenhum certificado está disponível.' })).not.toBeNull()
    expect(screen.queryByRole('searchbox')).toBeNull()
  })
})
