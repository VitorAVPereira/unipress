import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { MobileMenu } from '@/components/site/MobileMenu'

afterEach(cleanup)

const links = [
  ['Produtos', '/produtos'],
  ['Serviços', '/servicos'],
] as const

function renderMenu() {
  return render(<MobileMenu links={links} whatsappURL="https://wa.me/5511999999999" />)
}

describe('menu móvel', () => {
  it('começa fechado e abre pelo botão', () => {
    renderMenu()

    const button = screen.getByRole('button', { name: 'Abrir menu' })
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('navigation', { name: 'Menu móvel' })).toBeNull()

    fireEvent.click(button)

    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('navigation', { name: 'Menu móvel' })).toBeTruthy()
  })

  it('fecha com Escape', () => {
    renderMenu()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.getByRole('button', { name: 'Abrir menu' }).getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('navigation', { name: 'Menu móvel' })).toBeNull()
  })

  it.each([
    ['link interno', 'Produtos'],
    ['link do WhatsApp', 'Fale no WhatsApp'],
  ])('fecha ao acionar o %s', (_case, linkName) => {
    renderMenu()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))

    fireEvent.click(screen.getByRole('link', { name: linkName }))

    expect(screen.getByRole('button', { name: 'Abrir menu' }).getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('navigation', { name: 'Menu móvel' })).toBeNull()
  })
})
