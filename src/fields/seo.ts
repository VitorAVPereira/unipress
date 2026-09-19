import type { Field } from 'payload'

export const seoFields: Field[] = [
  {
    name: 'seo',
    type: 'group',
    label: 'SEO e compartilhamento',
    fields: [
      { name: 'title', type: 'text', label: 'Título', maxLength: 60 },
      { name: 'description', type: 'textarea', label: 'Descrição', maxLength: 160 },
      { name: 'image', type: 'relationship', relationTo: 'media', label: 'Imagem social' },
    ],
  },
]
