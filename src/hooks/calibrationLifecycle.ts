import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionAfterReadHook, CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'

import { recordAuditEvent } from '@/lib/audit'
import { validateCertificateUpload } from '@/lib/clientPortal'

export function sanitizeCalibrationForClient<T extends Record<string, unknown>>(doc: T, user: unknown): T {
  if (!user || typeof user !== 'object' || (user as { collection?: string }).collection !== 'clients') return doc
  const sanitized = { ...doc }
  for (const field of ['filename', 'filesize', 'mimeType', 'thumbnailURL', 'url', 'width', 'height', 'focalX', 'focalY']) {
    delete sanitized[field]
  }
  return sanitized
}

export const hidePrivateUploadMetadata: CollectionAfterReadHook = ({ doc, req }) =>
  sanitizeCalibrationForClient(doc, req.user)

export const validateCalibrationUpload: CollectionBeforeValidateHook = ({ data, operation, req }) => {
  const mimeType = req.file?.mimetype || data?.mimeType
  const size = req.file?.size || data?.filesize

  if (operation === 'create' || mimeType != null || size != null) {
    const result = validateCertificateUpload(mimeType, size)
    if (result !== true) throw new APIError(result, 400)
  }

  return data
}

export const auditCalibrationChange: CollectionAfterChangeHook = async ({ doc, operation, previousDoc, req }) => {
  const replacedFile = operation === 'update' && previousDoc?.filename && previousDoc.filename !== doc.filename
  await recordAuditEvent(req, {
    action: replacedFile ? 'calibration.pdf-replaced' : `calibration.${operation === 'create' ? 'created' : 'updated'}`,
    entityReference: `calibration:${doc.id}`,
    entityType: 'calibration',
    details: { certificateNumber: doc.certificateNumber, clientID: typeof doc.client === 'object' ? doc.client.id : doc.client },
  })

  return doc
}

export const auditCalibrationDelete: CollectionAfterDeleteHook = async ({ context, doc, req }) => {
  if (context.skipCalibrationAudit) return doc

  await recordAuditEvent(req, {
    action: 'calibration.deleted',
    entityReference: `calibration:${doc.id}`,
    entityType: 'calibration',
    details: { certificateNumber: doc.certificateNumber },
  })

  return doc
}
