import { randomBytes } from 'crypto'
import type {
  CollectionAfterChangeHook,
  CollectionAfterOperationHook,
  CollectionBeforeLoginHook,
  CollectionBeforeValidateHook,
} from 'payload'
import { APIError } from 'payload'

import { recordAuditEvent } from '@/lib/audit'
import { canClientLogin } from '@/lib/clientPortal'

const skipLifecycle = { skipClientLifecycle: true }

export const prepareClientAccount: CollectionBeforeValidateHook = ({ data, operation }) => {
  if (operation === 'create' && data) {
    data.password = randomBytes(32).toString('base64url')
  }

  return data
}

export const requireActiveClient: CollectionBeforeLoginHook = ({ user }) => {
  if (!canClientLogin(user.status)) throw new APIError('E-mail ou senha inválidos.', 401)

  return user
}

export const handleClientChange: CollectionAfterChangeHook = async ({ context, doc, operation, previousDoc, req }) => {
  if (context.skipClientLifecycle) return doc

  const reference = `client:${doc.id}`
  await recordAuditEvent(req, {
    action: operation === 'create' ? 'client.created' : 'client.updated',
    entityReference: reference,
    entityType: 'client',
    details: { status: doc.status },
  })

  if (operation === 'create') {
    try {
      await req.payload.forgotPassword({
        collection: 'clients',
        data: { email: doc.email },
        req,
      })
      await req.payload.update({
        collection: 'clients',
        id: doc.id,
        data: { inviteDeliveryStatus: 'sent', inviteSentAt: new Date().toISOString() },
        context: skipLifecycle,
        overrideAccess: true,
        req,
      })
      await recordAuditEvent(req, {
        action: 'client.invite-sent',
        entityReference: reference,
        entityType: 'client',
      })
    } catch (error) {
      req.payload.logger.error({ err: error, clientID: doc.id }, 'Falha ao enviar convite de cliente')
      await req.payload.update({
        collection: 'clients',
        id: doc.id,
        data: { inviteDeliveryStatus: 'failed' },
        context: skipLifecycle,
        overrideAccess: true,
        req,
      })
    }
  }

  if (doc.status === 'inactive' && previousDoc?.status !== 'inactive') {
    await req.payload.update({
      collection: 'clients',
      id: doc.id,
      data: { sessions: [] },
      context: skipLifecycle,
      overrideAccess: true,
      req,
    })
    await recordAuditEvent(req, {
      action: 'client.deactivated',
      entityReference: reference,
      entityType: 'client',
      details: { sessionsRevoked: true },
    })
  }

  if (doc.status === 'active' && previousDoc?.status === 'inactive') {
    await recordAuditEvent(req, {
      action: 'client.reactivated',
      entityReference: reference,
      entityType: 'client',
    })
  }

  return doc
}

export const activateClientAfterPasswordReset: CollectionAfterOperationHook<'clients'> = async ({ operation, req, result }) => {
  if (operation !== 'resetPassword' || !result || typeof result !== 'object' || !('user' in result)) return result

  const user = result.user as { id?: number | string } | null | undefined
  if (user?.id != null) {
    await req.payload.update({
      collection: 'clients',
      id: user.id,
      data: { inviteDeliveryStatus: 'accepted', status: 'active' },
      context: skipLifecycle,
      overrideAccess: true,
      req,
    })
    await recordAuditEvent(req, {
      action: 'client.password-defined',
      entityReference: `client:${user.id}`,
      entityType: 'client',
    })
  }

  return result
}
