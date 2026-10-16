import type { CollectionConfig } from 'payload'

import { anyone } from '@/access/anyone'
import { authenticated } from '@/access/authenticated'
import { preventDeletingProductFamily } from '@/hooks/preventDeletingProductFamily'
import { revalidateDeletedProductFamily, revalidateProductFamily } from '@/hooks/revalidateContent'

export const ProductFamilies: CollectionConfig = {
  slug: 'product-families',
  labels: { singular: 'Família de produto', plural: 'Famílias de produtos' },
  access: { create: authenticated, delete: authenticated, read: anyone, update: authenticated },
  admin: { defaultColumns: ['name', 'slug', 'technicalProfile'], useAsTitle: 'name' },
  hooks: {
    afterChange: [revalidateProductFamily],
    afterDelete: [revalidateDeletedProductFamily],
    beforeDelete: [preventDeletingProductFamily],
  },
  fields: [
    { name: 'name', type: 'text', label: 'Nome', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    {
      name: 'technicalProfile',
      type: 'select',
      label: 'Perfil técnico',
      defaultValue: 'generico',
      required: true,
      options: [
        { label: 'Manômetro', value: 'manometro' },
        { label: 'Acessório', value: 'acessorio' },
        { label: 'Genérico', value: 'generico' },
      ],
    },
  ],
}
