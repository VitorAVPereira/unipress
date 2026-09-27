import type { Metadata } from 'next'

import { ForgotPasswordForm } from '@/components/client-area/AuthForms'
import { isPasswordRecoveryEnabled } from '@/lib/launch'

export const metadata: Metadata = { title: 'Recuperar senha', robots: { index: false, follow: false } }

export default function ForgotPasswordPage() {
  const recoveryEnabled = isPasswordRecoveryEnabled()
  return (
    <section className="client-auth-shell section">
      <div className="client-auth-card">
        <span className="eyebrow"><span />Área do cliente</span>
        <h1>Recupere seu acesso</h1>
        {recoveryEnabled ? (
          <>
            <p>Informe o e-mail da empresa para receber um link válido por 24 horas.</p>
            <ForgotPasswordForm />
          </>
        ) : (
          <p>A recuperação automática ainda não está disponível. Fale com a equipe UniPress pelo canal de atendimento para recuperar seu acesso.</p>
        )}
      </div>
    </section>
  )
}
