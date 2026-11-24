// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { createCalibrationBlobPlugin } from '@/plugins'
import { migrations } from '@/migrations'
import { up } from '@/migrations/20261124_010000_calibrations_storage_prefix'

describe('calibration storage schema', () => {
  it('keeps the prefix field with and without a Blob token', async () => {
    for (const token of ['', 'vercel_blob_rw_test_secret']) {
      const config = await createCalibrationBlobPlugin(token)({
        collections: [{ slug: 'calibrations', fields: [], upload: true }],
      } as never)
      const prefix = config.collections?.[0].fields.find((field) => 'name' in field && field.name === 'prefix')
      expect(prefix).toMatchObject({ name: 'prefix', type: 'text', defaultValue: 'certificates' })
    }
  })

  it('registers an additive migration after the existing migrations', async () => {
    expect(migrations.at(-1)?.name).toBe('20261124_010000_calibrations_storage_prefix')
    const statements: unknown[] = []
    await up({ db: { execute: async (query: unknown) => statements.push(query) } } as never)
    const sql = JSON.stringify(statements)
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS')
    expect(sql).toContain('prefix')
    expect(sql).not.toMatch(/DROP|DELETE|UPDATE|NOT NULL/)
  })

  it('advances the schema snapshot with only the missing nullable column', () => {
    const previous = JSON.parse(readFileSync('src/migrations/20261016_015705_merge_admin_catalog_reference_snapshot.json', 'utf8'))
    const next = JSON.parse(readFileSync('src/migrations/20261124_010000_calibrations_storage_prefix.json', 'utf8'))
    expect(next.prevId).toBe(previous.id)
    expect(next.tables['public.calibrations'].columns.prefix).toEqual({
      name: 'prefix', type: 'varchar', primaryKey: false, notNull: false,
    })
    delete next.tables['public.calibrations'].columns.prefix
    expect(next.tables).toEqual(previous.tables)
  })
})
