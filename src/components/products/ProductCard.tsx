import { ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import type { PublicProduct } from '@/lib/cms'

import { GaugeVisual } from '../site/GaugeVisual'

export function ProductCard({ product }: { product: PublicProduct }) {
  return (
    <article className="product-card" data-testid="product-card">
      <Link className="product-visual" href={`/produtos/${product.slug}`} tabIndex={-1} aria-hidden="true">
        {product.image ? (
          <Image src={product.image.url} alt={product.image.alt} fill sizes="(max-width: 700px) 100vw, 33vw" />
        ) : (
          <GaugeVisual compact />
        )}
        {product.demo && <span className="demo-badge">Demonstração</span>}
      </Link>
      <div className="product-card-body">
        <span className="eyebrow">{product.family === 'manometro' ? 'Manômetro' : 'Acessório'} · {product.code}</span>
        <h2><Link href={`/produtos/${product.slug}`}>{product.name}</Link></h2>
        <p>{product.summary}</p>
        <Link className="text-link" href={`/produtos/${product.slug}`}>Ver especificações <ArrowUpRight size={16} /></Link>
      </div>
    </article>
  )
}
