'use client'

import { RelationshipField, useField } from '@payloadcms/ui'
import type { RelationshipFieldClientComponent } from 'payload'
import { useEffect } from 'react'

type FamilyRelationshipValue = number | string | { value?: number | string } | null | undefined

function familyIDFromValue(value: FamilyRelationshipValue) {
  if (typeof value === 'number' || typeof value === 'string') return value
  return value?.value
}

export const ProductFamilyField: RelationshipFieldClientComponent = (props) => {
  const family = useField<FamilyRelationshipValue>({ path: props.path })
  const { setValue: setProfile } = useField<string>({ path: 'familyProfile' })
  const familyID = familyIDFromValue(family.value)

  useEffect(() => {
    if (familyID === undefined || familyID === null || familyID === '') {
      setProfile('generico')
      return
    }

    const controller = new AbortController()
    void fetch(`/api/product-families/${familyID}?depth=0`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('Família indisponível'))))
      .then((document: { technicalProfile?: string }) => setProfile(document.technicalProfile || 'generico'))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) setProfile('generico')
      })

    return () => controller.abort()
  }, [familyID, setProfile])

  return <RelationshipField {...props} />
}
