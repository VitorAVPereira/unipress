import { ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import type { PublicProduct } from '@/lib/cms'
import { getMediaUrl } from '@/utilities/getMediaUrl'

import { GaugeVisual } from '../site/GaugeVisual'

export function ProductCard({ product, eager = false }: { product: PublicProduct; eager?: boolean }) {
  return (
    <article className="product-card" data-testid="product-card">
      <Link className="product-visual" href={`/produtos/${product.slug}`} tabIndex={-1} aria-hidden="true">
        {product.image ? (
          <Image
            src={getMediaUrl(product.image.url, product.image.updatedAt)}
            alt={product.image.alt}
            fill
            sizes="(max-width: 560px) 100vw, (max-width: 800px) 50vw, (max-width: 1050px) 34vw, (max-width: 1220px) 24vw, 284px"
            loading={eager ? 'eager' : 'lazy'}
          />
        ) : (
          <GaugeVisual compact />
        )}
        {product.demo && <span className="demo-badge">Demonstração</span>}
      </Link>
      <div className="product-card-body">
        <span className="eyebrow">{product.family.name} · {product.code}</span>
        <h2><Link href={`/produtos/${product.slug}`}>{product.name}</Link></h2>
        <p>{product.summary}</p>
        <Link className="text-link" href={`/produtos/${product.slug}`}>Ver especificações <ArrowUpRight size={16} /></Link>
      </div>
    </article>
  )
}
