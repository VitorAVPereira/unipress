import { ArrowRight, CheckCircle2, MessageCircle, Package, RotateCcw, ShieldCheck } from 'lucide-react'
import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { Breadcrumbs } from '@/components/site/Breadcrumbs'
import { getServiceBySlug, getServices, getSiteSettings } from '@/lib/cms'
import { buildWhatsAppOrContactURL } from '@/lib/whatsapp'

export async function generateStaticParams() {
  return (await getServices()).map((service) => ({ slug: service.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const service = await getServiceBySlug((await params).slug, { draft: (await draftMode()).isEnabled })
  return service ? {
    title: service.seoTitle || service.title,
    description: service.seoDescription || service.summary,
    alternates: { canonical: `/servicos/${service.slug}` },
    openGraph: service.seoImage ? { images: [{ url: service.seoImage.url, alt: service.seoImage.alt }] } : undefined,
  } : { title: 'Serviço não encontrado' }
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const draft = (await draftMode()).isEnabled
  const [service, settings] = await Promise.all([getServiceBySlug(slug, { draft }), getSiteSettings()])
  if (!service) notFound()
  const whatsapp = buildWhatsAppOrContactURL(settings.whatsapp || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '')
  const jsonLd = { '@context': 'https://schema.org', '@type': 'Service', name: service.title, description: service.summary, provider: { '@type': 'Organization', name: 'UniPress' }, areaServed: 'BR' }

  return (
    <>
      <Breadcrumbs items={[["Início", '/'], ['Serviços', '/servicos'], [service.title]]} />
      <section className="service-detail-hero container">
        <div>
          <span className="eyebrow">Serviço especializado</span>
          <h1>{service.title}</h1>
          <p>{service.summary}</p>
          <a className="button button-primary" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={19} /> Solicitar atendimento</a>
        </div>
        <div className="calibration-emblem" aria-hidden="true"><ShieldCheck /><strong>RBC</strong><span>Rastreabilidade</span></div>
      </section>
      <section className="traceability-strip"><div className="container"><ShieldCheck /><div><span>Rastreabilidade metrológica</span><strong>{service.traceabilityNote}</strong></div></div></section>
      <section className="section container service-content-grid">
        <div><span className="eyebrow">Como funciona</span><h2>Do recebimento à devolução, com clareza em cada etapa.</h2><p>{service.description}</p></div>
        <div className="steps-list">
          {service.steps.map(([title, description], index) => <article key={title}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{title}</h3><p>{description}</p></div></article>)}
        </div>
      </section>
      <section className="instrument-section">
        <div className="container instrument-grid">
          <div><span className="eyebrow">Instrumentos atendidos</span><h2>Calibração para diferentes soluções de pressão.</h2></div>
          <ul>{service.instruments.map((instrument) => <li key={instrument}><CheckCircle2 size={18} />{instrument}</li>)}</ul>
        </div>
      </section>
      <section className="container service-logistics">
        <Package /><div><span>01</span><h3>Envie de qualquer lugar do Brasil</h3><p>Combine o envio com nossa equipe comercial.</p></div>
        <ArrowRight />
        <RotateCcw /><div><span>02</span><h3>Receba o instrumento de volta</h3><p>Devolução acompanhada da documentação aplicável.</p></div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  )
}
