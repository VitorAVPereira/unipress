import { revalidatePath } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from 'payload'

function revalidate(paths: Array<string | undefined>) {
  paths.filter((path): path is string => Boolean(path)).forEach((path) => revalidatePath(path))
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

export const revalidateGlobal: GlobalAfterChangeHook = ({ doc, global, req }) => {
  if (req.context?.disableRevalidate) return doc
  const paths: Record<string, string[]> = {
    'site-settings': ['/', '/produtos', '/servicos', '/sobre', '/contato', '/privacidade'],
    home: ['/'],
    about: ['/sobre'],
    contact: ['/contato'],
    privacy: ['/privacidade'],
  }
  revalidate(paths[global.slug] || [])
  return doc
}
