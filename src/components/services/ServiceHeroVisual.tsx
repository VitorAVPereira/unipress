import { ShieldCheck } from 'lucide-react'
import Image from 'next/image'

type ServiceHeroImage = { url: string; alt: string }

export function ServiceHeroVisual({ image }: { image?: ServiceHeroImage }) {
  if (image?.url) {
    return (
      <div className="service-hero-image">
        <Image src={image.url} alt={image.alt} fill sizes="(max-width: 800px) 100vw, 340px" />
      </div>
    )
  }

  return (
    <div className="calibration-emblem" aria-hidden="true">
      <ShieldCheck />
      <strong>RBC</strong>
      <span>Rastreabilidade</span>
    </div>
  )
}
