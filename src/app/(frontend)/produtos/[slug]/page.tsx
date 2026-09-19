import { ArrowLeft, Download, MessageCircle, ShieldCheck } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { Breadcrumbs } from '@/components/site/Breadcrumbs'
import { GaugeVisual } from '@/components/site/GaugeVisual'
import { getProductBySlug, getProducts, getSiteSettings } from '@/lib/cms'
import { buildWhatsAppOrContactURL } from '@/lib/whatsapp'

export const dynamicParams = true

export async function generateStaticParams() {
  return (await getProducts()).map((product) => ({ slug: product.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug, { draft: (await draftMode()).isEnabled })
  if (!product) return { title: 'Produto não encontrado' }
  return {
    title: product.seoTitle || product.name,
    description: product.seoDescription || product.summary,
    alternates: { canonical: `/produtos/${product.slug}` },
    openGraph: product.seoImage ? { images: [{ url: product.seoImage.url, alt: product.seoImage.alt }] } : undefined,
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const draft = (await draftMode()).isEnabled
  const [product, settings] = await Promise.all([getProductBySlug(slug, { draft }), getSiteSettings()])
  if (!product) notFound()
  const whatsapp = buildWhatsAppOrContactURL(settings.whatsapp || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '', product.code)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.code,
    description: product.summary,
    brand: { '@type': 'Brand', name: 'UniPress' },
  }

  return (
    <>
      <Breadcrumbs items={[["Início", '/'], ['Produtos', '/produtos'], [product.name]]} />
      <section className="product-detail container">
        <div className="detail-visual">
          {product.demo && <span className="demo-badge">Conteúdo demonstrativo</span>}
          {product.image ? (
            <Image className="detail-product-image" src={product.image.url} alt={product.image.alt} width={900} height={900} priority />
          ) : <GaugeVisual />}
          {product.images.length > 1 && (
            <div className="detail-thumbnails" aria-label="Galeria do produto">
              {product.images.slice(1, 4).map((image) => <Image key={image.url} src={image.url} alt={image.alt} width={160} height={160} />)}
            </div>
          )}
        </div>
        <div className="detail-copy">
          <span className="eyebrow">{product.family === 'manometro' ? 'Manômetro' : 'Acessório'} · {product.code}</span>
          <h1>{product.name}</h1>
          <p className="detail-lead">{product.summary}</p>
          <p>{product.description}</p>
          <div className="detail-actions">
            <a className="button button-primary" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={19} /> Consultar no WhatsApp</a>
            {product.technicalDocumentUrl && <a className="button button-outline" href={product.technicalDocumentUrl} target="_blank" rel="noreferrer"><Download size={19} /> Baixar ficha técnica</a>}
          </div>
          <div className="availability-note"><ShieldCheck size={20} /><span><strong>Disponibilidade sob consulta</strong>Confirme faixa, conexão e prazo com nossa equipe.</span></div>
        </div>
      </section>
      <section className="spec-section">
        <div className="container spec-grid">
          <div><span className="eyebrow">Dados técnicos</span><h2>Especificações do modelo</h2><p>As opções abaixo são cadastradas no painel e podem abranger diferentes variações do mesmo modelo.</p></div>
          <dl className="spec-table">
            {product.specifications.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        </div>
      </section>
      <section className="container back-row"><Link className="text-link" href="/produtos"><ArrowLeft size={17} /> Voltar ao catálogo</Link></section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  )
}
