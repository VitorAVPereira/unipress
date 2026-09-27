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
  })

  it('oferece somente WhatsApp quando o formulário não está configurado', async () => {
    render(await ContactPage())

    expect(screen.getByRole('link', { name: /WhatsApp/ }).getAttribute('href')).toContain('wa.me/5511999999999')
    expect(screen.queryByRole('button', { name: 'Enviar mensagem' })).toBeNull()
    expect(screen.getByText(/atendimento pelo WhatsApp/i)).not.toBeNull()
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
})
