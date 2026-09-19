import type { CollectionConfig, Field } from 'payload'

import { authenticated } from '@/access/authenticated'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { defaultLexical } from '@/fields/defaultLexical'
import { seoFields } from '@/fields/seo'
import { revalidateDeletedProduct, revalidateProduct } from '@/hooks/revalidateContent'
import { generatePreviewPathWhenReady } from '@/lib/preview'

const listField = (name: string, label: string): Field => ({
  name,
  type: 'array',
  label,
  fields: [{ name: 'value', type: 'text', label: 'Valor', required: true }],
})

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Produto', plural: 'Produtos' },
  access: { create: authenticated, delete: authenticated, read: authenticatedOrPublished, update: authenticated },
  admin: {
    defaultColumns: ['name', 'code', 'family', '_status', 'updatedAt'],
    livePreview: {
      url: ({ data }) => generatePreviewPathWhenReady({ collection: 'products', slug: data?.slug }),
    },
    preview: (data) => generatePreviewPathWhenReady({ collection: 'products', slug: data?.slug }),
    useAsTitle: 'name',
  },
  hooks: { afterChange: [revalidateProduct], afterDelete: [revalidateDeletedProduct] },
  versions: { drafts: { autosave: true, schedulePublish: true }, maxPerDoc: 20 },
  fields: [
    { name: 'name', type: 'text', label: 'Nome', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'code', type: 'text', label: 'Código / modelo', required: true, unique: true, index: true },
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
    { name: 'category', type: 'relationship', relationTo: 'product-categories', label: 'Categoria', required: true, index: true },
    { name: 'summary', type: 'textarea', label: 'Resumo', required: true, maxLength: 240 },
    { name: 'description', type: 'richText', label: 'Descrição', editor: defaultLexical, required: true },
    { name: 'gallery', type: 'relationship', relationTo: 'media', hasMany: true, label: 'Galeria' },
    { name: 'technicalDocument', type: 'relationship', relationTo: 'documents', label: 'Ficha técnica PDF' },
    listField('applications', 'Aplicações'),
    {
      name: 'manometerSpecs',
      type: 'group',
      label: 'Especificações do manômetro',
      admin: { condition: (_, siblingData) => siblingData?.family === 'manometro' },
      fields: [
        {
          name: 'pressureRanges',
          type: 'array',
          label: 'Faixas de pressão',
          fields: [
            { name: 'label', type: 'text', label: 'Exibição', required: true },
            { name: 'minimum', type: 'number', label: 'Mínimo' },
            { name: 'maximum', type: 'number', label: 'Máximo' },
            { name: 'unit', type: 'text', label: 'Unidade', required: true },
          ],
        },
        listField('diameters', 'Diâmetros nominais'),
        listField('accuracyClasses', 'Classes de precisão'),
        listField('connections', 'Conexões / roscas'),
        listField('connectionPositions', 'Posições da conexão'),
        listField('caseMaterials', 'Materiais da caixa'),
        listField('wettedMaterials', 'Materiais em contato'),
        listField('fillings', 'Enchimentos'),
        listField('protectionRatings', 'Graus de proteção'),
      ],
    },
    {
      name: 'accessorySpecs',
      type: 'group',
      label: 'Especificações do acessório',
      admin: { condition: (_, siblingData) => siblingData?.family === 'acessorio' },
      fields: [
        { name: 'type', type: 'text', label: 'Subtipo' },
        listField('connections', 'Conexões / roscas'),
        listField('materials', 'Materiais'),
        { name: 'maximumPressure', type: 'text', label: 'Pressão máxima de trabalho' },
        listField('compatibility', 'Compatibilidade'),
      ],
    },
    ...seoFields,
  ],
}
