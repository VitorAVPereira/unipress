import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { revalidateGlobal } from '@/hooks/revalidateContent'
import { generatePreviewPath } from '@/lib/preview'

export const Home: GlobalConfig = {
  slug: 'home',
  label: 'Página inicial',
  access: { read: () => true, update: authenticated },
  admin: {
    livePreview: { url: () => generatePreviewPath({ collection: 'home' }) },
    preview: () => generatePreviewPath({ collection: 'home' }),
  },
  hooks: { afterChange: [revalidateGlobal] },
  versions: { drafts: { autosave: true } },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Chamada superior', defaultValue: 'Instrumentação para todo o Brasil' },
    { name: 'title', type: 'text', label: 'Título', defaultValue: 'Manômetros e acessórios com agilidade para sua operação.', required: true },
    { name: 'description', type: 'textarea', label: 'Descrição', defaultValue: 'Atendimento técnico, disponibilidade sob consulta e calibração de pressão rastreável à RBC para empresas em todo o Brasil.', required: true },
    { name: 'heroImage', type: 'relationship', relationTo: 'media', label: 'Imagem principal' },
    { name: 'heroProofOne', type: 'text', label: 'Texto do destaque 1', defaultValue: 'Atendimento nacional', required: true },
    { name: 'heroProofTwo', type: 'text', label: 'Texto do destaque 2', defaultValue: 'Consulta técnica', required: true },
    { name: 'heroProofThree', type: 'text', label: 'Texto do destaque 3', defaultValue: 'Sem venda online', required: true },
    { name: 'manometersImage', type: 'relationship', relationTo: 'media', label: 'Imagem de Manômetros' },
    { name: 'accessoriesImage', type: 'relationship', relationTo: 'media', label: 'Imagem de Acessórios' },
    {
      name: 'benefits',
      type: 'array',
      label: 'Diferenciais',
      fields: [
        { name: 'title', type: 'text', label: 'Título', required: true },
        { name: 'description', type: 'textarea', label: 'Descrição', required: true },
      ],
    },
  ],
}
