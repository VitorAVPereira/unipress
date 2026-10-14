import type { Metadata } from 'next'

import { ReferenceCertificateSearch } from '@/components/reference-certificates/ReferenceCertificateSearch'
import { getPublicReferenceStandards } from '@/lib/publicReferenceCertificates'

export const metadata: Metadata = {
  title: 'Certificados dos padrões',
  description: 'Consulte os certificados dos padrões utilizados nas calibrações realizadas pela UniPress.',
  alternates: { canonical: '/certificados-padroes' },
  robots: { follow: false, index: false },
}

export default async function ReferenceCertificatesPage() {
  const standards = await getPublicReferenceStandards()

  return (
    <>
      <section className="page-hero reference-page-hero">
        <div className="container">
          <span className="eyebrow">Rastreabilidade metrológica</span>
          <h1>Certificados dos padrões UniPress.</h1>
          <p>
            Consulte pela TAG os certificados dos padrões de referência utilizados pela UniPress em suas calibrações.
          </p>
        </div>
      </section>
      <section className="container reference-certificates-section">
        <ReferenceCertificateSearch standards={standards} />
      </section>
    </>
  )
}
