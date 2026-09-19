import { Clock3, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import type { Metadata } from 'next'
import { draftMode } from 'next/headers'

import { ContactForm } from '@/components/contact/ContactForm'
import { getContactContent, getSiteSettings } from '@/lib/cms'
import { buildWhatsAppOrContactURL } from '@/lib/whatsapp'

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContactContent({ draft: (await draftMode()).isEnabled })
  return { title: 'Contato', description: content.description, alternates: { canonical: '/contato' } }
}

export default async function ContactPage() {
  const draft = (await draftMode()).isEnabled
  const [settings, content] = await Promise.all([getSiteSettings(), getContactContent({ draft })])
  const whatsapp = buildWhatsAppOrContactURL(settings.whatsapp || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '')
  return (
    <>
      <section className="page-hero contact-hero"><div className="container"><span className="eyebrow">Fale com a UniPress</span><h1>{content.title}</h1><p>{content.description}</p></div></section>
      <section className="section container contact-grid">
        <div className="contact-sidebar">
          <span className="eyebrow">Atendimento direto</span><h2>Escolha o canal mais conveniente.</h2><p>Para uma resposta rápida, fale pelo WhatsApp. Se preferir, envie os detalhes pelo formulário.</p>
          <a className="contact-method contact-method-primary" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle /><span><small>WhatsApp</small><strong>{settings.whatsapp || 'Configurar no painel'}</strong></span></a>
          {settings.phone && <a className="contact-method" href={`tel:${settings.phone}`}><Phone /><span><small>Telefone</small><strong>{settings.phone}</strong></span></a>}
          {settings.email && <a className="contact-method" href={`mailto:${settings.email}`}><Mail /><span><small>E-mail</small><strong>{settings.email}</strong></span></a>}
          <div className="contact-method"><Clock3 /><span><small>Atendimento</small><strong>{settings.businessHours}</strong></span></div>
          {settings.address && <div className="contact-method"><MapPin /><span><small>Endereço</small><strong>{settings.address}</strong></span></div>}
        </div>
        <div className="form-card"><div className="form-card-heading"><span>Solicitação</span><h2>Envie uma mensagem</h2><p>Campos marcados com * são obrigatórios.</p></div><ContactForm /></div>
      </section>
    </>
  )
}
