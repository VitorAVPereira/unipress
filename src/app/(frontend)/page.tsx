import {
  ArrowRight,
  CheckCircle2,
  Gauge,
  Headphones,
  PackageCheck,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import { draftMode } from 'next/headers'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { GaugeVisual } from '@/components/site/GaugeVisual'
import { buildWhatsAppOrContactURL } from '@/lib/whatsapp'
import { getHomeContent, getSiteSettings } from '@/lib/cms'
import { getMediaUrl } from '@/utilities/getMediaUrl'

export const metadata: Metadata = { alternates: { canonical: '/' } }

export default async function HomePage() {
  const draft = (await draftMode()).isEnabled
  const [home, settings] = await Promise.all([getHomeContent({ draft }), getSiteSettings()])
  const whatsapp = buildWhatsAppOrContactURL(
    settings.whatsapp || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '',
  )
  const benefits = home.benefits?.length
    ? home.benefits
    : [
        {
          title: 'Resposta ágil',
          description: 'Atendimento direto para encontrar a configuração adequada.',
        },
        {
          title: 'Disponibilidade sob consulta',
          description: 'Acompanhamento comercial claro em cada solicitação.',
        },
        { title: 'Rastreabilidade', description: 'Calibração de pressão rastreável à RBC.' },
      ]
  const heroImage =
    typeof home.heroImage === 'object' && home.heroImage?.url ? home.heroImage : undefined
  const manometersImage =
    typeof home.manometersImage === 'object' && home.manometersImage?.url
      ? home.manometersImage
      : undefined
  const accessoriesImage =
    typeof home.accessoriesImage === 'object' && home.accessoriesImage?.url
      ? home.accessoriesImage
      : undefined

  return (
    <>
      <section className="hero">
        <div className="hero-grid container">
          <div className="hero-copy">
            <span className="eyebrow">
              <span />
              {home.eyebrow}
            </span>
            <h1>{home.title}</h1>
            <p>{home.description}</p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/produtos">
                Ver catálogo <ArrowRight size={19} />
              </Link>
              <a className="button button-ghost" href={whatsapp} target="_blank" rel="noreferrer">
                Falar com especialista
              </a>
            </div>
            <div className="hero-proof">
              <span>
                <CheckCircle2 size={17} /> {home.heroProofOne || 'Atendimento nacional'}
              </span>
              <span>
                <CheckCircle2 size={17} /> {home.heroProofTwo || 'Consulta técnica'}
              </span>
              <span>
                <CheckCircle2 size={17} /> {home.heroProofThree || 'Sem venda online'}
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="technical-grid" />
            {heroImage ? (
              <Image
                alt={heroImage.alt || 'Instrumento de pressão UniPress'}
                className="hero-product-image"
                fill
                priority
                sizes="(max-width: 768px) 90vw, (max-width: 1100px) 42vw, 560px"
                src={getMediaUrl(heroImage.url, heroImage.updatedAt)}
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <GaugeVisual />
            )}
            <div className="metric-card metric-top">
              <span>Precisão</span>
              <strong>sob medida</strong>
            </div>
            <div className="metric-card metric-bottom">
              <PackageCheck size={22} />
              <div>
                <span>Disponibilidade</span>
                <strong>sob consulta</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <div className="container trust-grid">
          <div>
            <Truck />
            <span>Atendimento</span>
            <strong>Todo o Brasil</strong>
          </div>
          <div>
            <Gauge />
            <span>Especialidade</span>
            <strong>Pressão</strong>
          </div>
          <div>
            <ShieldCheck />
            <span>Calibração</span>
            <strong>Rastreável à RBC</strong>
          </div>
          <div>
            <Headphones />
            <span>Contato</span>
            <strong>Direto e ágil</strong>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section-heading split-heading">
          <div>
            <span className="eyebrow">Soluções UniPress</span>
            <h2>Instrumentos para manter a sua operação sob controle.</h2>
          </div>
          <p>
            Encontre o instrumento ou acessório adequado e consulte nossa equipe para confirmar
            especificações e disponibilidade.
          </p>
        </div>
        <div className="category-grid">
          <Link className="category-card category-dark" href="/produtos?familia=manometro">
            <div className="category-number">01</div>
            {manometersImage ? (
              <div className="category-image-frame">
                <Image
                  alt={manometersImage.alt || 'Manômetros UniPress'}
                  fill
                  sizes="(max-width: 800px) 70vw, 320px"
                  src={getMediaUrl(manometersImage.url, manometersImage.updatedAt)}
                  style={{ objectFit: 'contain' }}
                />
              </div>
            ) : (
              <GaugeVisual compact />
            )}
            <div>
              <span>Principal linha</span>
              <h3>Manômetros</h3>
              <p>Soluções para diferentes faixas, diâmetros, conexões e aplicações industriais.</p>
              <strong>
                Explorar manômetros <ArrowRight size={17} />
              </strong>
            </div>
          </Link>
          <Link className="category-card category-light" href="/produtos?familia=acessorio">
            <div className="category-number">02</div>
            {accessoriesImage ? (
              <div className="category-image-frame">
                <Image
                  alt={accessoriesImage.alt || 'Acessórios UniPress'}
                  fill
                  sizes="(max-width: 800px) 70vw, 320px"
                  src={getMediaUrl(accessoriesImage.url, accessoriesImage.updatedAt)}
                  style={{ objectFit: 'contain' }}
                />
              </div>
            ) : (
              <div className="accessory-visual" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            )}
            <div>
              <span>Proteção e instalação</span>
              <h3>Acessórios</h3>
              <p>Sifões, válvulas e componentes para integrar e proteger o instrumento.</p>
              <strong>
                Explorar acessórios <ArrowRight size={17} />
              </strong>
            </div>
          </Link>
        </div>
      </section>

      <section className="calibration-band">
        <div className="container calibration-grid">
          <div className="calibration-copy">
            <span className="eyebrow eyebrow-light">Serviço especializado</span>
            <h2>Confiança metrológica para decisões precisas.</h2>
            <p>
              Envie seus instrumentos ao laboratório UniPress. Nossa equipe realiza a calibração de
              pressão com rastreabilidade à Rede Brasileira de Calibração.
            </p>
            <Link className="button button-light" href="/servicos/calibracao-de-pressao">
              Conhecer o serviço <ArrowRight size={19} />
            </Link>
          </div>
          <div className="process-list">
            {[
              ['01', 'Envie o instrumento'],
              ['02', 'Receba a avaliação'],
              ['03', 'Acompanhe a calibração'],
              ['04', 'Receba a documentação'],
            ].map(([number, label]) => (
              <div key={number}>
                <span>{number}</span>
                <strong>{label}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section-heading centered">
          <span className="eyebrow">Por que a UniPress</span>
          <h2>Agilidade sem abrir mão do rigor técnico.</h2>
        </div>
        <div className="benefit-grid">
          {benefits.slice(0, 3).map((benefit, index) => (
            <article key={benefit.title}>
              <span>0{index + 1}</span>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-section container">
        <div>
          <span className="eyebrow eyebrow-light">Pronto para consultar?</span>
          <h2>Conte o que a sua operação precisa.</h2>
          <p>Nossa equipe ajuda a localizar a configuração mais adequada.</p>
        </div>
        <a className="button button-light" href={whatsapp} target="_blank" rel="noreferrer">
          Falar no WhatsApp <ArrowRight size={19} />
        </a>
      </section>
    </>
  )
}
