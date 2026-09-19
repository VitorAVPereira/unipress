import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { defaultLexical } from '@/fields/defaultLexical'
import { revalidateGlobal } from '@/hooks/revalidateContent'
import { generatePreviewPath } from '@/lib/preview'

export const About: GlobalConfig = {
  slug: 'about',
  label: 'Sobre a UniPress',
  access: { read: () => true, update: authenticated },
  admin: {
    livePreview: { url: () => generatePreviewPath({ collection: 'about' }) },
    preview: () => generatePreviewPath({ collection: 'about' }),
  },
  hooks: { afterChange: [revalidateGlobal] },
  versions: { drafts: { autosave: true } },
  fields: [
    { name: 'title', type: 'text', label: 'Título', defaultValue: 'Precisão, agilidade e parceria técnica.', required: true },
    { name: 'intro', type: 'textarea', label: 'Introdução', defaultValue: 'A UniPress atua no fornecimento de instrumentos para medição de pressão e no suporte técnico a operações industriais.', required: true },
    { name: 'content', type: 'richText', label: 'Conteúdo', editor: defaultLexical },
    { name: 'image', type: 'relationship', relationTo: 'media', label: 'Imagem' },
  ],
}
