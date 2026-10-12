import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/portal'
import { prepareReferenceStandard } from '@/hooks/referenceStandards'
import { validateReferenceTag } from '@/lib/referenceCertificates'

export const ReferenceStandards: CollectionConfig = {
  slug: 'reference-standards',
  labels: { singular: 'Padrão', plural: 'Padrões' },
  access: {
    admin: adminOnly,
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['tag', 'visible', 'updatedAt'],
    group: 'Certificados dos padrões',
    useAsTitle: 'tag',
  },
  hooks: { beforeValidate: [prepareReferenceStandard] },
  fields: [
    {
      name: 'tag',
      type: 'text',
      label: 'TAG / identificação',
      index: true,
      required: true,
      unique: true,
      validate: validateReferenceTag,
    },
    {
      name: 'searchKey',
      type: 'text',
      admin: { hidden: true, readOnly: true },
      index: true,
      required: true,
      unique: true,
    },
    {
      name: 'visible',
      type: 'checkbox',
      label: 'Visível na página pública',
      defaultValue: true,
      index: true,
    },
  ],
  timestamps: true,
}
