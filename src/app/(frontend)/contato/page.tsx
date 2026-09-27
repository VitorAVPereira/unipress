import { Clock3, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import type { Metadata } from 'next'
import { draftMode } from 'next/headers'

import { ContactForm } from '@/components/contact/ContactForm'
import { getContactContent, getSiteSettings } from '@/lib/cms'
import { isContactFormEnabled } from '@/lib/launch'
import { buildWhatsAppOrContactURL } from '@/lib/whatsapp'

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContactContent({ draft: (await draftMode()).isEnabled })
  return { title: 'Contato', description: content.description, alternates: { canonical: '/contato' } }
}

export default async function ContactPage() {
  const draft = (await draftMode()).isEnabled
  const [settings, content] = await Promise.all([getSiteSettings(), getContactContent({ draft })])
  const whatsapp = buildWhatsAppOrContactURL(settings.whatsapp || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '')
  const contactFormEnabled = isContactFormEnabled()
  return (
    <>
      <section className="page-hero contact-hero"><div className="container"><span className="eyebrow">Fale com a UniPress</span><h1>{content.title}</h1><p>{content.description}</p></div></section>
      <section className="section container contact-grid">
        <div className="contact-sidebar">
          <span className="eyebrow">Atendimento direto</span><h2>Fale diretamente com nossa equipe.</h2><p>Para uma resposta rápida, envie os detalhes da sua necessidade pelo WhatsApp.</p>
          <a className="contact-method contact-method-primary" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle /><span><small>WhatsApp</small><strong>{settings.whatsapp || 'Configurar no painel'}</strong></span></a>
          {settings.phone && <a className="contact-method" href={`tel:${settings.phone}`}><Phone /><span><small>Telefone</small><strong>{settings.phone}</strong></span></a>}
          {settings.email && <a className="contact-method" href={`mailto:${settings.email}`}><Mail /><span><small>E-mail</small><strong>{settings.email}</strong></span></a>}
          <div className="contact-method"><Clock3 /><span><small>Atendimento</small><strong>{settings.businessHours}</strong></span></div>
          {settings.address && <div className="contact-method"><MapPin /><span><small>Endereço</small><strong>{settings.address}</strong></span></div>}
        </div>
        <div className="form-card">
          {contactFormEnabled ? (
            <>
              <div className="form-card-heading"><span>Solicitação</span><h2>Envie uma mensagem</h2><p>Campos marcados com * são obrigatórios.</p></div>
              <ContactForm />
            </>
          ) : (
            <div className="form-card-heading">
              <span>Canal disponível</span>
              <h2>Atendimento pelo WhatsApp</h2>
              <p>O formulário por e-mail será disponibilizado em breve. Enquanto isso, nossa equipe atende diretamente pelo WhatsApp.</p>
              <a className="button button-primary" href={whatsapp} target="_blank" rel="noreferrer">Iniciar conversa</a>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
