import { randomBytes } from 'crypto'
import type {
  CollectionAfterChangeHook,
  CollectionBeforeOperationHook,
  CollectionBeforeLoginHook,
  CollectionBeforeValidateHook,
  PayloadRequest,
} from 'payload'
import { APIError } from 'payload'

import { recordAuditEvent } from '@/lib/audit'
import { canClientLogin } from '@/lib/clientPortal'

const skipLifecycle = { skipClientLifecycle: true }
const passwordResetRequests = new WeakSet<PayloadRequest>()

export const trackClientPasswordReset: CollectionBeforeOperationHook = ({ operation, req }) => {
  if (operation === 'resetPassword') passwordResetRequests.add(req)
  else if (operation === 'login') passwordResetRequests.delete(req)
}

export const prepareClientAccount: CollectionBeforeValidateHook = ({ data, operation }) => {
  if (operation === 'create' && data) {
    data.password = randomBytes(32).toString('base64url')
  }

  return data
}

export const requireActiveClient: CollectionBeforeLoginHook = async ({ user, req }) => {
  // Payload invokes beforeLogin after validating the reset token and saving the
  // password, but before committing the transaction. Activate invitations here.
  const isPasswordReset = passwordResetRequests.delete(req)
  if (isPasswordReset && user.status === 'pending') {
    await req.payload.update({
      collection: 'clients',
      id: user.id,
      data: { inviteDeliveryStatus: 'accepted', status: 'active' },
      context: skipLifecycle,
      overrideAccess: true,
      req,
    })
    user = { ...user, inviteDeliveryStatus: 'accepted', status: 'active' }
  }

  if (!canClientLogin(user.status)) throw new APIError('E-mail ou senha inválidos.', 401)

  if (isPasswordReset) {
    await recordAuditEvent(req, {
      action: 'client.password-defined',
      entityReference: `client:${user.id}`,
      entityType: 'client',
    })
  }

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
