import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import type { Plugin } from 'payload'

export const plugins: Plugin[] = [
  vercelBlobStorage({
    enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    collections: {
      documents: true,
      media: true,
    },
    token: process.env.BLOB_READ_WRITE_TOKEN,
  }),
  vercelBlobStorage({
    access: 'private' as 'public',
    addRandomSuffix: true,
    clientUploads: {
      access: ({ req }) => req.user?.collection === 'users',
    },
    collections: {
      calibrations: { prefix: 'certificates' },
    },
    enabled: Boolean(process.env.CERTIFICATES_BLOB_READ_WRITE_TOKEN),
    token: process.env.CERTIFICATES_BLOB_READ_WRITE_TOKEN,
  }),
]
