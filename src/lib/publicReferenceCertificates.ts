import config from '@payload-config'
import { getPayload } from 'payload'

import type { ReferenceCertificate, ReferenceStandard } from '@/payload-types'

export type PublicReferenceCertificate = {
  id: string
  year: number
  label: string
  isCurrent: boolean
  viewHref: string
  downloadHref: string
}

export type PublicReferenceStandard = {
  id: string
  tag: string
  searchKey: string
  current: PublicReferenceCertificate
  history: PublicReferenceCertificate[]
}

type LabelledCertificate = PublicReferenceCertificate & { createdAt: string }

function relationshipID(value: ReferenceCertificate['standard']): number {
  return typeof value === 'object' ? value.id : value
}

function labelCertificates(certificates: ReferenceCertificate[]): LabelledCertificate[] {
  const years = new Map<number, ReferenceCertificate[]>()
  for (const certificate of certificates) {
    const group = years.get(certificate.year) || []
    group.push(certificate)
    years.set(certificate.year, group)
  }

  const labels = new Map<number, string>()
  for (const [year, group] of years) {
    const ordered = [...group].sort((left, right) => {
      const createdDifference = left.createdAt.localeCompare(right.createdAt)
      return createdDifference || left.id - right.id
    })
    ordered.forEach((certificate, index) => {
      labels.set(
        certificate.id,
        ordered.length === 1
          ? `Certificado ${year}`
          : `Certificado ${year} — ${index + 1}/${ordered.length}`,
      )
    })
  }

  return certificates.map((certificate) => {
    const id = String(certificate.id)
    return {
      id,
      year: certificate.year,
      label: labels.get(certificate.id) || `Certificado ${certificate.year}`,
      isCurrent: Boolean(certificate.isCurrent),
      viewHref: `/certificados-padroes/${id}/visualizar`,
      downloadHref: `/certificados-padroes/${id}/baixar`,
      createdAt: certificate.createdAt,
    }
  })
}

export function buildPublicReferenceStandards(
  standards: ReferenceStandard[],
  certificates: ReferenceCertificate[],
): PublicReferenceStandard[] {
  return standards
    .filter((standard) => standard.visible)
    .map((standard): PublicReferenceStandard | undefined => {
      const published = certificates.filter(
        (certificate) =>
          relationshipID(certificate.standard) === standard.id &&
          certificate._status === 'published' &&
          certificate.mimeType === 'application/pdf' &&
          Boolean(certificate.filename),
      )
      const labelled = labelCertificates(published)
      const current = labelled.find((certificate) => certificate.isCurrent)
      if (!current) return undefined

      const history = labelled
        .filter((certificate) => !certificate.isCurrent)
        .sort((left, right) => {
          const yearDifference = right.year - left.year
          if (yearDifference) return yearDifference
          const createdDifference = right.createdAt.localeCompare(left.createdAt)
          return createdDifference || right.id.localeCompare(left.id, 'pt-BR', { numeric: true })
        })

      const publicCertificate = ({ createdAt: _createdAt, ...certificate }: LabelledCertificate) => certificate

      return {
        id: String(standard.id),
        tag: standard.tag,
        searchKey: standard.searchKey,
        current: publicCertificate(current),
        history: history.map(publicCertificate),
      }
    })
    .filter((standard): standard is PublicReferenceStandard => Boolean(standard))
    .sort((left, right) => left.tag.localeCompare(right.tag, 'pt-BR', { numeric: true, sensitivity: 'base' }))
}

export async function getPublicReferenceStandards(): Promise<PublicReferenceStandard[]> {
  let payload: Awaited<ReturnType<typeof getPayload>> | undefined
  try {
    payload = await getPayload({ config })
    const [standards, certificates] = await Promise.all([
      payload.find({
        collection: 'reference-standards',
        depth: 0,
        limit: 100,
        overrideAccess: true,
        where: { visible: { equals: true } },
      }),
      payload.find({
        collection: 'reference-certificates',
        depth: 0,
        limit: 500,
        overrideAccess: true,
        where: { _status: { equals: 'published' } },
      }),
    ])

    return buildPublicReferenceStandards(standards.docs, certificates.docs)
  } catch (error) {
    if (payload) {
      payload.logger.error({ err: error }, 'Falha ao carregar certificados públicos dos padrões')
    } else {
      console.error('Falha ao inicializar certificados públicos dos padrões', error)
    }
    return []
  }
}
