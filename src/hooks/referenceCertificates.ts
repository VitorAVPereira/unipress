import { APIError, type CollectionBeforeValidateHook } from 'payload'

import { validateReferenceCertificateUpload } from '@/lib/referenceCertificates'

export const validateReferenceCertificateFile: CollectionBeforeValidateHook = ({ data, operation, req }) => {
  const mimeType = req.file?.mimetype ?? data?.mimeType
  const size = req.file?.size ?? data?.filesize

  if (operation === 'create' || mimeType != null || size != null) {
    const validation = validateReferenceCertificateUpload(mimeType, size)
    if (validation !== true) throw new APIError(validation, 400)
  }

  return data
}
