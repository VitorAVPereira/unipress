export type PreviewContent = 'products' | 'services' | 'home' | 'about' | 'contact' | 'privacy'

const staticPaths: Record<Exclude<PreviewContent, 'products' | 'services'>, string> = {
  home: '/',
  about: '/sobre',
  contact: '/contato',
  privacy: '/privacidade',
}

export function publicPathForContent(content: PreviewContent, slug?: string) {
  if (content === 'products' || content === 'services') {
    if (!slug) throw new Error('Um slug é obrigatório para pré-visualizar este conteúdo.')
    const prefix = content === 'products' ? '/produtos' : '/servicos'
    return `${prefix}/${encodeURIComponent(slug)}`
  }

  return staticPaths[content]
}

export function generatePreviewPath({
  collection,
  slug,
  secret = process.env.PREVIEW_SECRET || '',
}: {
  collection: PreviewContent
  slug?: string
  secret?: string
}) {
  const params = new URLSearchParams({
    path: publicPathForContent(collection, slug),
    previewSecret: secret,
  })

  return `/next/preview?${params.toString()}`
}

export function generatePreviewPathWhenReady({
  collection,
  slug,
}: {
  collection: 'products' | 'services'
  slug?: unknown
}) {
  const normalizedSlug = typeof slug === 'string' ? slug.trim() : ''

  return normalizedSlug ? generatePreviewPath({ collection, slug: normalizedSlug }) : null
}
