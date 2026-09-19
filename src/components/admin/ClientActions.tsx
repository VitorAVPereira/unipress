'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type ClientAction = 'deactivate' | 'reactivate' | 'resend-invite'

export default function ClientActions() {
  const router = useRouter()
  const { data, id } = useDocumentInfo()
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  if (!id) return null

  const runAction = async (action: ClientAction, body?: Record<string, string>) => {
    setPending(true)
    setMessage('')
    const response = await fetch(`/api/clients/${id}/${action}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    const result = (await response.json().catch(() => ({}))) as { error?: string }
    setPending(false)
    if (!response.ok) {
      setMessage(result.error || 'Não foi possível concluir a ação.')
      return
    }
    router.refresh()
  }

  const permanentlyDelete = async () => {
    const legalName = String(data?.legalName || '')
    const confirmation = window.prompt(`Digite exatamente “${legalName}” para excluir permanentemente.`)
    if (confirmation == null) return
    setPending(true)
    const response = await fetch(`/api/clients/${id}/permanent-delete`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmation }),
    })
    const result = (await response.json().catch(() => ({}))) as { error?: string }
    setPending(false)
    if (!response.ok) {
      setMessage(result.error || 'Não foi possível excluir o cliente.')
      return
    }
    router.push('/admin/collections/clients')
    router.refresh()
  }

  return (
    <div className="client-admin-actions">
      <button disabled={pending} onClick={() => runAction('resend-invite')} type="button">Reenviar convite</button>
      {data?.status === 'inactive' ? (
        <button disabled={pending} onClick={() => runAction('reactivate')} type="button">Reativar</button>
      ) : (
        <button disabled={pending} onClick={() => runAction('deactivate')} type="button">Desativar</button>
      )}
      <button className="client-admin-actions__danger" disabled={pending} onClick={permanentlyDelete} type="button">Excluir permanentemente</button>
      {message && <span role="alert">{message}</span>}
    </div>
  )
}
