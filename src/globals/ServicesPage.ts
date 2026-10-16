import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { revalidateGlobal } from '@/hooks/revalidateContent'
import { generatePreviewPath } from '@/lib/preview'

export const ServicesPage: GlobalConfig = {
  slug: 'services-page',
  label: 'Página de serviços',
  access: { read: () => true, update: authenticated },
  admin: {
    livePreview: { url: () => generatePreviewPath({ collection: 'servicesPage' }) },
    preview: () => generatePreviewPath({ collection: 'servicesPage' }),
  },
  hooks: { afterChange: [revalidateGlobal] },
  versions: { drafts: { autosave: true } },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Chamada superior',
      defaultValue: 'Serviços metrológicos',
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      label: 'Título',
      defaultValue: 'Confiança para medir. Segurança para decidir.',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Descrição',
      defaultValue: 'Atendimento em laboratório para instrumentos enviados de todo o Brasil.',
      required: true,
    },
  ],
}
