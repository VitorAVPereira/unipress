import type { CollectionBeforeValidateHook } from 'payload'

import { normalizeReferenceTag, validateReferenceTag } from '@/lib/referenceCertificates'

export const prepareReferenceStandard: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) return data

  const tag = typeof data.tag === 'string' ? data.tag.trim() : data.tag
  const validation = validateReferenceTag(tag)

  return {
    ...data,
    tag,
    searchKey: validation === true ? normalizeReferenceTag(tag) : '',
  }
}
