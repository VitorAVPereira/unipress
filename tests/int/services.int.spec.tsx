import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

afterEach(cleanup)

describe('conteúdo da página de serviços', () => {
  it('oferece os três textos do cabeçalho para edição no CMS', async () => {
    const { ServicesPage } = await import('@/globals/ServicesPage')
    const fieldNames = ServicesPage.fields.map((field) => ('name' in field ? field.name : undefined))

    expect(ServicesPage.slug).toBe('services-page')
    expect(fieldNames).toEqual(expect.arrayContaining(['eyebrow', 'title', 'description']))
  })
})

describe('imagem do cabeçalho interno do serviço', () => {
  it('exibe a imagem cadastrada com o texto alternativo', async () => {
    const { ServiceHeroVisual } = await import('@/components/services/ServiceHeroVisual')

    render(<ServiceHeroVisual image={{ url: '/media/calibracao.jpg', alt: 'Laboratório de calibração' }} />)

    const image = screen.getByRole('img', { name: 'Laboratório de calibração' })
    expect(image.getAttribute('src')).toContain('calibracao.jpg')
    expect(screen.queryByText('RBC')).toBeNull()
  })

  it.each([
    ['imagem ausente', undefined],
    ['URL vazia', { url: '', alt: 'Imagem inválida' }],
  ])('mantém o selo RBC quando há %s', async (_case, image) => {
    const { ServiceHeroVisual } = await import('@/components/services/ServiceHeroVisual')

    render(<ServiceHeroVisual image={image} />)

    expect(screen.getByText('RBC')).toBeTruthy()
  })
})
