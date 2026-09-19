import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { LoginForm } from '@/components/client-area/AuthForms'
import { getClientSession } from '@/lib/clientSession'

export const metadata: Metadata = { title: 'Entrar na área do cliente', robots: { index: false, follow: false } }

export default async function ClientLoginPage({ searchParams }: { searchParams: Promise<{ passwordReset?: string }> }) {
  if (await getClientSession()) redirect('/area-do-cliente')
  const query = await searchParams
  return (
    <section className="client-auth-shell section">
      <div className="client-auth-card">
        <span className="eyebrow"><span />Área do cliente</span>
        <h1>Acesse seus certificados</h1>
        <p>Entre com o e-mail cadastrado pela UniPress.</p>
        <LoginForm passwordReset={query.passwordReset === '1'} />
      </div>
    </section>
  )
}
