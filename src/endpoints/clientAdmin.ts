import { randomUUID } from 'crypto'
import type { Endpoint, PayloadRequest } from 'payload'

import { anonymizeAuditEvents, recordAuditEvent } from '@/lib/audit'

function isAdminRequest(req: PayloadRequest): boolean {
  return req.user?.collection === 'users'
}

function routeID(req: PayloadRequest): number | string | undefined {
  const id = req.routeParams?.id
  return typeof id === 'string' || typeof id === 'number' ? id : undefined
}

async function requireClient(req: PayloadRequest) {
  const id = routeID(req)
  if (id == null) return null

  try {
    return await req.payload.findByID({ collection: 'clients', id, overrideAccess: true, req })
  } catch {
    return null
  }
}

function forbidden() {
  return Response.json({ error: 'Acesso negado.' }, { status: 403 })
}

function notFound() {
  return Response.json({ error: 'Cliente não encontrado.' }, { status: 404 })
}

export const clientAdminEndpoints: Endpoint[] = [
  {
    path: '/:id/resend-invite',
    method: 'post',
    handler: async (req) => {
      if (!isAdminRequest(req)) return forbidden()
      const client = await requireClient(req)
      if (!client) return notFound()

      try {
        await req.payload.forgotPassword({ collection: 'clients', data: { email: client.email }, req })
        await req.payload.update({
          collection: 'clients',
          id: client.id,
          data: { inviteDeliveryStatus: 'sent', inviteSentAt: new Date().toISOString() },
          context: { skipClientLifecycle: true },
          overrideAccess: true,
          req,
        })
        await recordAuditEvent(req, {
          action: 'client.invite-resent',
          entityReference: `client:${client.id}`,
          entityType: 'client',
        })
        return Response.json({ success: true })
      } catch (error) {
        req.payload.logger.error({ err: error, clientID: client.id }, 'Falha ao reenviar convite')
        await req.payload.update({
          collection: 'clients',
          id: client.id,
          data: { inviteDeliveryStatus: 'failed' },
          context: { skipClientLifecycle: true },
          overrideAccess: true,
          req,
        })
        return Response.json({ error: 'Não foi possível enviar o convite.' }, { status: 502 })
      }
    },
  },
  ...(['deactivate', 'reactivate'] as const).map<Endpoint>((action) => ({
    path: `/:id/${action}`,
    method: 'post',
    handler: async (req) => {
      if (!isAdminRequest(req)) return forbidden()
      const client = await requireClient(req)
      if (!client) return notFound()
      const status = action === 'deactivate' ? 'inactive' : 'active'

      await req.payload.update({
        collection: 'clients',
        id: client.id,
        data: { status },
        overrideAccess: true,
        req,
      })
      return Response.json({ success: true, status })
    },
  })),
  {
    path: '/:id/permanent-delete',
    method: 'post',
    handler: async (req) => {
      if (!isAdminRequest(req)) return forbidden()
      const client = await requireClient(req)
      if (!client) return Response.json({ alreadyDeleted: true, success: true })
      const body = (req.json ? await req.json().catch(() => ({})) : {}) as { confirmation?: string }
      if (body.confirmation !== client.legalName) {
        return Response.json({ error: 'A razão social informada não confere.' }, { status: 400 })
      }

      await req.payload.update({
        collection: 'clients',
        id: client.id,
        data: { sessions: [], status: 'inactive' },
        context: { skipClientLifecycle: true },
        overrideAccess: true,
        req,
      })

      const anonymousReference = `deleted-client:${randomUUID()}`
      do {
        const calibrations = await req.payload.find({
          collection: 'calibrations',
          where: { client: { equals: client.id } },
          depth: 0,
          limit: 100,
          page: 1,
          overrideAccess: true,
          req,
        })
        for (const calibration of calibrations.docs) {
          await anonymizeAuditEvents(
            req,
            [`calibration:${calibration.id}`],
            anonymousReference,
          )
          await req.payload.delete({
            collection: 'calibrations',
            id: calibration.id,
            context: { skipCalibrationAudit: true },
            overrideAccess: true,
            req,
          })
        }
        if (calibrations.docs.length === 0) break
      } while (true)

      await anonymizeAuditEvents(req, [`client:${client.id}`], anonymousReference)
      await req.payload.delete({ collection: 'clients', id: client.id, overrideAccess: true, req })
      await recordAuditEvent(req, {
        action: 'client.permanently-deleted',
        entityReference: anonymousReference,
        entityType: 'client',
        details: { personalDataRemoved: true },
      })

      return Response.json({ success: true })
    },
  },
]
