import type { Metadata } from 'next'

import { ResetPasswordForm } from '@/components/client-area/AuthForms'

export const metadata: Metadata = { title: 'Definir senha', robots: { index: false, follow: false } }

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = '' } = await searchParams
  return (
    <section className="client-auth-shell section">
      <div className="client-auth-card">
        <span className="eyebrow"><span />Área do cliente</span>
        <h1>Defina sua senha</h1>
        <p>Use pelo menos oito caracteres.</p>
        {token ? <ResetPasswordForm token={token} /> : <p className="client-auth-error" role="alert">Este link é inválido ou expirou.</p>}
      </div>
    </section>
  )
}
