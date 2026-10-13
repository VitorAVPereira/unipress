import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import type { Plugin } from 'payload'

import {
  MAX_REFERENCE_CERTIFICATE_FILE_SIZE,
  REFERENCE_CERTIFICATES_BLOB_PREFIX,
} from '@/lib/referenceCertificates'

export const referenceCertificateBlobClientUpload = {
  allowedContentTypes: ['application/pdf'],
  maximumSizeInBytes: MAX_REFERENCE_CERTIFICATE_FILE_SIZE,
  serverHandlerPath: '/vercel-blob-reference-certificates-upload' as const,
}

export function createReferenceCertificateBlobPlugin(token = process.env.STANDARDS_BLOB_READ_WRITE_TOKEN): Plugin {
  return vercelBlobStorage({
    access: 'private',
    addRandomSuffix: true,
    alwaysInsertFields: true,
    clientUploads: {
      access: ({ req }) => req.user?.collection === 'users',
    },
    collections: {
      'reference-certificates': { prefix: REFERENCE_CERTIFICATES_BLOB_PREFIX },
    },
    clientUpload: referenceCertificateBlobClientUpload,
    enabled: Boolean(token),
    token,
  })
}

export const plugins: Plugin[] = [
  vercelBlobStorage({
    enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    collections: {
      documents: true,
      media: true,
    },
    clientUpload: { serverHandlerPath: '/vercel-blob-public-upload' },
    token: process.env.BLOB_READ_WRITE_TOKEN,
  }),
  vercelBlobStorage({
    access: 'private',
    addRandomSuffix: true,
    clientUploads: {
      access: ({ req }) => req.user?.collection === 'users',
    },
    collections: {
      calibrations: { prefix: 'certificates' },
    },
    clientUpload: { serverHandlerPath: '/vercel-blob-certificates-upload' },
    enabled: Boolean(process.env.CERTIFICATES_BLOB_READ_WRITE_TOKEN),
    token: process.env.CERTIFICATES_BLOB_READ_WRITE_TOKEN,
  }),
  createReferenceCertificateBlobPlugin(),
]
