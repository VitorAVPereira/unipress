'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import {
  forgotPasswordAction,
  loginClientAction,
  resetPasswordAction,
  type AuthActionState,
} from '@/app/(frontend)/area-do-cliente/actions'

const initialState: AuthActionState = {}

function SubmitButton({ children }: { children: React.ReactNode }) {
  return <button className="button button-primary client-auth-submit" type="submit">{children}</button>
}

export function LoginForm({ passwordReset = false, recoveryEnabled = false }: { passwordReset?: boolean; recoveryEnabled?: boolean }) {
  const [state, action, pending] = useActionState(loginClientAction, initialState)
  return (
    <form action={action} className="client-auth-form">
      {passwordReset && <p className="client-auth-success" role="status">Senha definida. Você já pode entrar.</p>}
      <label htmlFor="client-email">E-mail</label>
      <input autoComplete="username" id="client-email" name="email" required type="email" />
      <label htmlFor="client-password">Senha</label>
      <input autoComplete="current-password" id="client-password" name="password" required type="password" />
      {state.error && <p className="client-auth-error" role="alert">{state.error}</p>}
      <SubmitButton>{pending ? 'Entrando…' : 'Entrar'}</SubmitButton>
      {recoveryEnabled ? (
        <Link className="text-link" href="/area-do-cliente/esqueci-senha">Esqueci minha senha</Link>
      ) : (
        <p className="form-help">Para recuperação de acesso, fale com a equipe UniPress.</p>
      )}
    </form>
  )
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, initialState)
  return (
    <form action={action} className="client-auth-form">
      <label htmlFor="recovery-email">E-mail</label>
      <input autoComplete="email" id="recovery-email" name="email" required type="email" />
      {state.message && <p className="client-auth-success" role="status">{state.message}</p>}
      <SubmitButton>{pending ? 'Enviando…' : 'Enviar link'}</SubmitButton>
      <Link className="text-link" href="/area-do-cliente/entrar">Voltar ao login</Link>
    </form>
  )
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, initialState)
  return (
    <form action={action} className="client-auth-form">
      <input name="token" type="hidden" value={token} />
      <label htmlFor="new-password">Nova senha</label>
      <input autoComplete="new-password" id="new-password" minLength={8} name="password" required type="password" />
      <label htmlFor="password-confirmation">Confirmar nova senha</label>
      <input autoComplete="new-password" id="password-confirmation" minLength={8} name="confirmation" required type="password" />
      {state.error && <p className="client-auth-error" role="alert">{state.error}</p>}
      <SubmitButton>{pending ? 'Salvando…' : 'Definir senha'}</SubmitButton>
    </form>
  )
}
