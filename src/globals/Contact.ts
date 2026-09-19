import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { revalidateGlobal } from '@/hooks/revalidateContent'
import { generatePreviewPath } from '@/lib/preview'

export const Contact: GlobalConfig = {
  slug: 'contact',
  label: 'Página de contato',
  access: { read: () => true, update: authenticated },
  admin: {
    livePreview: { url: () => generatePreviewPath({ collection: 'contact' }) },
    preview: () => generatePreviewPath({ collection: 'contact' }),
  },
  hooks: { afterChange: [revalidateGlobal] },
  versions: { drafts: { autosave: true } },
  fields: [
    { name: 'title', type: 'text', label: 'Título', defaultValue: 'Vamos entender a sua necessidade.', required: true },
    { name: 'description', type: 'textarea', label: 'Descrição', defaultValue: 'Fale com a equipe UniPress para consultar disponibilidade, especificações ou calibração.', required: true },
  ],
}
