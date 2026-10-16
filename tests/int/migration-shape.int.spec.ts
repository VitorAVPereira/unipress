import { describe, expect, it } from 'vitest'

import { migrations } from '@/migrations'
import * as migration from '@/migrations/20261016_011036_services_families_product_order'

async function emittedSQL(run: typeof migration.up | typeof migration.down) {
  const queries: unknown[] = []
  await run({ db: { execute: async (query: unknown) => queries.push(query) } } as never)
  return JSON.stringify(queries)
}

describe('migração de serviços, famílias e ordem de produtos', () => {
  it('é registrada depois da migração de certificados e antes do snapshot combinado', () => {
    const names = migrations.map(({ name }) => name)

    expect(names).toContain('20261016_011036_services_families_product_order')
    expect(names.indexOf('20261016_011036_services_families_product_order')).toBeGreaterThan(
      names.indexOf('20261012_233634_certificados_padroes'),
    )
    expect(names.at(-1)).toBe('20261016_015705_merge_admin_catalog_reference_snapshot')
  })

  it('cria famílias, migra vínculos e preenche a ordem antes de remover colunas antigas', async () => {
    const statement = await emittedSQL(migration.up)

    expect(statement).toContain('INSERT INTO \\"product_families\\"')
    expect(statement).toContain('Manômetro')
    expect(statement).toContain('Acessório')
    expect(statement).toContain('UPDATE \\"products\\"')
    expect(statement).toContain('UPDATE \\"product_categories\\"')
    expect(statement).toContain('row_number() OVER (ORDER BY')
    expect(statement.indexOf('INSERT INTO \\"product_families\\"')).toBeLessThan(
      statement.indexOf('DROP COLUMN \\"family\\"'),
    )
  })

  it('restaura valores legados antes de remover famílias e bloqueia perda de dados genéricos', async () => {
    const statement = await emittedSQL(migration.down)

    expect(statement).toContain('RAISE EXCEPTION')
    expect(statement).toContain('UPDATE \\"products\\"')
    expect(statement).toContain('UPDATE \\"product_categories\\"')
    expect(statement.indexOf('UPDATE \\"products\\"')).toBeLessThan(
      statement.indexOf('DROP TABLE \\"product_families\\"'),
    )
  })
})
