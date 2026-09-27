import { describe, expect, it } from 'vitest'

import nextConfig from '../../next.config.mjs'
import { hasLocalMatch } from 'next/dist/shared/lib/match-local-pattern'

describe('imagens locais do Payload', () => {
  it('aceita o cache tag acrescentado às URLs de mídia', () => {
    expect(
      hasLocalMatch(
        nextConfig.images?.localPatterns,
        '/api/media/file/manometro.png?2026-09-06T18%3A20%3A40.469Z',
      ),
    ).toBe(true)
  })

  it('não libera query strings para outros caminhos locais', () => {
    expect(hasLocalMatch(nextConfig.images?.localPatterns, '/imagem-nao-gerenciada.png?qualquer=valor')).toBe(false)
  })
})
