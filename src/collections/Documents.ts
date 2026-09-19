import type { CollectionConfig } from 'payload'

import { anyone } from '@/access/anyone'
import { authenticated } from '@/access/authenticated'

export const Documents: CollectionConfig = {
  slug: 'documents',
  labels: { singular: 'Documento', plural: 'Documentos' },
  access: { create: authenticated, delete: authenticated, read: anyone, update: authenticated },
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', label: 'Título', required: true },
    { name: 'description', type: 'textarea', label: 'Descrição' },
  ],
  upload: { mimeTypes: ['application/pdf'], staticDir: 'public/documents' },
}
