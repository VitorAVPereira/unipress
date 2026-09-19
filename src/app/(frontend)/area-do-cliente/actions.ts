'use server'

import config from '@payload-config'
import { login, logout } from '@payloadcms/next/auth'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import { normalizeEmail } from '@/lib/clientPortal'

export type AuthActionState = { error?: string; message?: string }

export async function loginClientAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = normalizeEmail(String(formData.get('email') || ''))
  const password = String(formData.get('password') || '')
  if (!email || !password) return { error: 'Informe e-mail e senha.' }

  try {
    await login({ collection: 'clients', config, email, password })
  } catch {
    return { error: 'E-mail ou senha inválidos.' }
  }

  redirect('/area-do-cliente')
}

export async function logoutClientAction(): Promise<void> {
  await logout({ allSessions: false, config })
  redirect('/area-do-cliente/entrar')
}

export async function forgotPasswordAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = normalizeEmail(String(formData.get('email') || ''))
  if (email) {
    try {
      const payload = await getPayload({ config })
      await payload.forgotPassword({ collection: 'clients', data: { email } })
    } catch {
      // A resposta é intencionalmente neutra para não revelar contas cadastradas.
    }
  }

  return { message: 'Se o e-mail estiver cadastrado, enviaremos um link válido por 24 horas.' }
}

export async function resetPasswordAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const token = String(formData.get('token') || '')
  const password = String(formData.get('password') || '')
  const confirmation = String(formData.get('confirmation') || '')

  if (!token) return { error: 'Este link é inválido ou expirou.' }
  if (password.length < 8) return { error: 'A senha deve ter pelo menos 8 caracteres.' }
  if (password !== confirmation) return { error: 'As senhas não coincidem.' }

  try {
    const payload = await getPayload({ config })
    await payload.resetPassword({ collection: 'clients', data: { password, token }, overrideAccess: true })
  } catch {
    return { error: 'Este link é inválido ou expirou. Solicite um novo link.' }
  }

  redirect('/area-do-cliente/entrar?passwordReset=1')
}
