import type { MetadataRoute } from 'next'

import { getProducts, getServices } from '@/lib/cms'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const [products, services] = await Promise.all([getProducts(), getServices()])
  const staticRoutes = ['', '/produtos', '/servicos', '/sobre', '/contato', '/privacidade']
  return [
    ...staticRoutes.map((route) => ({ url: `${base}${route}`, changeFrequency: 'weekly' as const, priority: route === '' ? 1 : 0.7 })),
    ...products.filter((item) => !item.demo).map((item) => ({ url: `${base}/produtos/${item.slug}`, changeFrequency: 'monthly' as const, priority: 0.8 })),
    ...services.filter((item) => !item.demo).map((item) => ({ url: `${base}/servicos/${item.slug}`, changeFrequency: 'monthly' as const, priority: 0.8 })),
  ]
}
