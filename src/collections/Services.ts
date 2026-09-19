import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { defaultLexical } from '@/fields/defaultLexical'
import { seoFields } from '@/fields/seo'
import { revalidateDeletedService, revalidateService } from '@/hooks/revalidateContent'
import { generatePreviewPathWhenReady } from '@/lib/preview'

export const Services: CollectionConfig = {
  slug: 'services',
  labels: { singular: 'Serviço', plural: 'Serviços' },
  access: { create: authenticated, delete: authenticated, read: authenticatedOrPublished, update: authenticated },
  admin: {
    defaultColumns: ['title', 'slug', '_status'],
    livePreview: {
      url: ({ data }) => generatePreviewPathWhenReady({ collection: 'services', slug: data?.slug }),
    },
    preview: (data) => generatePreviewPathWhenReady({ collection: 'services', slug: data?.slug }),
    useAsTitle: 'title',
  },
  hooks: { afterChange: [revalidateService], afterDelete: [revalidateDeletedService] },
  versions: { drafts: { autosave: true, schedulePublish: true }, maxPerDoc: 20 },
  fields: [
    { name: 'title', type: 'text', label: 'Título', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'summary', type: 'textarea', label: 'Resumo', required: true },
    { name: 'description', type: 'richText', label: 'Descrição', editor: defaultLexical, required: true },
    { name: 'image', type: 'relationship', relationTo: 'media', label: 'Imagem' },
    {
      name: 'acceptedInstruments',
      type: 'array',
      label: 'Instrumentos atendidos',
      fields: [{ name: 'name', type: 'text', label: 'Instrumento', required: true }],
    },
    {
      name: 'steps',
      type: 'array',
      label: 'Etapas',
      fields: [
        { name: 'title', type: 'text', label: 'Título', required: true },
        { name: 'description', type: 'textarea', label: 'Descrição', required: true },
      ],
    },
    { name: 'traceabilityNote', type: 'textarea', label: 'Nota de rastreabilidade', defaultValue: 'Calibração rastreável à Rede Brasileira de Calibração (RBC).' },
    ...seoFields,
  ],
}
