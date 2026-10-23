import { cleanup, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ContactPage from '@/app/(frontend)/contato/page'
import ForgotPasswordPage from '@/app/(frontend)/area-do-cliente/esqueci-senha/page'
import { LoginForm } from '@/components/client-area/AuthForms'
import { CatalogClient } from '@/components/products/CatalogClient'
import { getContactContent, getSiteSettings } from '@/lib/cms'

vi.mock('next/headers', () => ({
  draftMode: vi.fn().mockResolvedValue({ isEnabled: false }),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/produtos',
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/lib/cms', () => ({
  getContactContent: vi.fn(),
  getSiteSettings: vi.fn(),
}))

describe('interface do lançamento institucional', () => {
  beforeEach(() => {
    vi.mocked(getContactContent).mockResolvedValue({
      title: 'Vamos conversar',
      description: 'Atendimento comercial',
      content: '',
    })
    vi.mocked(getSiteSettings).mockResolvedValue({
      whatsapp: '5511999999999',
      businessHours: 'Segunda a sexta',
    } as never)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('mantém o formulário visível e permite enviar pelo WhatsApp sem configuração de e-mail', async () => {
    render(await ContactPage())

    expect(screen.getByRole('link', { name: /WhatsApp/ }).getAttribute('href')).toContain('wa.me/5511999999999')
    expect(screen.getByRole('button', { name: 'Enviar pelo WhatsApp' })).not.toBeNull()
    for (const label of ['Nome *', 'Empresa', 'Celular', 'E-mail', 'CNPJ', 'Telefone', 'Mensagem *']) {
      expect(screen.getByLabelText(label)).not.toBeNull()
    }
    expect(screen.queryByText(/será disponibilizado em breve/)).toBeNull()
  })

  it('exibe o formulário quando o envio está configurado e o admin definiu o e-mail', async () => {
    vi.stubEnv('RESEND_API_KEY', 'resend-key')
    vi.stubEnv('RESEND_FROM_EMAIL', 'site@example.com')
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'site-key')
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret-key')
    vi.mocked(getSiteSettings).mockResolvedValue({
      whatsapp: '5511999999999',
      email: 'comercial@example.com',
      businessHours: 'Segunda a sexta',
    } as never)

    render(await ContactPage())

    expect(screen.getByRole('button', { name: 'Enviar mensagem' })).not.toBeNull()
    expect(screen.getByRole('link', { name: /WhatsApp/ })).not.toBeNull()
  })

  it('não anuncia recuperação por e-mail quando o adaptador está desativado', () => {
    render(createElement(LoginForm))

    expect(screen.queryByRole('link', { name: 'Esqueci minha senha' })).toBeNull()
    expect(screen.getByText(/recuperação de acesso/i)).not.toBeNull()
  })

  it('orienta o cliente a procurar atendimento ao abrir a rota de recuperação', () => {
    render(createElement(ForgotPasswordPage))

    expect(screen.queryByRole('textbox', { name: 'E-mail' })).toBeNull()
    expect(screen.getByText(/fale com a equipe UniPress/i)).not.toBeNull()
  })

  it('explica que o catálogo vazio ainda está sendo atualizado', () => {
    render(createElement(CatalogClient, { products: [] }))

    expect(screen.getByRole('heading', { name: 'Catálogo em atualização.' })).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).toBeNull()
  })

  it('não oferece família como filtro visível do catálogo', () => {
    const product = (id: string, family: string, category: string) => ({
      id,
      slug: id,
      name: id,
      code: id,
      summary: id,
      description: id,
      family: { slug: family, name: family, technicalProfile: 'generico' },
      category,
      applications: [],
      diameters: [],
      accuracyClasses: [],
      connections: [],
      materials: [],
      fillings: [],
      specifications: [],
      images: [],
    })

    render(createElement(CatalogClient, {
      products: [product('Produto A', 'Família A', 'Categoria A'), product('Produto B', 'Família B', 'Categoria B')],
    } as never))

    expect(screen.queryByText('Família', { selector: 'legend' })).toBeNull()
    expect(screen.getByText('Categoria', { selector: 'legend' })).not.toBeNull()
  })
})
