import { Gauge, Headphones, MapPinned, ShieldCheck } from 'lucide-react'
import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import Image from 'next/image'

import { GaugeVisual } from '@/components/site/GaugeVisual'
import { getAboutContent } from '@/lib/cms'
import { getMediaUrl } from '@/utilities/getMediaUrl'

export async function generateMetadata(): Promise<Metadata> {
  const content = await getAboutContent({ draft: (await draftMode()).isEnabled })
  return { title: 'Sobre', description: content.intro, alternates: { canonical: '/sobre' } }
}

export default async function AboutPage() {
  const content = await getAboutContent({ draft: (await draftMode()).isEnabled })
  return (
    <>
      <section className="page-hero about-hero"><div className="container"><span className="eyebrow">Sobre a UniPress</span><h1>{content.title}</h1><p>{content.intro}</p></div></section>
      <section className="section container about-grid">
        <div className="about-visual">
          {content.image ? (
            <Image
              alt={content.image.alt || 'UniPress'}
              className="about-image"
              fill
              sizes="(max-width: 800px) 100vw, 42vw"
              src={getMediaUrl(content.image.url, content.image.updatedAt)}
              style={{ objectFit: 'contain' }}
            />
          ) : (
            <GaugeVisual />
          )}
        </div>
        <div className="about-copy"><span className="eyebrow">Nossa atuação</span><h2>Mais do que fornecer instrumentos, ajudamos a manter processos sob controle.</h2>{content.content.split(/\n{2,}/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      </section>
      <section className="values-section"><div className="container values-grid">
        {[['Agilidade', 'Respostas objetivas e acompanhamento próximo.', Headphones], ['Precisão', 'Informação técnica clara para cada aplicação.', Gauge], ['Confiança', 'Rastreabilidade e cuidado em cada serviço.', ShieldCheck], ['Alcance nacional', 'Atendimento comercial para todo o Brasil.', MapPinned]].map(([title, text, Icon]) => {
          const ValueIcon = Icon as typeof Gauge
          return <article key={String(title)}><ValueIcon /><h2>{String(title)}</h2><p>{String(text)}</p></article>
        })}
      </div></section>
    </>
  )
}
