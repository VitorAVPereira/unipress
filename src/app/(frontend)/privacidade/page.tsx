import type { Metadata } from 'next'
import { draftMode } from 'next/headers'

import { getPrivacyContent } from '@/lib/cms'

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPrivacyContent({ draft: (await draftMode()).isEnabled })
  return { title: content.title, robots: { index: true, follow: true }, alternates: { canonical: '/privacidade' } }
}

export default async function PrivacyPage() {
  const content = await getPrivacyContent({ draft: (await draftMode()).isEnabled })
  return (
    <section className="section container legal-page">
      <span className="eyebrow">Transparência</span><h1>{content.title}</h1>
      {content.updatedAtLabel && <p className="legal-updated">Atualizada em {content.updatedAtLabel}</p>}
      {content.content.split(/\n{2,}/).map((paragraph, index) => <p className={index === 0 ? 'legal-intro' : undefined} key={paragraph}>{paragraph}</p>)}
    </section>
  )
}
