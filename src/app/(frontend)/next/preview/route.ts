import config from '@payload-config'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import { getPayload, type PayloadRequest } from 'payload'

export type PreviewSearchParams = { path: string; previewSecret: string }

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')
  const previewSecret = searchParams.get('previewSecret')

  if (!process.env.PREVIEW_SECRET || previewSecret !== process.env.PREVIEW_SECRET) {
    return new Response('Pré-visualização não autorizada.', { status: 403 })
  }
  if (!path?.startsWith('/') || path.startsWith('//')) {
    return new Response('Caminho de pré-visualização inválido.', { status: 400 })
  }

  const payload = await getPayload({ config })
  try {
    const { user } = await payload.auth({
      req: request as unknown as PayloadRequest,
      headers: request.headers,
    })
    if (!user) return new Response('Pré-visualização não autorizada.', { status: 403 })
  } catch (error) {
    payload.logger.error({ err: error }, 'Falha ao autenticar a pré-visualização')
    return new Response('Pré-visualização não autorizada.', { status: 403 })
  }

  const draft = await draftMode()
  draft.enable()
  redirect(path)
}
