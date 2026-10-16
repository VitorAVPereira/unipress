import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

describe('faixa decorativa do catálogo técnico', () => {
  it('começa depois de 80% da largura para não ficar atrás do título', () => {
    const stylesheet = readFileSync('src/app/(frontend)/globals.css', 'utf8')

    expect(stylesheet).toContain(
      '.page-hero-products { background-image: linear-gradient(90deg, #f5f5f3 0 82%, #ececea 82%); }',
    )
  })
})
