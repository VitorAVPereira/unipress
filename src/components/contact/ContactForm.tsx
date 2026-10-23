'use client'

import { Turnstile } from '@marsidev/react-turnstile'
import { ArrowRight, CheckCircle2, LoaderCircle } from 'lucide-react'
import Link from 'next/link'
import { FormEvent, useState } from 'react'

type FormStatus = { state: 'idle' | 'loading' | 'success' | 'error'; message?: string }

export function ContactForm({ deliveryMode = 'email', whatsappURL = '' }: {
  deliveryMode?: 'email' | 'whatsapp'
  whatsappURL?: string
}) {
  const emailDelivery = deliveryMode === 'email'
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const [turnstileToken, setTurnstileToken] = useState(siteKey ? '' : 'local-development')
  const [challengeKey, setChallengeKey] = useState(0)
  const [preparedURL, setPreparedURL] = useState('')
  const [status, setStatus] = useState<FormStatus>({ state: 'idle' })

  function resetChallenge() {
    setTurnstileToken(siteKey ? '' : 'local-development')
    setChallengeKey((key) => key + 1)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status.state === 'loading') return
    const form = event.currentTarget
    const formData = new FormData(form)
    const value = (name: string) => String(formData.get(name) || '').trim()
    if (!value('email') && !value('cellphone') && !value('phone')) {
      setStatus({ state: 'error', message: 'Informe um e-mail, celular ou telefone para que possamos retornar.' })
      return
    }

    if (!emailDelivery) {
      if (!whatsappURL.startsWith('https://wa.me/')) {
        setStatus({ state: 'error', message: 'Não foi possível abrir o WhatsApp. Utilize o telefone ou e-mail de atendimento ao lado.' })
        return
      }
      const url = new URL(whatsappURL)
      url.searchParams.set('text', [
        'Olá, gostaria de falar com a UniPress.',
        `Nome: ${value('name')}`, `Empresa: ${value('company') || 'Não informada'}`,
        `CNPJ: ${value('cnpj') || 'Não informado'}`, `Celular: ${value('cellphone') || 'Não informado'}`,
        `E-mail: ${value('email') || 'Não informado'}`, `Telefone: ${value('phone') || 'Não informado'}`,
        '', value('message'),
      ].join('\n'))
      setPreparedURL(url.toString())
      setStatus({ state: 'idle' })
      window.open(url.toString(), '_blank', 'noopener,noreferrer')
      return
    }

    setStatus({ state: 'loading' })
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: value('name'), company: value('company'), cnpj: value('cnpj'),
          email: value('email'), cellphone: value('cellphone'), phone: value('phone'),
          subject: 'Contato pelo site', message: value('message'),
          consent: formData.get('consent') === 'on', website: value('website'), turnstileToken,
        }),
      })
      if (response.ok) {
        form.reset()
        setStatus({ state: 'success', message: 'Mensagem enviada. Nossa equipe retornará assim que possível.' })
        return
      }
      setStatus({ state: 'error', message: 'Não foi possível enviar agora. Tente novamente ou fale conosco pelo WhatsApp.' })
    } catch {
      setStatus({ state: 'error', message: 'Falha de conexão. Confira sua internet e tente novamente.' })
    } finally {
      resetChallenge()
    }
  }

  if (status.state === 'success') {
    return (
      <div className="form-success" role="status">
        <CheckCircle2 size={34} />
        <h2>Recebemos sua mensagem.</h2>
        <p>{status.message}</p>
        <button className="text-link" type="button" onClick={() => setStatus({ state: 'idle' })}>Enviar outra mensagem</button>
      </div>
    )
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="form-row">
        <label>Nome *<input name="name" placeholder="Seu nome" autoComplete="name" minLength={2} maxLength={120} required /></label>
        <label>Empresa<input name="company" placeholder="Nome da empresa" autoComplete="organization" maxLength={160} /></label>
      </div>
      <div className="form-row">
        <label>Celular<input name="cellphone" placeholder="(11) 99999-9999" type="tel" autoComplete="mobile tel" maxLength={30} /></label>
        <label>E-mail<input name="email" placeholder="voce@empresa.com.br" type="email" autoComplete="email" /></label>
      </div>
      <div className="form-row">
        <label>CNPJ<input name="cnpj" placeholder="00.000.000/0000-00" maxLength={30} /></label>
        <label>Telefone<input name="phone" placeholder="(11) 3333-3333" type="tel" autoComplete="work tel" maxLength={30} /></label>
      </div>
      <label>Mensagem *<textarea name="message" placeholder="Descreva sua necessidade ou solicite um orçamento." minLength={10} maxLength={5000} rows={5} required /></label>
      <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      {emailDelivery && siteKey && <Turnstile key={challengeKey} onSuccess={setTurnstileToken} onExpire={() => setTurnstileToken('')} onError={() => setTurnstileToken('')} siteKey={siteKey} options={{ language: 'pt-br', theme: 'light', size: 'flexible' }} />}
      <label className="consent">
        <input name="consent" type="checkbox" required />
        <span>Concordo com o uso dos dados para retorno desta solicitação, conforme a <Link href="/privacidade">Política de Privacidade</Link>.</span>
      </label>
      {status.state === 'error' && <p className="form-error" role="alert">{status.message}</p>}
      {preparedURL && <p className="form-help" role="status">Sua mensagem está preparada. Conclua o envio no WhatsApp. <a className="text-link" href={preparedURL} target="_blank" rel="noreferrer">Abrir conversa</a></p>}
      <button className="button button-primary submit-button" disabled={status.state === 'loading' || (emailDelivery && !turnstileToken)} type="submit">
        {status.state === 'loading' ? <LoaderCircle className="spin" size={19} /> : <ArrowRight size={19} />}
        {status.state === 'loading' ? 'Enviando...' : emailDelivery ? 'Enviar mensagem' : 'Enviar pelo WhatsApp'}
      </button>
      <p className="form-help">Informe ao menos um canal de retorno: e-mail, celular ou telefone.{!emailDelivery && ' Ao continuar, o WhatsApp abrirá com os dados preenchidos para você enviar à nossa equipe.'}</p>
    </form>
  )
}
