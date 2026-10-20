import { revalidatePath } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from 'payload'

import { isReferenceCertificateDraftOperation } from '@/hooks/referenceCertificates'

function revalidate(paths: Array<string | undefined>) {
  paths.filter((path): path is string => Boolean(path)).forEach((path) => revalidatePath(path))
}

export function productFamilyPaths(slugs: string[]) {
  return ['/produtos', ...slugs.map((slug) => `/produtos/${slug}`)]
}

export const revalidateProductFamily: CollectionAfterChangeHook = async ({ doc, req }) => {
  if (req.context?.disableRevalidate) return doc
  const related = await req.payload.find({
    collection: 'products',
    depth: 0,
    limit: 0,
    pagination: false,
    req,
    select: { slug: true },
    where: { family: { equals: doc.id } },
  })
  revalidate(productFamilyPaths(related.docs.map((product) => product.slug)))
  return doc
}

export const revalidateDeletedProductFamily: CollectionAfterDeleteHook = ({ doc, req }) => {
  if (!req.context?.disableRevalidate) revalidate(['/produtos'])
  return doc
}

export const revalidateProduct: CollectionAfterChangeHook = ({ doc, previousDoc, req }) => {
  const affectsPublishedContent = doc._status === 'published' || previousDoc?._status === 'published'
  if (!req.context?.disableRevalidate && affectsPublishedContent) {
    revalidate(['/', '/produtos', '/sitemap.xml', doc.slug && `/produtos/${doc.slug}`, previousDoc?.slug && `/produtos/${previousDoc.slug}`])
  }
  return doc
}

export const revalidateDeletedProduct: CollectionAfterDeleteHook = ({ doc, req }) => {
  if (!req.context?.disableRevalidate) revalidate(['/', '/produtos', '/sitemap.xml', doc.slug && `/produtos/${doc.slug}`])
  return doc
}

export function revalidateProductOrder() {
  revalidate(['/', '/produtos', '/sitemap.xml'])
}

export const revalidateService: CollectionAfterChangeHook = ({ doc, previousDoc, req }) => {
  const affectsPublishedContent = doc._status === 'published' || previousDoc?._status === 'published'
  if (!req.context?.disableRevalidate && affectsPublishedContent) {
    revalidate(['/', '/servicos', '/sitemap.xml', doc.slug && `/servicos/${doc.slug}`, previousDoc?.slug && `/servicos/${previousDoc.slug}`])
  }
  return doc
}

export const revalidateDeletedService: CollectionAfterDeleteHook = ({ doc, req }) => {
  if (!req.context?.disableRevalidate) revalidate(['/', '/servicos', '/sitemap.xml', doc.slug && `/servicos/${doc.slug}`])
  return doc
}

export const revalidateReferenceCertificate: CollectionAfterChangeHook = ({ doc, previousDoc, req }) => {
  const affectsPublishedContent = doc._status === 'published' || previousDoc?._status === 'published'
  if (!req.context?.skipReferenceCertificateLifecycle && !isReferenceCertificateDraftOperation(req) && affectsPublishedContent) {
    revalidate(['/certificados-padroes'])
  }
  return doc
}

export const revalidateDeletedReferenceCertificate: CollectionAfterDeleteHook = ({ doc, req }) => {
  if (!req.context?.skipReferenceCertificateLifecycle && doc._status === 'published') {
    revalidate(['/certificados-padroes'])
  }
  return doc
}

export const revalidateReferenceStandard: CollectionAfterChangeHook = ({ doc, req }) => {
  if (!req.context?.skipReferenceCertificateLifecycle) revalidate(['/certificados-padroes'])
  return doc
}

export const revalidateDeletedReferenceStandard: CollectionAfterDeleteHook = ({ doc, req }) => {
  if (!req.context?.skipReferenceCertificateLifecycle) revalidate(['/certificados-padroes'])
  return doc
}

export const revalidateGlobal: GlobalAfterChangeHook = ({ doc, global, req }) => {
  if (req.context?.disableRevalidate) return doc
  const paths: Record<string, string[]> = {
    'site-settings': ['/', '/produtos', '/servicos', '/sobre', '/contato', '/privacidade'],
    home: ['/'],
    'services-page': ['/servicos'],
    about: ['/sobre'],
    contact: ['/contato'],
    privacy: ['/privacidade'],
  }
  revalidate(paths[global.slug] || [])
  return doc
}
