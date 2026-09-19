import { ArrowRight, Gauge, PackageCheck } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { getServices } from '@/lib/cms'

export const metadata: Metadata = {
  title: 'Serviços',
  description: 'Serviços de calibração de pressão rastreáveis à RBC oferecidos pela UniPress.',
  alternates: { canonical: '/servicos' },
}

export default async function ServicesPage() {
  const services = await getServices()
  return (
    <>
      <section className="page-hero service-page-hero">
        <div className="container">
          <span className="eyebrow">Serviços metrológicos</span>
          <h1>Confiança para medir. Segurança para decidir.</h1>
          <p>Atendimento em laboratório para instrumentos enviados de todo o Brasil.</p>
        </div>
      </section>
      <section className="section container">
        <div className="service-list">
          {services.map((service) => (
            <article className="service-card" key={service.id}>
              <div className="service-card-icon"><Gauge /></div>
              <div><span className="eyebrow">Pressão</span><h2>{service.title}</h2><p>{service.summary}</p><Link className="text-link" href={`/servicos/${service.slug}`}>Conhecer o serviço <ArrowRight size={17} /></Link></div>
              <div className="service-card-proof"><PackageCheck size={20} /><span>Envio ao laboratório<br /><strong>Atendimento nacional</strong></span></div>
            </article>
          ))}
          {services.length === 0 && <div className="empty-state"><h2>Catálogo de serviços em atualização.</h2><p>Fale com nossa equipe para consultar os serviços disponíveis.</p></div>}
        </div>
      </section>
    </>
  )
}
