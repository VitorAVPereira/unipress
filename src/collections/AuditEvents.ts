import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/portal'

const denyAll = () => false

export const AuditEvents: CollectionConfig = {
  slug: 'audit-events',
  labels: { singular: 'Evento de auditoria', plural: 'Auditoria' },
  access: {
    admin: adminOnly,
    create: denyAll,
    delete: denyAll,
    read: adminOnly,
    update: denyAll,
  },
  admin: {
    defaultColumns: ['occurredAt', 'action', 'entityType', 'entityReference', 'actor'],
    group: 'Área do cliente',
    useAsTitle: 'action',
  },
  fields: [
    { name: 'actor', type: 'relationship', relationTo: 'users', label: 'Administrador' },
    { name: 'action', type: 'text', label: 'Ação', required: true },
    { name: 'entityType', type: 'text', label: 'Tipo de entidade', required: true },
    { name: 'entityReference', type: 'text', label: 'Referência', required: true },
    { name: 'details', type: 'json', label: 'Detalhes técnicos' },
    {
      name: 'occurredAt',
      type: 'date',
      label: 'Data e hora',
      defaultValue: () => new Date().toISOString(),
      index: true,
      required: true,
    },
  ],
  timestamps: false,
}
