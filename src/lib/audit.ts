import type { PayloadRequest } from 'payload'

export type AuditEventInput = {
  action: string
  details?: Record<string, unknown>
  entityReference: string
  entityType: string
}

export async function recordAuditEvent(req: PayloadRequest, event: AuditEventInput): Promise<void> {
  const actor = req.user?.collection === 'users' ? req.user.id : undefined

  await req.payload.create({
    collection: 'audit-events',
    data: {
      actor,
      action: event.action,
      details: event.details,
      entityReference: event.entityReference,
      entityType: event.entityType,
      occurredAt: new Date().toISOString(),
    },
    overrideAccess: true,
    req,
  })
}

export async function anonymizeAuditEvents(
  req: PayloadRequest,
  entityReferences: string[],
  anonymousReference: string,
): Promise<void> {
  if (entityReferences.length === 0) return

  do {
    const events = await req.payload.find({
      collection: 'audit-events',
      depth: 0,
      limit: 100,
      overrideAccess: true,
      page: 1,
      req,
      where: {
        or: entityReferences.map((reference) => ({ entityReference: { equals: reference } })),
      },
    })

    for (const event of events.docs) {
      await req.payload.update({
        collection: 'audit-events',
        id: event.id,
        data: {
          details: { personalDataRemoved: true },
          entityReference: anonymousReference,
        },
        overrideAccess: true,
        req,
      })
    }

    if (events.docs.length === 0) break
  } while (true)
}
