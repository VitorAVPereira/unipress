import { describe, expect, it } from 'vitest'

import { adminOnly, calibrationsReadAccess, clientsReadAccess } from '@/access/portal'
import { anonymizeAuditEvents, recordAuditEvent } from '@/lib/audit'
import { sanitizeCalibrationForClient } from '@/hooks/calibrationLifecycle'
import { prepareClientAccount } from '@/hooks/clientLifecycle'
import {
  findOrphanedCertificateBlobs,
  isCronAuthorized,
} from '@/lib/certificateCleanup'
import {
  buildCalibrationDateRange,
  buildCalibrationWhere,
  buildSummaryDateRanges,
  canClientLogin,
  certificateResponseHeaders,
  escapeHTML,
  hasCertificateYearMismatch,
  normalizeCNPJ,
  normalizeEmail,
  parseClientPortalFilters,
  validateCertificateNumber,
  validateCertificateUpload,
  validateCNPJ,
} from '@/lib/clientPortal'

describe('regras da área do cliente', () => {
  it('normaliza e valida CNPJ com 14 dígitos', () => {
    expect(normalizeCNPJ('12.345.678/0001-90')).toBe('12345678000190')
    expect(validateCNPJ('12.345.678/0001-90')).toBe(true)
    expect(validateCNPJ('123')).toBe(false)
  })

  it('normaliza e-mail para garantir unicidade consistente', () => {
    expect(normalizeEmail('  CLIENTE@EXEMPLO.COM.BR ')).toBe('cliente@exemplo.com.br')
  })

  it('escapa conteúdo dinâmico usado em e-mails', () => {
    expect(escapeHTML('<Empresa & Filhos>')).toBe('&lt;Empresa &amp; Filhos&gt;')
  })

  it('aceita apenas certificado no formato 00000/AAAA', () => {
    expect(validateCertificateNumber('02929/2025')).toBe(true)
    expect(validateCertificateNumber('2929/2025')).toBe(false)
    expect(validateCertificateNumber('02929-2025')).toBe(false)
  })

  it('detecta divergência entre ano do certificado e data da calibração', () => {
    expect(hasCertificateYearMismatch('02929/2025', '2026-01-10')).toBe(true)
    expect(hasCertificateYearMismatch('02929/2025', '2025-12-10')).toBe(false)
  })

  it('lê filtros combináveis e remove espaços externos', () => {
    expect(
      parseClientPortalFilters(
        new URLSearchParams('dateMode=month&date=2026-09&certificate=029&tag= PI-20 &page=2'),
      ),
    ).toEqual({
      dateMode: 'month',
      date: '2026-09',
      certificate: '029',
      tag: 'PI-20',
      page: 2,
    })
  })

  it('calcula intervalos UTC semiabertos para mês e dia', () => {
    expect(buildCalibrationDateRange('month', '2026-09')).toEqual({
      greater_than_equal: '2026-09-01T00:00:00.000Z',
      less_than: '2026-10-01T00:00:00.000Z',
    })
    expect(buildCalibrationDateRange('day', '2026-09-06')).toEqual({
      greater_than_equal: '2026-09-06T00:00:00.000Z',
      less_than: '2026-09-07T00:00:00.000Z',
    })
  })

  it('combina cliente, data, certificado e Tag na consulta', () => {
    expect(
      buildCalibrationWhere(42, {
        dateMode: 'day',
        date: '2026-09-06',
        certificate: '029',
        tag: 'PI-20',
        page: 1,
      }),
    ).toEqual({
      and: [
        { client: { equals: 42 } },
        {
          calibrationDate: {
            greater_than_equal: '2026-09-06T00:00:00.000Z',
            less_than: '2026-09-07T00:00:00.000Z',
          },
        },
        { certificateNumber: { contains: '029' } },
        { tag: { contains: 'PI-20' } },
      ],
    })
  })

  it('calcula ano e mês correntes no fuso de São Paulo', () => {
    expect(buildSummaryDateRanges(new Date('2026-09-06T05:00:00.000Z'))).toEqual({
      year: {
        greater_than_equal: '2026-01-01T00:00:00.000Z',
        less_than: '2027-01-01T00:00:00.000Z',
      },
      month: {
        greater_than_equal: '2026-09-01T00:00:00.000Z',
        less_than: '2026-10-01T00:00:00.000Z',
      },
    })
  })

  it('permite login apenas para clientes ativos', () => {
    expect(canClientLogin('active')).toBe(true)
    expect(canClientLogin('pending')).toBe(false)
    expect(canClientLogin('inactive')).toBe(false)
  })

  it('aceita somente PDF de até 20 MB', () => {
    expect(validateCertificateUpload('application/pdf', 20 * 1024 * 1024)).toBe(true)
    expect(validateCertificateUpload('image/png', 100)).toBe('Envie um arquivo PDF.')
    expect(validateCertificateUpload('application/pdf', 20 * 1024 * 1024 + 1)).toBe(
      'O PDF deve ter no máximo 20 MB.',
    )
  })

  it('protege a resposta do certificado contra cache e confusão de tipo', () => {
    const headers = certificateResponseHeaders('certificado"\r\n.pdf')
    expect(headers.get('cache-control')).toBe('private, no-store')
    expect(headers.get('content-type')).toBe('application/pdf')
    expect(headers.get('content-disposition')).toBe('inline; filename="certificado___.pdf"')
    expect(headers.get('x-content-type-options')).toBe('nosniff')
  })
})

describe('autorização da área do cliente', () => {
  const accessArgs = (user: unknown) => ({ req: { user } }) as never

  it('restringe operações administrativas à coleção users', () => {
    expect(adminOnly(accessArgs({ id: 1, collection: 'users' }))).toBe(true)
    expect(adminOnly(accessArgs({ id: 2, collection: 'clients', status: 'active' }))).toBe(false)
    expect(adminOnly(accessArgs(null))).toBe(false)
  })

  it('permite que cliente ativo leia apenas o próprio cadastro', () => {
    expect(clientsReadAccess(accessArgs({ id: 2, collection: 'clients', status: 'active' }))).toEqual({
      id: { equals: 2 },
    })
    expect(clientsReadAccess(accessArgs({ id: 2, collection: 'clients', status: 'inactive' }))).toBe(false)
    expect(clientsReadAccess(accessArgs({ id: 1, collection: 'users' }))).toBe(true)
  })

  it('isola calibrações pelo cliente autenticado', () => {
    expect(calibrationsReadAccess(accessArgs({ id: 2, collection: 'clients', status: 'active' }))).toEqual({
      client: { equals: 2 },
    })
    expect(calibrationsReadAccess(accessArgs({ id: 3, collection: 'clients', status: 'pending' }))).toBe(false)
    expect(calibrationsReadAccess(accessArgs({ id: 1, collection: 'users' }))).toBe(true)
  })

  it('não expõe localização nem metadados internos do Blob ao cliente', () => {
    expect(
      sanitizeCalibrationForClient(
        { id: 1, certificateNumber: '02929/2025', filename: 'secret.pdf', url: 'https://private.example/secret.pdf', filesize: 10 },
        { collection: 'clients' },
      ),
    ).toEqual({ id: 1, certificateNumber: '02929/2025' })
  })
})

describe('criação de clientes', () => {
  it('sempre substitui a senha inicial por um segredo aleatório não divulgado', () => {
    const data = { password: 'senha-escolhida-pelo-admin' }
    const result = prepareClientAccount({ data, operation: 'create' } as never) as typeof data

    expect(result.password).not.toBe('senha-escolhida-pelo-admin')
    expect(result.password.length).toBeGreaterThanOrEqual(32)
  })
})

describe('auditoria', () => {
  it('registra o administrador e apenas detalhes técnicos fornecidos', async () => {
    const calls: unknown[] = []
    const req = {
      user: { id: 7, collection: 'users' },
      payload: {
        create: async (args: unknown) => {
          calls.push(args)
          return args
        },
      },
    }

    await recordAuditEvent(req as never, {
      action: 'client.deactivated',
      entityType: 'client',
      entityReference: 'client:42',
      details: { status: 'inactive' },
    })

    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({
      collection: 'audit-events',
      data: {
        actor: 7,
        action: 'client.deactivated',
        entityType: 'client',
        entityReference: 'client:42',
        details: { status: 'inactive' },
      },
      overrideAccess: true,
    })
  })

  it('remove referências e detalhes pessoais preservando o evento técnico', async () => {
    const updates: unknown[] = []
    let findCall = 0
    const req = {
      payload: {
        find: async () => ({ docs: findCall++ === 0 ? [{ id: 9 }] : [] }),
        update: async (args: unknown) => updates.push(args),
      },
    }

    await anonymizeAuditEvents(req as never, ['client:42', 'calibration:7'], 'deleted-client:anonymous')

    expect(updates).toEqual([
      expect.objectContaining({
        collection: 'audit-events',
        id: 9,
        data: {
          details: { personalDataRemoved: true },
          entityReference: 'deleted-client:anonymous',
        },
        overrideAccess: true,
      }),
    ])
  })
})

describe('limpeza de uploads abandonados', () => {
  it('seleciona somente arquivos sem calibração após uma hora', () => {
    const cutoff = new Date('2026-09-06T11:00:00.000Z')
    const blobs = [
      { url: 'https://blob/linked.pdf', uploadedAt: new Date('2026-09-06T10:00:00.000Z') },
      { url: 'https://blob/orphan.pdf', uploadedAt: new Date('2026-09-06T10:30:00.000Z') },
      { url: 'https://blob/recent.pdf', uploadedAt: new Date('2026-09-06T11:30:00.000Z') },
    ]

    expect(findOrphanedCertificateBlobs(blobs, new Set(['https://blob/linked.pdf']), cutoff)).toEqual([
      blobs[1],
    ])
  })

  it('protege a rotina pelo segredo do cron', () => {
    expect(isCronAuthorized('Bearer segredo', 'segredo')).toBe(true)
    expect(isCronAuthorized('Bearer incorreto', 'segredo')).toBe(false)
    expect(isCronAuthorized(null, 'segredo')).toBe(false)
    expect(isCronAuthorized('Bearer segredo', undefined)).toBe(false)
  })
})
