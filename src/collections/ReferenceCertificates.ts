import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/portal'
import { validateReferenceCertificateFile } from '@/hooks/referenceCertificates'
import { validateReferenceCertificateYear } from '@/lib/referenceCertificates'

export const ReferenceCertificates: CollectionConfig = {
  slug: 'reference-certificates',
  labels: { singular: 'Certificado do padrão', plural: 'Certificados dos padrões' },
  access: {
    admin: adminOnly,
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['standard', 'year', 'isCurrent', '_status', 'updatedAt'],
    group: 'Certificados dos padrões',
    useAsTitle: 'filename',
  },
  hooks: { beforeValidate: [validateReferenceCertificateFile] },
  fields: [
    {
      name: 'standard',
      type: 'relationship',
      relationTo: 'reference-standards',
      label: 'TAG / padrão',
      index: true,
      required: true,
    },
    {
      name: 'year',
      type: 'number',
      label: 'Ano do certificado',
      index: true,
      required: true,
      validate: validateReferenceCertificateYear,
    },
    {
      name: 'isCurrent',
      type: 'checkbox',
      label: 'Certificado atual',
      defaultValue: false,
      index: true,
      admin: {
        description: 'Ao publicar, substitui o certificado atual anterior desta TAG.',
      },
    },
  ],
  upload: {
    bulkUpload: false,
    displayPreview: false,
    filesRequiredOnCreate: true,
    mimeTypes: ['application/pdf'],
    pasteURL: false,
    staticDir: 'storage/reference-certificates',
  },
  versions: { drafts: { autosave: false }, maxPerDoc: 20 },
  timestamps: true,
}
