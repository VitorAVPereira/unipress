import { cleanup, render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import FrontendLayout from '@/app/(frontend)/layout'
import HomePage from '@/app/(frontend)/page'
import AboutPage from '@/app/(frontend)/sobre/page'
import { getAboutContent, getHomeContent, getServices, getSiteSettings } from '@/lib/cms'

vi.mock('next/font/google', () => ({
  Inter: () => ({ variable: '--font-body' }),
  Manrope: () => ({ variable: '--font-display' }),
}))

vi.mock('next/headers', () => ({
  draftMode: vi.fn().mockResolvedValue({ isEnabled: false }),
}))

vi.mock('@/lib/cms', () => ({
  getAboutContent: vi.fn(),
  getHomeContent: vi.fn(),
  getServices: vi.fn(),
  getSiteSettings: vi.fn(),
}))

const media = (url: string, alt: string) => ({
  id: 1,
  alt,
  createdAt: '2026-09-07T00:00:00.000Z',
  updatedAt: '2026-09-07T00:00:00.000Z',
  url,
})

describe('imagens editoriais', () => {
  beforeEach(() => {
    vi.mocked(getSiteSettings).mockResolvedValue({ whatsapp: '' } as never)
    vi.mocked(getServices).mockResolvedValue([])
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('exibe a imagem cadastrada na página Sobre', async () => {
    vi.mocked(getAboutContent).mockResolvedValue({
      title: 'Sobre',
      intro: 'Introdução',
      content: 'Conteúdo',
      image: media('/media/sobre.webp', 'Equipe UniPress'),
    })

    render(await AboutPage())

    expect(screen.getByRole('img', { name: 'Equipe UniPress' })).not.toBeNull()
  })

  it('mantém o desenho atual da página Sobre quando não há imagem', async () => {
    vi.mocked(getAboutContent).mockResolvedValue({
      title: 'Sobre',
      intro: 'Introdução',
      content: 'Conteúdo',
    })

    const { container } = render(await AboutPage())

    expect(container.querySelector('.about-visual .gauge')).not.toBeNull()
  })

  it('exibe as imagens cadastradas nos dois cards de soluções', async () => {
    vi.mocked(getHomeContent).mockResolvedValue({
      eyebrow: 'Chamada',
      title: 'Página inicial',
      description: 'Descrição',
      heroImage: null,
      manometersImage: media('/media/manometros.webp', 'Ícone de manômetros'),
      accessoriesImage: media('/media/acessorios.webp', 'Ícone de acessórios'),
      benefits: [],
    } as never)

    render(await HomePage())

    expect(screen.getByRole('img', { name: 'Ícone de manômetros' })).not.toBeNull()
    expect(screen.getByRole('img', { name: 'Ícone de acessórios' })).not.toBeNull()
  })

  it('leva a chamada de calibração ao contato quando não há serviço publicado', async () => {
    vi.mocked(getHomeContent).mockResolvedValue({
      eyebrow: 'Chamada',
      title: 'Página inicial',
      description: 'Descrição',
      heroImage: null,
      benefits: [],
    } as never)

    render(await HomePage())

    expect(screen.getByRole('link', { name: /Conhecer o serviço/ }).getAttribute('href')).toBe('/contato')
  })

  it('mantém os desenhos atuais dos cards quando não há imagens cadastradas', async () => {
    vi.mocked(getHomeContent).mockResolvedValue({
      eyebrow: 'Chamada',
      title: 'Página inicial',
      description: 'Descrição',
      heroImage: null,
      benefits: [],
    } as never)

    const { container } = render(await HomePage())

    expect(container.querySelector('.category-dark .gauge')).not.toBeNull()
    expect(container.querySelector('.category-light .accessory-visual')).not.toBeNull()
  })

  it('exibe no banner os três destaques editados no CMS', async () => {
    vi.mocked(getHomeContent).mockResolvedValue({
      eyebrow: 'Chamada',
      title: 'Página inicial',
      description: 'Descrição',
      heroImage: null,
      heroProofOne: 'Entrega para todo o país',
      heroProofTwo: 'Suporte especializado',
      heroProofThree: 'Atendimento consultivo',
      benefits: [],
    } as never)

    render(await HomePage())

    expect(screen.getByText('Entrega para todo o país')).not.toBeNull()
    expect(screen.getByText('Suporte especializado')).not.toBeNull()
    expect(screen.getByText('Atendimento consultivo')).not.toBeNull()
  })

  it('preserva a proporção de todas as imagens editoriais', async () => {
    vi.mocked(getHomeContent).mockResolvedValue({
      eyebrow: 'Chamada',
      title: 'Página inicial',
      description: 'Descrição',
      heroImage: media('/media/principal.webp', 'Imagem principal'),
      manometersImage: media('/media/manometros.webp', 'Ícone de manômetros'),
      accessoriesImage: media('/media/acessorios.webp', 'Ícone de acessórios'),
      benefits: [],
    } as never)

    render(await HomePage())

    for (const name of ['Imagem principal', 'Ícone de manômetros', 'Ícone de acessórios']) {
      expect(screen.getByRole<HTMLImageElement>('img', { name }).style.objectFit).toBe('contain')
    }
  })

  it('usa logos independentes no cabeçalho e no rodapé', async () => {
    vi.mocked(getSiteSettings).mockResolvedValue({
      whatsapp: '',
      headerLogo: media('/media/logo-cabecalho.webp', 'Logo do cabeçalho'),
      footerLogo: media('/media/logo-rodape.webp', 'Logo do rodapé'),
    } as never)

    const document = new DOMParser().parseFromString(
      renderToStaticMarkup(await FrontendLayout({ children: 'Conteúdo' })),
      'text/html',
    )

    expect(document.querySelector('header img')?.getAttribute('alt')).toBe('Logo do cabeçalho')
    expect(document.querySelector('footer img')?.getAttribute('alt')).toBe('Logo do rodapé')
  })

  it('mantém o desenho padrão somente na posição sem logo cadastrada', async () => {
    vi.mocked(getSiteSettings).mockResolvedValue({
      whatsapp: '',
      headerLogo: null,
      footerLogo: media('/media/logo-rodape.webp', 'Logo exclusiva do rodapé'),
    } as never)

    const document = new DOMParser().parseFromString(
      renderToStaticMarkup(await FrontendLayout({ children: 'Conteúdo' })),
      'text/html',
    )

    expect(document.querySelector('header .brand-mark')).not.toBeNull()
    expect(document.querySelector('footer img')?.getAttribute('alt')).toBe('Logo exclusiva do rodapé')
  })
})
