import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { defaultLexical } from '@/fields/defaultLexical'
import { revalidateGlobal } from '@/hooks/revalidateContent'
import { generatePreviewPath } from '@/lib/preview'

export const Privacy: GlobalConfig = {
  slug: 'privacy',
  label: 'Política de privacidade',
  access: { read: () => true, update: authenticated },
  admin: {
    livePreview: { url: () => generatePreviewPath({ collection: 'privacy' }) },
    preview: () => generatePreviewPath({ collection: 'privacy' }),
  },
  hooks: { afterChange: [revalidateGlobal] },
  versions: { drafts: { autosave: true } },
  fields: [
    { name: 'title', type: 'text', label: 'Título', defaultValue: 'Política de Privacidade', required: true },
    { name: 'updatedAtLabel', type: 'text', label: 'Data de atualização' },
    { name: 'content', type: 'richText', label: 'Conteúdo', editor: defaultLexical },
  ],
}
