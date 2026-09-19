export type ClientPortalDateMode = 'month' | 'day'
export const MAX_CERTIFICATE_FILE_SIZE = 20 * 1024 * 1024

export type ClientPortalFilters = {
  certificate: string
  date: string
  dateMode: ClientPortalDateMode
  page: number
  tag: string
}

export function normalizeCNPJ(value: string): string {
  return value.replace(/\D/g, '')
}

export function canClientLogin(status: unknown): boolean {
  return status === 'active'
}

export function validateCertificateUpload(mimeType: unknown, size: unknown): true | string {
  if (mimeType !== 'application/pdf') return 'Envie um arquivo PDF.'
  if (typeof size !== 'number' || size > MAX_CERTIFICATE_FILE_SIZE) return 'O PDF deve ter no máximo 20 MB.'

  return true
}

export function certificateResponseHeaders(filename: string): Headers {
  return new Headers({
    'Cache-Control': 'private, no-store',
    'Content-Disposition': `inline; filename="${filename.replace(/["\r\n]/g, '_')}"`,
    'Content-Type': 'application/pdf',
    'X-Content-Type-Options': 'nosniff',
  })
}

export function validateCNPJ(value: string): boolean {
  return normalizeCNPJ(value).length === 14
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function escapeHTML(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return entities[character]
  })
}

export function validateCertificateNumber(value: string): boolean {
  return /^\d{5}\/\d{4}$/.test(value.trim())
}

export function hasCertificateYearMismatch(certificate: string, calibrationDate: string): boolean {
  if (!validateCertificateNumber(certificate) || !/^\d{4}-\d{2}-\d{2}/.test(calibrationDate)) return false

  return certificate.slice(-4) !== calibrationDate.slice(0, 4)
}

export function parseClientPortalFilters(searchParams: URLSearchParams): ClientPortalFilters {
  const requestedMode = searchParams.get('dateMode')
  const requestedPage = Number.parseInt(searchParams.get('page') || '1', 10)

  return {
    dateMode: requestedMode === 'day' ? 'day' : 'month',
    date: searchParams.get('date')?.trim() || '',
    certificate: searchParams.get('certificate')?.trim() || '',
    tag: searchParams.get('tag')?.trim() || '',
    page: Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
  }
}

function addUTCMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1))
}

function addUTCDays(date: Date, days: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days))
}

export function buildCalibrationDateRange(
  mode: ClientPortalDateMode,
  value: string,
): { greater_than_equal: string; less_than: string } | undefined {
  const match = mode === 'month' ? /^(\d{4})-(\d{2})$/.exec(value) : /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return undefined

  const year = Number(match[1])
  const month = Number(match[2])
  const day = mode === 'day' ? Number(match[3]) : 1
  const start = new Date(Date.UTC(year, month - 1, day))

  if (
    start.getUTCFullYear() !== year ||
    start.getUTCMonth() !== month - 1 ||
    (mode === 'day' && start.getUTCDate() !== day)
  ) {
    return undefined
  }

  const end = mode === 'month' ? addUTCMonths(start, 1) : addUTCDays(start, 1)

  return { greater_than_equal: start.toISOString(), less_than: end.toISOString() }
}

export function buildCalibrationWhere(clientID: number | string, filters: ClientPortalFilters) {
  const and: Record<string, unknown>[] = [{ client: { equals: clientID } }]
  const dateRange = filters.date ? buildCalibrationDateRange(filters.dateMode, filters.date) : undefined

  if (dateRange) and.push({ calibrationDate: dateRange })
  if (filters.certificate) and.push({ certificateNumber: { contains: filters.certificate } })
  if (filters.tag) and.push({ tag: { contains: filters.tag } })

  return { and }
}

export function buildSummaryDateRanges(now = new Date()) {
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const year = Number(dateParts.find((part) => part.type === 'year')?.value)
  const month = Number(dateParts.find((part) => part.type === 'month')?.value)

  const yearStart = new Date(Date.UTC(year, 0, 1))
  const nextYear = new Date(Date.UTC(year + 1, 0, 1))
  const monthStart = new Date(Date.UTC(year, month - 1, 1))
  const nextMonth = new Date(Date.UTC(year, month, 1))

  return {
    year: { greater_than_equal: yearStart.toISOString(), less_than: nextYear.toISOString() },
    month: { greater_than_equal: monthStart.toISOString(), less_than: nextMonth.toISOString() },
  }
}
