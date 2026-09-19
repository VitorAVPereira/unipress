import type { CollectionConfig } from 'payload'

import { anyone } from '@/access/anyone'
import { authenticated } from '@/access/authenticated'

export const ProductCategories: CollectionConfig = {
  slug: 'product-categories',
  labels: { singular: 'Categoria de produto', plural: 'Categorias de produtos' },
  access: { create: authenticated, delete: authenticated, read: anyone, update: authenticated },
  admin: { defaultColumns: ['name', 'family', 'order'], useAsTitle: 'name' },
  fields: [
    { name: 'name', type: 'text', label: 'Nome', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    {
      name: 'family',
      type: 'select',
      label: 'Família',
      options: [
        { label: 'Manômetro', value: 'manometro' },
        { label: 'Acessório', value: 'acessorio' },
      ],
      required: true,
      index: true,
    },
    { name: 'summary', type: 'textarea', label: 'Resumo', required: true },
    { name: 'image', type: 'relationship', relationTo: 'media', label: 'Imagem' },
    { name: 'order', type: 'number', label: 'Ordem', defaultValue: 0, required: true },
  ],
}
