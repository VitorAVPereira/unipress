// @vitest-environment node

import { getPayloadFromClientToken } from '@vercel/blob/client'
import { describe, expect, it, vi } from 'vitest'

import { ReferenceCertificates } from '@/collections/ReferenceCertificates'
import { MAX_REFERENCE_CERTIFICATE_FILE_SIZE } from '@/lib/referenceCertificates'
import { createReferenceCertificateBlobPlugin } from '@/plugins'

async function configuredUploadEndpoint() {
  const plugin = createReferenceCertificateBlobPlugin('vercel_blob_rw_test_secret')
  const config = await plugin({ collections: [ReferenceCertificates] } as never)
  const endpoint = config.endpoints?.find(
    (candidate) => candidate.path === '/vercel-blob-reference-certificates-upload',
  )
  if (!endpoint) throw new Error('Endpoint de upload não configurado.')
  return endpoint
}

function uploadRequest(collection: 'users' | 'clients') {
  const request = new Request('http://localhost/api/vercel-blob-reference-certificates-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'blob.generate-client-token',
      payload: {
        pathname: 'reference-certificates/teste.pdf',
        clientPayload: 'reference-certificates',
        multipart: false,
      },
    }),
  })
  return Object.assign(request, {
    payload: { logger: { error: vi.fn() } },
    user: { collection, id: 1 },
  })
}

describe('armazenamento privado dos certificados dos padrões', () => {
  it('autoriza no servidor somente administrador, PDF e até 20 MB', async () => {
    const endpoint = await configuredUploadEndpoint()
    const response = await endpoint.handler(uploadRequest('users') as never)
    if (!response) throw new Error('Endpoint não retornou uma resposta.')

    const body = await response.json() as { clientToken: string }
    const token = getPayloadFromClientToken(body.clientToken)
    expect(token).toEqual(expect.objectContaining({
      allowedContentTypes: ['application/pdf'],
      maximumSizeInBytes: MAX_REFERENCE_CERTIFICATE_FILE_SIZE,
      pathname: 'reference-certificates/teste.pdf',
    }))
  })

  it('nega a geração do token a usuários não administradores', async () => {
    const endpoint = await configuredUploadEndpoint()

    await expect(endpoint.handler(uploadRequest('clients') as never)).rejects.toThrow(
      'storage-vercel-blob client upload route error',
    )
  })
})
