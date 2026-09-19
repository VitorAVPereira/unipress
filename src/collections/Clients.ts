import type { CollectionConfig } from 'payload'

import { adminOnly, clientsReadAccess } from '@/access/portal'
import { escapeHTML, normalizeCNPJ, normalizeEmail, validateCNPJ } from '@/lib/clientPortal'
import {
  activateClientAfterPasswordReset,
  handleClientChange,
  prepareClientAccount,
  requireActiveClient,
} from '@/hooks/clientLifecycle'
import { getServerSideURL } from '@/utilities/getURL'
import { clientAdminEndpoints } from '@/endpoints/clientAdmin'

const denyDelete = () => false

export const Clients: CollectionConfig = {
  slug: 'clients',
  labels: { singular: 'Cliente', plural: 'Clientes' },
  access: {
    admin: adminOnly,
    create: adminOnly,
    delete: denyDelete,
    read: clientsReadAccess,
    update: adminOnly,
  },
  endpoints: clientAdminEndpoints,
  admin: {
    components: { edit: { beforeDocumentControls: ['@/components/admin/ClientActions'] } },
    defaultColumns: ['legalName', 'cnpj', 'email', 'status'],
    group: 'Área do cliente',
    useAsTitle: 'legalName',
  },
  auth: {
    forgotPassword: {
      expiration: 24 * 60 * 60 * 1000,
      generateEmailHTML: (args) => {
        const { token, user } = args || {}
        const resetURL = `${getServerSideURL()}/area-do-cliente/redefinir-senha?token=${encodeURIComponent(token || '')}`
        return `<p>Olá, ${escapeHTML(String(user.legalName || 'cliente'))}.</p><p>Use o link abaixo para definir ou redefinir sua senha de acesso aos certificados UniPress. O link expira em 24 horas.</p><p><a href="${escapeHTML(resetURL)}">Definir minha senha</a></p>`
      },
      generateEmailSubject: () => 'Defina sua senha da Área do Cliente UniPress',
    },
    lockTime: 15 * 60 * 1000,
    maxLoginAttempts: 5,
    tokenExpiration: 8 * 60 * 60,
    useAPIKey: false,
    useSessions: true,
  },
  hooks: {
    afterChange: [handleClientChange],
    afterOperation: [activateClientAfterPasswordReset],
    beforeLogin: [requireActiveClient],
    beforeValidate: [prepareClientAccount],
  },
  fields: [
    {
      name: 'legalName',
      type: 'text',
      label: 'Razão social',
      required: true,
    },
    {
      name: 'cnpj',
      type: 'text',
      label: 'CNPJ',
      required: true,
      unique: true,
      hooks: {
        beforeValidate: [({ value }) => (typeof value === 'string' ? normalizeCNPJ(value) : value)],
      },
      validate: (value: unknown) =>
        typeof value === 'string' && validateCNPJ(value) ? true : 'Informe um CNPJ com 14 dígitos.',
    },
    {
      name: 'email',
      type: 'email',
      label: 'E-mail de acesso',
      required: true,
      unique: true,
      hooks: {
        beforeValidate: [({ value }) => (typeof value === 'string' ? normalizeEmail(value) : value)],
      },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      defaultValue: 'pending',
      required: true,
      saveToJWT: true,
      options: [
        { label: 'Convite pendente', value: 'pending' },
        { label: 'Ativo', value: 'active' },
        { label: 'Inativo', value: 'inactive' },
      ],
    },
    {
      name: 'inviteDeliveryStatus',
      type: 'select',
      label: 'Entrega do convite',
      defaultValue: 'pending',
      admin: { readOnly: true },
      options: [
        { label: 'Aguardando envio', value: 'pending' },
        { label: 'Enviado', value: 'sent' },
        { label: 'Falhou', value: 'failed' },
        { label: 'Aceito', value: 'accepted' },
      ],
    },
    {
      name: 'inviteSentAt',
      type: 'date',
      label: 'Último convite enviado em',
      admin: { readOnly: true },
    },
  ],
  timestamps: true,
}
