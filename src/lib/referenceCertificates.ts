export const MAX_REFERENCE_CERTIFICATE_FILE_SIZE = 20 * 1024 * 1024
export const REFERENCE_CERTIFICATES_BLOB_PREFIX = 'reference-certificates'

export type ReplacementCandidate = {
  id: number | string
  year?: number | null
  createdAt?: string | null
  _status?: string | null
  filename?: string | null
  mimeType?: string | null
}

export function normalizeReferenceTag(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
}

export function validateReferenceTag(value: unknown): true | string {
  return typeof value === 'string' && normalizeReferenceTag(value)
    ? true
    : 'Informe uma TAG com letras ou números.'
}

export function validateReferenceCertificateYear(value: unknown): true | string {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1900 && value <= 9999
    ? true
    : 'Informe um ano com quatro dígitos.'
}

export function validateReferenceCertificateUpload(mimeType: unknown, size: unknown): true | string {
  if (mimeType !== 'application/pdf') return 'Envie um arquivo PDF.'
  if (
    typeof size !== 'number' ||
    !Number.isFinite(size) ||
    size <= 0 ||
    size > MAX_REFERENCE_CERTIFICATE_FILE_SIZE
  ) {
    return 'O PDF deve ter no máximo 20 MB.'
  }

  return true
}

export function selectReplacementReferenceCertificate<T extends ReplacementCandidate>(docs: T[]): T | undefined {
  return [...docs]
    .filter(
      (doc) =>
        doc._status === 'published' &&
        Boolean(doc.filename) &&
        doc.mimeType === 'application/pdf',
    )
    .sort((left, right) => {
      const yearDifference = (right.year || 0) - (left.year || 0)
      if (yearDifference) return yearDifference

      const createdDifference = String(right.createdAt || '').localeCompare(String(left.createdAt || ''))
      if (createdDifference) return createdDifference

      return String(right.id).localeCompare(String(left.id), 'pt-BR', { numeric: true })
    })[0]
}
