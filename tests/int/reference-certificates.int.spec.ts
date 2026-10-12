import { describe, expect, it } from 'vitest'

import { ReferenceCertificates } from '@/collections/ReferenceCertificates'
import { ReferenceStandards } from '@/collections/ReferenceStandards'
import {
  MAX_REFERENCE_CERTIFICATE_FILE_SIZE,
  REFERENCE_CERTIFICATES_BLOB_PREFIX,
  normalizeReferenceTag,
  validateReferenceCertificateUpload,
  validateReferenceCertificateYear,
  validateReferenceTag,
} from '@/lib/referenceCertificates'

describe('certificados dos padrões', () => {
  it('normaliza TAGs para busca e unicidade', () => {
    expect(normalizeReferenceTag('PI-20')).toBe('pi20')
    expect(normalizeReferenceTag('PI 20')).toBe('pi20')
    expect(normalizeReferenceTag('pí.20')).toBe('pi20')
  })

  it('rejeita TAG vazia depois da normalização', () => {
    expect(validateReferenceTag('---')).toBe('Informe uma TAG com letras ou números.')
    expect(validateReferenceTag(' PI-20 ')).toBe(true)
  })

  it('aceita somente ano inteiro de quatro dígitos', () => {
    expect(validateReferenceCertificateYear(2026)).toBe(true)
    expect(validateReferenceCertificateYear(1899)).toBe('Informe um ano com quatro dígitos.')
    expect(validateReferenceCertificateYear(2026.5)).toBe('Informe um ano com quatro dígitos.')
    expect(validateReferenceCertificateYear('2026')).toBe('Informe um ano com quatro dígitos.')
  })

  it('aceita somente PDF de até 20 MB', () => {
    expect(validateReferenceCertificateUpload('application/pdf', MAX_REFERENCE_CERTIFICATE_FILE_SIZE)).toBe(true)
    expect(validateReferenceCertificateUpload('image/png', 100)).toBe('Envie um arquivo PDF.')
    expect(
      validateReferenceCertificateUpload('application/pdf', MAX_REFERENCE_CERTIFICATE_FILE_SIZE + 1),
    ).toBe('O PDF deve ter no máximo 20 MB.')
  })

  it('registra as coleções administrativas', () => {
    const accessArgs = (user: unknown) => ({ req: { user } }) as never

    for (const collection of [ReferenceStandards, ReferenceCertificates]) {
      expect(collection.admin?.group).toBe('Certificados dos padrões')
      expect(collection.access?.create?.(accessArgs({ id: 1, collection: 'users' }))).toBe(true)
      expect(collection.access?.read?.(accessArgs(null))).toBe(false)
      expect(collection.access?.update?.(accessArgs({ id: 2, collection: 'clients' }))).toBe(false)
      expect(collection.access?.delete?.(accessArgs(null))).toBe(false)
    }

    expect(ReferenceCertificates.upload).toMatchObject({
      bulkUpload: false,
      mimeTypes: ['application/pdf'],
      pasteURL: false,
      staticDir: 'storage/reference-certificates',
    })
    expect(REFERENCE_CERTIFICATES_BLOB_PREFIX).toBe('reference-certificates')
  })
})
