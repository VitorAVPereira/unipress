// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TextField } from 'payload'

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules() })

describe('entrega das imagens públicas', () => {
  it('serve fotos pelo CDN sem passar pela função do Payload', async () => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'vercel_blob_rw_test_secret')
    vi.resetModules()
    const { plugins } = await import('@/plugins')
    const config = await plugins[0]({ collections: [{ slug: 'media', fields: [], upload: true }] } as never)
    const field = config.collections?.[0].fields.find((f) => 'name' in f && f.name === 'url') as TextField
    const hook = field.hooks?.afterRead?.[0]
    expect(hook).toBeTypeOf('function')
    const url = await hook!({ data: { filename: 'manometro.png' }, value: '/api/media/file/manometro.png' } as never)
    expect(url).toBe('https://test.public.blob.vercel-storage.com/manometro.png')
  }, 30_000)
})
