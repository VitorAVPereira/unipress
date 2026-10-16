import { ShieldCheck } from 'lucide-react'
import Image from 'next/image'

import { getMediaUrl } from '@/utilities/getMediaUrl'

type ServiceHeroImage = { url: string; alt: string; updatedAt?: string }

export function ServiceHeroVisual({ image }: { image?: ServiceHeroImage }) {
  if (image?.url) {
    return (
      <div className="service-hero-image">
        <Image
          src={getMediaUrl(image.url, image.updatedAt)}
          alt={image.alt}
          fill
          sizes="(max-width: 800px) 100vw, 340px"
        />
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
