import { describe, expect, it } from 'vitest'

import { Products } from '@/collections/Products'
import { generatePreviewPath, publicPathForContent } from '@/lib/preview'

describe('pré-visualização do CMS', () => {
  it('mapeia cada conteúdo para sua rota pública', () => {
    expect(publicPathForContent('products', 'manometro-inox')).toBe('/produtos/manometro-inox')
    expect(publicPathForContent('services', 'calibracao')).toBe('/servicos/calibracao')
    expect(publicPathForContent('home')).toBe('/')
    expect(publicPathForContent('about')).toBe('/sobre')
    expect(publicPathForContent('contact')).toBe('/contato')
    expect(publicPathForContent('privacy')).toBe('/privacidade')
  })

  it('gera URL relativa e codificada com o segredo de preview', () => {
    const url = generatePreviewPath({ collection: 'products', slug: 'modelo inox', secret: 'segredo' })

    expect(url).toBe('/next/preview?path=%2Fprodutos%2Fmodelo%2520inox&previewSecret=segredo')
  })

  it('recusa slug ausente em conteúdo dinâmico', () => {
    expect(() => publicPathForContent('products')).toThrow('slug')
  })

  it('não interrompe o cadastro de produto enquanto o slug ainda está vazio', async () => {
    const livePreviewURL = Products.admin?.livePreview?.url
    const previewURL = Products.admin?.preview

    expect(typeof livePreviewURL).toBe('function')
    expect(typeof previewURL).toBe('function')

    expect(
      await (livePreviewURL as (args: { data: Record<string, unknown> }) => unknown)({ data: {} }),
    ).toBeNull()
    expect(await (previewURL as (data: Record<string, unknown>) => unknown)({})).toBeNull()
  })
})
