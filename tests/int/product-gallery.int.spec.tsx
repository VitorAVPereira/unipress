import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ProductDetailPage from '@/app/(frontend)/produtos/[slug]/page'
import { getProductBySlug, getSiteSettings } from '@/lib/cms'

vi.mock('next/headers', () => ({
  draftMode: vi.fn().mockResolvedValue({ isEnabled: false }),
}))

vi.mock('@/lib/cms', () => ({
  getProductBySlug: vi.fn(),
  getProducts: vi.fn().mockResolvedValue([]),
  getSiteSettings: vi.fn(),
}))

const images = [
  { url: '/media/frente.webp', alt: 'Vista frontal' },
  { url: '/media/traseira.webp', alt: 'Vista traseira' },
  { url: '/media/conexao.webp', alt: 'Detalhe da conexão' },
]

function product() {
  return {
    id: 'produto-1',
    slug: 'manometro-analogico',
    name: 'Manômetro analógico',
    code: 'UNI-CL-V-63',
    summary: 'Medição de pressão',
    description: 'Descrição do produto',
    family: { name: 'Manômetro', slug: 'manometro', technicalProfile: 'manometro' },
    category: 'Manômetros',
    applications: [],
    diameters: [],
    accuracyClasses: [],
    connections: [],
    materials: [],
    fillings: [],
    pressureRanges: [],
    pressureUnits: [],
    connectionPositions: [],
    protectionRatings: [],
    accessoryTypes: [],
    compatibility: [],
    specifications: [],
    image: images[0],
    images,
  }
}

async function renderPage() {
  render(await ProductDetailPage({ params: Promise.resolve({ slug: 'manometro-analogico' }) }))
}

describe('galeria da página de produto', () => {
  beforeEach(() => {
    vi.mocked(getProductBySlug).mockResolvedValue(product() as never)
    vi.mocked(getSiteSettings).mockResolvedValue({ whatsapp: '' } as never)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('preserva a ordem cadastrada no admin e amplia a miniatura selecionada', async () => {
    await renderPage()

    const thumbnails = screen.getAllByRole('button', { name: /^Exibir / })
    expect(thumbnails.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Exibir Vista frontal',
      'Exibir Vista traseira',
      'Exibir Detalhe da conexão',
    ])
    expect(screen.getByRole('img', { name: 'Vista frontal — imagem 1 de 3' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Exibir Detalhe da conexão' }))

    expect(screen.getByRole('img', { name: 'Detalhe da conexão — imagem 3 de 3' })).toBeTruthy()
  })

  it('navega lateralmente pelas fotos e reinicia ao chegar ao final', async () => {
    await renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Próxima imagem' }))
    expect(screen.getByRole('img', { name: 'Vista traseira — imagem 2 de 3' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Imagem anterior' }))
    fireEvent.click(screen.getByRole('button', { name: 'Imagem anterior' }))
    expect(screen.getByRole('img', { name: 'Detalhe da conexão — imagem 3 de 3' })).toBeTruthy()
  })
})
