import type { CollectionBeforeValidateHook } from 'payload'

export const syncProductFamilyProfile: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  if (!data) return data

  const relation = data.family ?? originalDoc?.family
  const familyID = typeof relation === 'object' && relation ? relation.id : relation
  if (typeof familyID !== 'number' && typeof familyID !== 'string') return data

  const family = await req.payload.findByID({
    collection: 'product-families',
    id: familyID,
    depth: 0,
    req,
  })

  data.familyProfile = family.technicalProfile
  return data
}
