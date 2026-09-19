import config from '@/payload.config'
import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

let payload: Payload

describe('CMS UniPress', () => {
  beforeAll(async () => {
    payload = await getPayload({ config })
  })

  it('expõe apenas as coleções necessárias ao site institucional', () => {
    const slugs = Object.keys(payload.collections)

    expect(slugs).toEqual(
      expect.arrayContaining([
        'users',
        'media',
        'documents',
        'product-categories',
        'products',
        'services',
        'clients',
        'calibrations',
        'audit-events',
      ]),
    )
    expect(slugs).not.toContain('posts')
  })

  it('expõe configurações institucionais editáveis', () => {
    const slugs = payload.globals.config.map((global) => global.slug)

    expect(slugs).toEqual(expect.arrayContaining(['site-settings', 'home', 'about', 'contact', 'privacy']))
  })

  it('permite editar navegação e dados comerciais sem código', () => {
    const settings = payload.globals.config.find((global) => global.slug === 'site-settings')
    const fieldNames = settings?.fields.map((field) => ('name' in field ? field.name : undefined))

    expect(fieldNames).toEqual(expect.arrayContaining(['navigation', 'whatsapp', 'phone', 'email', 'address']))
  })

  it('permite editar as imagens dos cards de soluções na página inicial', () => {
    const home = payload.globals.config.find((global) => global.slug === 'home')
    const imageFields = home?.fields.filter(
      (field) => 'name' in field && ['manometersImage', 'accessoriesImage'].includes(field.name),
    )

    expect(imageFields).toEqual([
      expect.objectContaining({ name: 'manometersImage', relationTo: 'media', type: 'relationship' }),
      expect.objectContaining({ name: 'accessoriesImage', relationTo: 'media', type: 'relationship' }),
    ])
  })

  it('permite editar os três destaques do banner na página inicial', () => {
    const home = payload.globals.config.find((global) => global.slug === 'home')
    const proofFields = home?.fields.filter(
      (field) =>
        'name' in field &&
        ['heroProofOne', 'heroProofTwo', 'heroProofThree'].includes(field.name),
    )

    expect(proofFields).toEqual([
      expect.objectContaining({ name: 'heroProofOne', type: 'text' }),
      expect.objectContaining({ name: 'heroProofTwo', type: 'text' }),
      expect.objectContaining({ name: 'heroProofThree', type: 'text' }),
    ])
  })

  it('configura clientes com autenticação e certificados PDF privados', () => {
    const clients = payload.collections.clients.config
    const calibrations = payload.collections.calibrations.config

    expect(clients.auth).toMatchObject({
      lockTime: 15 * 60 * 1000,
      maxLoginAttempts: 5,
      tokenExpiration: 8 * 60 * 60,
      useSessions: true,
    })
    expect(calibrations.upload).toMatchObject({
      bulkUpload: false,
      mimeTypes: ['application/pdf'],
    })
    expect(calibrations.admin.group).toBe('Área do cliente')
    expect(payload.collections['audit-events'].config.access.create).toBeDefined()
  })
})
