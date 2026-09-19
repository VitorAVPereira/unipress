import type { Metadata } from 'next'

import { ForgotPasswordForm } from '@/components/client-area/AuthForms'

export const metadata: Metadata = { title: 'Recuperar senha', robots: { index: false, follow: false } }

export default function ForgotPasswordPage() {
  return (
    <section className="client-auth-shell section">
      <div className="client-auth-card">
        <span className="eyebrow"><span />Área do cliente</span>
        <h1>Recupere seu acesso</h1>
        <p>Informe o e-mail da empresa para receber um link válido por 24 horas.</p>
        <ForgotPasswordForm />
      </div>
    </section>
  )
}
