import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ContactForm } from '@/components/contact/ContactForm'

describe('formulário de contato', () => {
  beforeEach(() => vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', ''))
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  function fillForm() {
    fireEvent.change(screen.getByLabelText('Nome *'), { target: { value: 'Ana Silva' } })
    fireEvent.change(screen.getByLabelText('Celular'), { target: { value: '(11) 99999-1234' } })
    fireEvent.change(screen.getByLabelText('CNPJ'), { target: { value: '12.345.678/0001-90' } })
    fireEvent.change(screen.getByLabelText('Mensagem *'), { target: { value: 'Preciso de um orçamento de calibração.' } })
    fireEvent.click(screen.getByRole('checkbox'))
  }

  it('prepara os dados no WhatsApp sem anunciar entrega concluída', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(<ContactForm deliveryMode="whatsapp" whatsappURL="https://wa.me/5511999999999" />)
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: 'Enviar pelo WhatsApp' }))
    expect(open).toHaveBeenCalledOnce()
    const url = new URL(String(open.mock.calls[0][0]))
    expect(url.pathname).toBe('/5511999999999')
    expect(url.searchParams.get('text')).toContain('CNPJ: 12.345.678/0001-90')
    expect(url.searchParams.get('text')).toContain('Celular: (11) 99999-1234')
    expect(screen.getByRole('status').textContent).toContain('Conclua o envio no WhatsApp')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.queryByText('Recebemos sua mensagem.')).toBeNull()
  })

  it('preserva os campos e libera nova tentativa após falha de conexão', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    render(<ContactForm />)
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Falha de conexão'))
    expect((screen.getByLabelText('Nome *') as HTMLInputElement).value).toBe('Ana Silva')
    expect((screen.getByRole('button', { name: 'Enviar mensagem' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('envia os campos da referência por e-mail e confirma apenas após a API aceitar', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    render(<ContactForm />)
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }))
    await waitFor(() => expect(screen.getByText('Recebemos sua mensagem.')).not.toBeNull())
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      name: 'Ana Silva', cellphone: '(11) 99999-1234', cnpj: '12.345.678/0001-90', consent: true,
    })
  })
})
