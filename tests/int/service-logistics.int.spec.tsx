import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ServiceDetailPage from '@/app/(frontend)/servicos/[slug]/page'
import { getServiceBySlug, getSiteSettings } from '@/lib/cms'

vi.mock('next/headers', () => ({
  draftMode: vi.fn().mockResolvedValue({ isEnabled: false }),
}))

vi.mock('@/lib/cms', () => ({
  getServiceBySlug: vi.fn(),
  getServices: vi.fn().mockResolvedValue([]),
  getSiteSettings: vi.fn(),
}))

describe('logística da página interna de serviço', () => {
  beforeEach(() => {
    vi.mocked(getServiceBySlug).mockResolvedValue({
      id: 'calibracao-de-pressao',
      slug: 'calibracao-de-pressao',
      title: 'Calibração de Pressão',
      summary: 'Resultados confiáveis e rastreáveis.',
      description: 'Calibração em laboratório.',
      instruments: ['Manômetros'],
      steps: [['Recebimento', 'Conferência inicial.']],
      traceabilityNote: 'Rastreabilidade RBC',
    })
    vi.mocked(getSiteSettings).mockResolvedValue({ whatsapp: '5511999999999' } as never)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('apresenta envio e devolução em dois cartões iguais, sem numeração', async () => {
    render(await ServiceDetailPage({ params: Promise.resolve({ slug: 'calibracao-de-pressao' }) }))

    const logistics = screen.getByRole('region', { name: 'Logística do serviço' })
    const cards = within(logistics).getAllByRole('article')

    expect(cards).toHaveLength(2)
    expect(cards.map((card) => card.className)).toEqual([
      'service-logistics-card',
      'service-logistics-card',
    ])
    expect(within(cards[0]).getByRole('heading', { name: 'Envie de qualquer lugar do Brasil' })).not.toBeNull()
    expect(within(cards[1]).getByRole('heading', { name: 'Receba o instrumento de volta' })).not.toBeNull()
    expect(within(logistics).queryByText(/^(01|02)$/)).toBeNull()
  })
})
