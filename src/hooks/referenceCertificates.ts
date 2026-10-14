import {
  APIError,
  type CollectionAfterChangeHook,
  type CollectionAfterDeleteHook,
  type CollectionAfterErrorHook,
  type CollectionAfterOperationHook,
  type CollectionBeforeChangeHook,
  type CollectionBeforeOperationHook,
  type CollectionBeforeValidateHook,
  type PayloadRequest,
  type Where,
} from 'payload'

import {
  selectReplacementReferenceCertificate,
  validateReferenceCertificateUpload,
} from '@/lib/referenceCertificates'

type RelationshipValue = number | string | { id?: number | string } | null | undefined
const draftOperations = new WeakSet<PayloadRequest>()

function relationshipID(value: RelationshipValue): number | string | undefined {
  if (typeof value === 'number' || typeof value === 'string') return value
  return value?.id
}

function shouldSkip(context: Record<string, unknown> | undefined, req: PayloadRequest): boolean {
  return Boolean(context?.skipReferenceCertificateLifecycle || req.context?.skipReferenceCertificateLifecycle)
}

export function isReferenceCertificateDraftOperation(req: PayloadRequest): boolean {
  return draftOperations.has(req)
}

export const markReferenceCertificateDraftOperation: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  if ((operation === 'create' || operation === 'update') && 'draft' in args && args.draft === true) {
    draftOperations.add(req)
  }
  return args
}

export const clearReferenceCertificateDraftOperation: CollectionAfterOperationHook = ({ req, result }) => {
  draftOperations.delete(req)
  return result
}

export const clearReferenceCertificateDraftOperationAfterError: CollectionAfterErrorHook = ({ req }) => {
  draftOperations.delete(req)
}

async function findPublishedCertificates(
  req: PayloadRequest,
  standard: number | string,
  excludeID?: number | string,
) {
  const and: Where[] = [
    { standard: { equals: standard } },
    { _status: { equals: 'published' } },
    { filename: { exists: true } },
  ]
  if (excludeID != null) and.push({ id: { not_equals: excludeID } })

  return req.payload.find({
    collection: 'reference-certificates',
    depth: 0,
    limit: 500,
    overrideAccess: true,
    req,
    draft: false,
    where: { and },
  })
}

async function promoteLatestPublished(
  req: PayloadRequest,
  standard: number | string,
  excludeID?: number | string,
) {
  const result = await findPublishedCertificates(req, standard, excludeID)
  const replacement = selectReplacementReferenceCertificate(result.docs)
  if (!replacement) return

  await req.payload.db.updateOne({
    collection: 'reference-certificates',
    id: replacement.id,
    data: { isCurrent: true },
    req,
  })
}

async function unmarkOtherPublishedCurrent(
  req: PayloadRequest,
  standard: number | string,
  excludeID?: number | string,
) {
  const result = await findPublishedCertificates(req, standard, excludeID)
  const currentOthers = result.docs.filter((certificate) => certificate.isCurrent)
  for (const certificate of currentOthers) {
    await req.payload.db.updateOne({
      collection: 'reference-certificates',
      id: certificate.id,
      data: { isCurrent: false },
      req,
    })
  }
}

export const validateReferenceCertificateFile: CollectionBeforeValidateHook = ({ data, operation, req }) => {
  const mimeType = req.file?.mimetype ?? data?.mimeType
  const size = req.file?.size ?? data?.filesize

  if (operation === 'create' || mimeType != null || size != null) {
    const validation = validateReferenceCertificateUpload(mimeType, size)
    if (validation !== true) throw new APIError(validation, 400)
  }

  return data
}

export const ensurePublishedReferenceCertificateHasCurrent: CollectionBeforeChangeHook = async ({
  context,
  data,
  originalDoc,
  req,
}) => {
  if (!data || shouldSkip(context, req) || isReferenceCertificateDraftOperation(req)) return data

  const originalStandard = relationshipID(originalDoc?.standard as RelationshipValue)
  const requestedStandard = relationshipID(data.standard as RelationshipValue)
  if (
    originalDoc?._status === 'published' &&
    requestedStandard != null &&
    originalStandard != null &&
    requestedStandard !== originalStandard
  ) {
    throw new APIError('Não é possível alterar a TAG de um certificado publicado.', 400)
  }

  const nextStatus = data._status ?? originalDoc?._status
  const nextCurrent = data.isCurrent ?? originalDoc?.isCurrent
  if (nextStatus !== 'published') return data

  const standard = relationshipID((data.standard ?? originalDoc?.standard) as RelationshipValue)
  if (standard == null) return data

  if (nextCurrent) {
    await unmarkOtherPublishedCurrent(req, standard, originalDoc?.id)
    return data
  }

  if (originalDoc?._status === 'published' && originalDoc?.isCurrent) return data

  const existing = await findPublishedCertificates(req, standard, originalDoc?.id)
  const hasCurrent = existing.docs.some((certificate) => certificate.isCurrent)
  if (!hasCurrent) {
    throw new APIError('Marque o primeiro certificado publicado desta TAG como atual.', 400)
  }

  return data
}

export const syncCurrentReferenceCertificate: CollectionAfterChangeHook = async ({
  context,
  doc,
  previousDoc,
  req,
}) => {
  if (shouldSkip(context, req) || isReferenceCertificateDraftOperation(req)) return doc

  const standard = relationshipID(doc.standard as RelationshipValue)
  if (standard == null) return doc

  if (doc._status === 'published' && doc.isCurrent) {
    await unmarkOtherPublishedCurrent(req, standard, doc.id)
    return doc
  }

  const removedCurrent = previousDoc?._status === 'published' && previousDoc?.isCurrent
  if (removedCurrent && (doc._status !== 'published' || !doc.isCurrent)) {
    await promoteLatestPublished(req, standard, doc.id)
  }

  return doc
}

export const promoteReferenceCertificateAfterDelete: CollectionAfterDeleteHook = async ({ context, doc, req }) => {
  if (shouldSkip(context, req) || doc._status !== 'published' || !doc.isCurrent) return doc

  const standard = relationshipID(doc.standard as RelationshipValue)
  if (standard != null) await promoteLatestPublished(req, standard, doc.id)

  return doc
}
