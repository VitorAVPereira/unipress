import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import FrontendLayout from '@/app/(frontend)/layout'
import { getSiteSettings } from '@/lib/cms'

vi.mock('next/font/google', () => ({
  Inter: () => ({ variable: '--font-body' }),
  Manrope: () => ({ variable: '--font-display' }),
}))

vi.mock('@/lib/cms', () => ({
  getSiteSettings: vi.fn(),
}))

describe('atalho flutuante do WhatsApp', () => {
  beforeEach(() => {
    vi.mocked(getSiteSettings).mockResolvedValue({
      whatsapp: '+55 (11) 99999-9999',
    } as never)
  })

  it('abre uma conversa direta com a UniPress a partir de todas as páginas públicas', async () => {
    const document = new DOMParser().parseFromString(
      renderToStaticMarkup(await FrontendLayout({ children: 'Conteúdo' })),
      'text/html',
    )

    const shortcut = document.querySelector<HTMLAnchorElement>(
      'a[aria-label="Falar com a UniPress pelo WhatsApp"]',
    )

    expect(shortcut).not.toBeNull()
    expect(shortcut?.getAttribute('href')).toBe(
      'https://wa.me/5511999999999?text=Ol%C3%A1%2C+gostaria+de+falar+com+a+UniPress.',
    )
    expect(shortcut?.getAttribute('target')).toBe('_blank')
    expect(shortcut?.getAttribute('rel')).toBe('noreferrer')
  })
})
