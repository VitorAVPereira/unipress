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

    render(
      <ServiceHeroVisual
        image={{
          url: '/media/calibracao.jpg',
          alt: 'Laboratório de calibração',
          updatedAt: '2026-10-15T22:00:00.000Z',
        }}
      />,
    )

    const image = screen.getByRole('img', { name: 'Laboratório de calibração' })
    const frame = image.parentElement
    const optimizedSource = new URL(image.getAttribute('src') || '', 'http://localhost').searchParams.get('url')
    expect(optimizedSource).toContain('calibracao.jpg')
    expect(optimizedSource).toContain('2026-10-15T22%3A00%3A00.000Z')
    expect(frame?.style.backgroundColor).toBe('transparent')
    expect(frame?.style.borderWidth).toBe('0px')
    expect(image.style.objectFit).toBe('contain')
    expect(image.style.objectPosition).toBe('center center')
    expect(image.style.padding).toBe('0px')
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
