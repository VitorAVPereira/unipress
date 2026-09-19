'use client'

import { Turnstile } from '@marsidev/react-turnstile'
import { ArrowRight, CheckCircle2, LoaderCircle } from 'lucide-react'
import Link from 'next/link'
import { FormEvent, useState } from 'react'

type FormStatus = { state: 'idle' | 'loading' | 'success' | 'error'; message?: string }

export function ContactForm() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const [turnstileToken, setTurnstileToken] = useState(siteKey ? '' : 'local-development')
  const [status, setStatus] = useState<FormStatus>({ state: 'idle' })

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    setStatus({ state: 'loading' })

    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.get('name'),
        company: formData.get('company'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        subject: formData.get('subject'),
        message: formData.get('message'),
        consent: formData.get('consent') === 'on',
        website: formData.get('website'),
        turnstileToken,
      }),
    })

    if (response.ok) {
      form.reset()
      setStatus({ state: 'success', message: 'Mensagem enviada. Nossa equipe retornará assim que possível.' })
      return
    }

    setStatus({ state: 'error', message: 'Não foi possível enviar agora. Tente novamente ou fale conosco pelo WhatsApp.' })
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
        <label>Nome *<input name="name" autoComplete="name" minLength={2} required /></label>
        <label>Empresa<input name="company" autoComplete="organization" /></label>
      </div>
      <div className="form-row">
        <label>E-mail<input name="email" type="email" autoComplete="email" /></label>
        <label>Telefone / WhatsApp<input name="phone" type="tel" autoComplete="tel" /></label>
      </div>
      <label>Assunto *
        <select name="subject" required defaultValue="">
          <option value="" disabled>Selecione uma opção</option>
          <option>Consulta de produto</option>
          <option>Calibração de pressão</option>
          <option>Suporte técnico</option>
          <option>Outro assunto</option>
        </select>
      </label>
      <label>Como podemos ajudar? *<textarea name="message" minLength={10} rows={5} required /></label>
      <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <label className="consent">
        <input name="consent" type="checkbox" required />
        <span>Concordo com o uso dos dados para retorno desta solicitação, conforme a <Link href="/privacidade">Política de Privacidade</Link>.</span>
      </label>
      {siteKey && <Turnstile onSuccess={setTurnstileToken} siteKey={siteKey} options={{ language: 'pt-br', theme: 'light' }} />}
      {status.state === 'error' && <p className="form-error" role="alert">{status.message}</p>}
      <button className="button button-primary submit-button" disabled={status.state === 'loading' || !turnstileToken} type="submit">
        {status.state === 'loading' ? <LoaderCircle className="spin" size={19} /> : <ArrowRight size={19} />}
        {status.state === 'loading' ? 'Enviando...' : 'Enviar mensagem'}
      </button>
      <p className="form-help">Preencha ao menos um canal de retorno: e-mail ou telefone.</p>
    </form>
  )
}
